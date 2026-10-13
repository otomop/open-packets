---
title: "Read a local HTTP API and validate JSON"
environment: mixed
devices: ["One Windows, macOS or Linux computer", "Python 3.9+ and curl", "Two local terminal windows"]
minutes: 65
---

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

The required outcome is interpreting requests, statuses and JSON, which you can complete as a 30-minute worksheet using the supplied observations. Running the service is an optional hands-on path; allow about 65 minutes including setup. Mark each recorded result as observed locally or reasoned from the supplied case.

For the hands-on path, run a small, supplied **teaching service** on your own computer. It returns deterministic inventory data and lets you distinguish 200, 401, 403 and 404 without a public sandbox. It is not a production controller, a full REST implementation or RESTCONF. Its fictional tokens protect no real resource. The service binds only to IPv4 loopback and intentionally uses HTTP; real credentials require authenticated HTTPS.

## Topology

```diagram
{"type":"sequence","title":"Loopback-only practice","actors":["Terminal B: curl","127.0.0.1:8765 teaching service"],"steps":[{"from":0,"to":1,"label":"GET /api/devices","note":"fictional Bearer token","accent":true},{"from":1,"to":0,"label":"200 application/json","note":"two fixed device records"}],"caption":"Client and service run on the same computer; no router, external link or public account is involved."}
```

| Setting | Exact lab value |
|---|---|
| Bind address | 127.0.0.1 only |
| TCP port | 8765 |
| Inventory path | /api/devices |
| Restricted path | /api/admin |
| Read credential | lab-read-token |
| Write-role credential | lab-admin-token |

The admin endpoint is still a GET and does not change anything. Role names are invented for this exercise. The implemented query is an exact, case-sensitive hostname match. Unknown paths return 404 after credential checking; no matching hostname returns an empty array with 200. No write methods are implemented.

## Step 1: Choose the worksheet or local execution path

For a worksheet, skip installing software and copying Python: read the service contract, then record predictions and compare them with the supplied responses in Steps 3–16. For local execution, create an empty folder named `ccna-api-lab` in your documents area and open two terminals in it. Use your text editor to save files as plain UTF-8. Do not place unrelated sensitive files in the folder.

A terminal's **current directory** is the folder used for relative filenames such as `inventory.json`. Create the folder with your file manager, then use `cd` followed by its full path in quotes in each terminal. `Get-Location` in PowerShell or `pwd` on macOS/Linux shows the current directory; both terminals must show your lab folder. The editor must save the supplied files into that same folder, with their exact extensions.

On Windows PowerShell:

```powershell
python --version
curl.exe --version
```

On macOS/Linux:

```bash
python3 --version
curl --version
```

The remaining commands show Windows names; substitute `python3` and `curl` on macOS/Linux. If Windows uses the Python launcher, substitute `py -3` for `python`. If tools are absent, install Python from python.org and curl using its official platform instructions or your OS package manager, then reopen the terminal. No Python packages are needed.

:::expected
Python is version 3.9 or later and curl identifies itself. Windows PowerShell 5.1 may alias plain curl to another command, which is why `curl.exe` is explicit. If installation is unavailable, interpret the expected exchanges on paper and record that execution was not performed.
:::

## Step 2: Create the teaching service

Save this complete code as `api_lab.py`. You need not memorize its implementation; the exercise is reading requests and responses.

```python
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlsplit, parse_qs

DEVICES = [
    {"id": "r1", "hostname": "R1", "enabled": True, "ports": 3},
    {"id": "r2", "hostname": "R2", "enabled": False, "ports": "3"},
]
ROLES = {"lab-read-token": "read", "lab-admin-token": "admin"}

class Handler(BaseHTTPRequestHandler):
    def reply(self, status, body, challenge=False):
        data = json.dumps(body, allow_nan=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        if challenge:
            self.send_header("WWW-Authenticate", 'Bearer realm="ccna-lab"')
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        scheme, _, token = self.headers.get("Authorization", "").partition(" ")
        role = ROLES.get(token) if scheme.lower() == "bearer" else None
        if role is None:
            self.reply(401, {"error": "valid lab token required"}, True)
            return
        target = urlsplit(self.path)
        if target.path == "/api/admin":
            if role != "admin":
                self.reply(403, {"error": "admin role required"})
            else:
                self.reply(200, {"role": role, "changed": False})
            return
        if target.path != "/api/devices":
            self.reply(404, {"error": "resource not found"})
            return
        name = parse_qs(target.query).get("hostname", [None])[0]
        matches = [d for d in DEVICES if name is None or d["hostname"] == name]
        self.reply(200, {"response": matches, "next": None})

    def log_message(self, message, *args):
        print(message % args)

if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", 8765), Handler)
    print("Teaching service: http://127.0.0.1:8765 (Ctrl+C to stop)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
```

In Terminal A:

```powershell
python api_lab.py
```

:::expected
The service announces 127.0.0.1:8765 and stays running. If that port is already in use, stop only an earlier copy of this lab that you recognize, or choose a different unused port in the script and every later URL. Do not bind to 0.0.0.0 or publish this teaching service.
:::

