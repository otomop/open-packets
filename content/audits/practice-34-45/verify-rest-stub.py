"""Re-run only chapter 41's embedded teaching handler and selected JSON checks.
No external requests, credentials, device actions, or fixed-port listener.
"""
import contextlib
import http.client
import io
import json
import os
from pathlib import Path
import re
import tempfile
import threading

root = Path(__file__).resolve().parents[3]
lab = (root / "content/chapters/41-rest-apis-json/lab.md").read_text(encoding="utf-8")
blocks = re.findall(r"```python\n(.*?)\n```", lab, flags=re.S)
assert len(blocks) == 2
namespace = {"__name__": "chapter41_verification"}
exec(compile(blocks[0], "<embedded api_lab.py>", "exec"), namespace)
namespace["Handler"].log_message = lambda *args: None
server = namespace["HTTPServer"](("127.0.0.1", 0), namespace["Handler"])
worker = threading.Thread(target=server.serve_forever, daemon=True)
worker.start()
checks = 0

def request(path, token=None):
    global checks
    conn = http.client.HTTPConnection("127.0.0.1", server.server_port, timeout=3)
    try:
        headers = {"Accept": "application/json"}
        if token:
            headers["Authorization"] = "Bearer " + token
        conn.request("GET", path, headers=headers)
        response = conn.getresponse()
        body = response.read()
        checks += 1
        return response.status, dict(response.getheaders()), json.loads(body)
    finally:
        conn.close()

try:
    status, headers, inventory = request("/api/devices", "lab-read-token")
    assert status == 200 and headers["Content-Type"] == "application/json"
    assert len(inventory["response"]) == 2
    assert inventory["response"][1]["hostname"] == "R2"
    assert type(inventory["response"][0]["ports"]) is int
    assert type(inventory["response"][1]["ports"]) is str
    status, headers, body = request("/api/devices")
    assert status == 401 and "WWW-Authenticate" in headers
    assert request("/api/devices", "wrong-token")[0] == 401
    assert request("/api/admin", "lab-read-token")[0] == 403
    status, headers, body = request("/api/admin", "lab-admin-token")
    assert status == 200 and body == {"role": "admin", "changed": False}
    status, headers, body = request("/api/devices?hostname=R9", "lab-read-token")
    assert status == 200 and body["response"] == []
    status, headers, body = request("/api/devices?hostname=R2", "lab-read-token")
    assert status == 200 and len(body["response"]) == 1 and body["response"][0]["hostname"] == "R2"
    assert request("/api/missing", "lab-read-token")[0] == 404
    original = Path.cwd()
    with tempfile.TemporaryDirectory(prefix="ccna-json-verify-") as temp:
        os.chdir(temp)
        try:
            encoded = json.dumps(inventory)
            for content, exception in [
                (encoded, None),
                (encoded.replace("true", "True", 1), json.JSONDecodeError),
                (encoded.replace("true", '"true"', 1), AssertionError),
                (encoded, None),
                ('{"response":[],"extra":NaN}', ValueError),
            ]:
                Path("inventory.json").write_text(content, encoding="utf-8")
                try:
                    with contextlib.redirect_stdout(io.StringIO()):
                        exec(compile(blocks[1], "<embedded validate_lab.py>", "exec"), {})
                except Exception as error:
                    assert exception and isinstance(error, exception), repr(error)
                else:
                    assert exception is None, "Expected selected validation failure"
                checks += 1
        finally:
            os.chdir(original)
finally:
    server.shutdown()
    server.server_close()
    worker.join(timeout=3)
assert not worker.is_alive()
print(f"PASS: {checks} local HTTP/JSON cases; listener closed; temporary data removed.")