## Step 3: Read inventory with the supplied credential

`curl` is the HTTP client for this exercise. With no data or method override, these requests use GET. `-i` includes response headers in the display; each `-H` supplies one request header. Quoting keeps a header containing spaces together as one argument. The URL names the local service started in Terminal A.

Before running, identify the method, path, credential header and requested response format. Predict the outer JSON type and distinguish a successful inventory read from permission to change a device.

In Terminal B:

```powershell
curl.exe -i -H "Authorization: Bearer lab-read-token" -H "Accept: application/json" http://127.0.0.1:8765/api/devices
```

:::expected
The response has status 200 and `Content-Type: application/json`. The body contains two records in `response` and `next: null`. Python's small server may use an HTTP/1.0 response line; that does not change these status or JSON meanings. `-i` prints response headers, not the outgoing request.
:::

## Step 4: Observe missing authentication

Predict whether removing only the credential changes the resource path or the access decision. Omit the credential:

```powershell
curl.exe -i http://127.0.0.1:8765/api/devices
```

Record the status, challenge header and body before repairing.

:::expected
401, a Bearer `WWW-Authenticate` challenge and the error `valid lab token required`. No inventory body is returned. This result follows the supplied service's contract, not an assumption that every network timeout means bad credentials.
:::

## Step 5: Restore the credential

Repeat the successful Step 3 request unchanged.

:::expected
The status returns to 200. You changed the authentication context, not the path, protocol or stored device data.
:::

## Step 6: Observe insufficient permission

Predict how missing credentials differ from a valid credential with an insufficient role. Use the valid read credential on the restricted endpoint:

```powershell
curl.exe -i -H "Authorization: Bearer lab-read-token" http://127.0.0.1:8765/api/admin
```

:::expected
403 and `admin role required`. Here the code explicitly authenticated the supplied read token before denying its role. In an arbitrary API, 403 alone does not establish all of those internal steps.
:::

## Step 7: Use the correct fictional role

```powershell
curl.exe -i -H "Authorization: Bearer lab-admin-token" http://127.0.0.1:8765/api/admin
```

:::expected
200 with `{"role":"admin","changed":false}`, allowing for spaces. The name admin does not make GET a write operation; the endpoint reports a role and makes no change.
:::

## Step 8: Distinguish an empty collection from a missing path

Predict each status and array length, then run separately:

```powershell
curl.exe -i -H "Authorization: Bearer lab-read-token" "http://127.0.0.1:8765/api/devices?hostname=R9"
curl.exe -i -H "Authorization: Bearer lab-read-token" http://127.0.0.1:8765/api/missing
```

:::expected
The documented filter matches no devices and returns 200 with an empty `response` array. The unknown path returns 404. These behaviors are deliberately implemented here; check another API's contract rather than assuming every collection behaves identically.
:::

## Step 9: Save and inspect the body without headers

```powershell
curl.exe --silent --show-error -H "Authorization: Bearer lab-read-token" --output inventory.json http://127.0.0.1:8765/api/devices
python -m json.tool inventory.json
```

Open `inventory.json` in the editor. Identify its outer type, array length, `response[1].hostname` and the type of each `ports` value. The next section supplies a parser check with explicit limits.

:::solution Check the saved-body interpretation
Object; two records; R2; first ports is a number and second ports is a string. There are no HTTP headers in the saved file because `-i` was omitted. A saved error body can also be valid JSON, so inspect the response status when diagnosing an actual API failure.
:::

## Step 10: Validate syntax and schema separately

Save `validate_lab.py` with this code:

```python
import json
from pathlib import Path

def reject_constant(value):
    raise ValueError("Not a JSON number: " + value)

data = json.loads(
    Path("inventory.json").read_text(encoding="utf-8"),
    parse_constant=reject_constant,
)
assert isinstance(data, dict), "Expected an object"
assert isinstance(data.get("response"), list), "Expected response array"
for device in data["response"]:
    assert isinstance(device, dict), "Expected a device object"
    assert isinstance(device.get("hostname"), str), "Expected hostname string"
    assert type(device.get("enabled")) is bool, "Expected enabled boolean"
print("Lab syntax and selected schema checks passed")
```

Run `python validate_lab.py`. This checks the listed schema fields and rejects NaN/Infinity extensions. It is not a complete generic schema validator and does not detect every interoperability problem, such as duplicate names.

:::expected
The supplied body passes. JSON syntax and the selected field types are checked separately; the intentionally different ports types are not rejected because this small schema does not constrain them.
:::

## Step 11: Observe a syntax fault before repairing it

In the saved local `inventory.json` only, replace the first lowercase `true` with `True`. Do not modify the service. Predict the failure stage and run `python validate_lab.py`. Record the error before making another edit. A worksheet learner should identify which token violates JSON syntax.

:::solution Check the predicted stage
`True` is not a JSON literal, so decoding fails before the selected field-type assertions. No successful schema decision can be inferred from a parse failure.
:::

## Step 12: Restore the syntax baseline

Fetch a fresh body with the Step 9 curl request and run `python validate_lab.py` again. Confirm the first device's `enabled` value is the boolean `true`.

:::expected
The selected checks pass again. This reread from the unchanged service restores the original document rather than leaving another accidental edit in the fault copy.
:::

## Step 13: Observe a different, valid-JSON fault

Change the first `true` to `"true"` in the local copy. Predict whether a general JSON decoder and this lab's schema check will agree. Run the validator and preserve its result before repairing.

:::solution Check the two decisions
The quoted value is a valid JSON string. Decoding succeeds, then the selected boolean-field check fails. Indenting or pretty-printing the document would not change that type.
:::

## Step 14: Restore and select the operation from its contract

Fetch the unmodified body again and rerun the validator. Then complete this separate paper worksheet; the local service still implements GET only.

| Required operation | Documented contract |
|---|---|
| Create a device; service chooses its ID | POST /devices |
| Replace r7 with a complete representation | PUT /devices/r7 |
| Modify only r7's description | PATCH /devices/r7 with the documented patch body |
| Remove r7 | DELETE /devices/r7 |
| Read job 9 | GET /tasks/9 |

Choose the description-only request. Explain what to do when a create request times out without a response, and what a later 202 with a task URL establishes. Attempt the worksheet before opening the answer.

:::solution Check the operation and its verification
PATCH matches the documented partial update. A timeout leaves the create outcome unknown: use the API's resource/job lookup or documented idempotency mechanism to reconcile it before retrying. A 202 establishes acceptance for processing, so follow that task to a terminal result and verify the intended device behavior. A JSON parser can validate the representation without proving that the requested network operation succeeded.
:::

## Step 15: Compare the local service with real HTTPS

Before handling real credentials, identify which protections the loopback exercise did not demonstrate. Explain whether an HTTP 401, a certificate validation failure and connection refusal establish the same stage.

:::solution Check the boundary
This service demonstrated a fictional role check over local HTTP. It did not implement TLS, OAuth acquisition, expiry or a production server. Real access needs the platform's supported authenticated HTTPS setup and credential/authorization policy.

A certificate error concerns TLS identity/trust before a normal protected API response; a 401 is an HTTP response about valid authentication credentials; refusal means the connection did not reach a listening service at that endpoint. Disabling certificate validation does not repair an expired API token. Packet Tracer is not claimed to run this service or RESTCONF.
:::

## Step 16: Stop the service and submit the evidence

Hands-on learners press Ctrl+C in Terminal A, then repeat Step 3's inventory request in Terminal B. Worksheet learners state how that result differs from removing the request credential while the service was running.

:::expected
With no remaining lab process listening on that endpoint, the connection fails rather than returning a 401/403/404 document. Preserve that distinction in the record. Stop only the teaching process you started; do not terminate an unrelated listener.
:::

### Evidence to keep

Keep a request/response table containing method, path/query, credential role, status, body type and what the result actually establishes. Include your predictions and separate recovery evidence for both authentication and JSON faults. Identify the selected array entries, the syntax-versus-schema distinction, and one limit of the local service. State whether you executed the service or completed the supplied worksheet. Do not include real credentials in the record.

## Troubleshooting

- Connection refused: inspect the server terminal, bind address and port; there is no HTTP status until an HTTP server answers.
- 401 in this service: compare the Bearer scheme and exact fictional token.
- Parser sees leading HTTP text: do not save `-i` response headers into a JSON-body file.
- Valid JSON fails schema: inspect types and required fields; formatting cannot fix an incorrect value.
- Certificate failure on a real API: inspect trust/name/time independently of API authorization.

## Challenge

Use this new, supplied API contract; do not send writes to the local teaching service. An inventory read uses `GET /devices?site=west`. Its response is:

```json
{"devices":[{"id":"r7","ports":[{"name":"Gi0/0","enabled":true},{"name":"Gi0/1","enabled":false}]}],"next":null}
```

1. Separate the resource path from the query and give the zero-based path to Gi0/1's enabled value, including its type.
2. The API permits a partial update with `PATCH /devices/r7/ports/Gi0%2F1` and requires a boolean `enabled`. A colleague supplies `{"enabled":"true"}`. Explain both its syntax and its schema result; write the corrected body.
3. A submitted update returns 202 with task `/tasks/21`. The task later reports `{"state":"failed","reason":"device unreachable"}`. State what to record and which outcome remains unproved.
4. Separately, a documented DELETE returns 204. State what the client should do with its absent body.

:::solution Check the independent exchange
The path is `/devices`; `site=west` is the query. `devices[0].ports[1].enabled` selects boolean `false`. The supplied update is valid JSON but its value is a string; the required body is `{"enabled":true}`.

Record the accepted submission and its later explicit failure separately. No device update is established; investigate the reported reachability problem and follow the authorized retry/task-verification process before claiming the intended port state. A 204 is successful without a response body, so the client should not unconditionally parse JSON.
:::
