import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runtime } from "./runtime.mjs";

const { gradeCommand, matchesCommand, checkCommand } = runtime().load("src/lib/commands.ts");
const root = fileURLToPath(new URL("../../", import.meta.url));
function courseCommands() {
  return fs.readdirSync(path.join(root, "content/chapters")).flatMap(folder => {
    const filename = path.join(root, "content/chapters", folder, "commands.json");
    return fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, "utf8")) : [];
  });
}
const keyword = text => ({ text, kind: "keyword", meaning: "command keyword" });
const argument = text => ({ text, kind: "argument", meaning: "required task value" });
const iface = text => ({ text, kind: "interface", meaning: "requested interface" });
function exercise(parts, mode = "R1#", accept = []) {
  return { answer: parts.map(part => part.text).join(" "), mode, accept, teaching: { syntax: parts } };
}
function yes(given, drill) { assert.equal(gradeCommand(given, drill).correct, true); }
function no(given, drill, feedback) {
  const result = gradeCommand(given, drill);
  assert.equal(result.correct, false);
  assert.equal(typeof result.feedback, "string");
  assert.ok(result.feedback.length > 15);
  if (feedback) assert.match(result.feedback, feedback);
}

test("selected IOS abbreviations apply to annotated keyword positions", () => {
  yes("  SH\tip INT br  ", exercise([keyword("show ip interface brief")]));
  yes("conf t", exercise([keyword("configure terminal")]));
  yes("copy run start", exercise([keyword("copy running-config startup-config")]));
  yes("no shut", exercise([keyword("no shutdown")], "R1(config-if)#"));
  yes("en", exercise([keyword("enable")], "Switch>"));
  no("en", exercise([keyword("end")], "R1(config)#"));
  no("en secret SyntheticOnly9", exercise([keyword("enable secret"), argument("SyntheticOnly9")], "R1(config)#"));
  no("s ip i b", exercise([keyword("show ip interface brief")]), /selected common abbreviations/);
  no("t monitor", exercise([keyword("terminal monitor")]), /keywords/);
  yes("term monitor", exercise([keyword("terminal monitor")]));
  no("ip rou", exercise([keyword("ip routing")], "R1(config)#"));
});

test("alphabetic names and secrets cannot be shortened or case-folded", () => {
  const cases = [
    exercise([keyword("hostname"), argument("BranchRouter")], "R1(config)#"),
    exercise([keyword("name"), argument("USERS")], "R1(config-vlan)#"),
    exercise([keyword("enable secret"), argument("SyntheticSecretOnly9")], "R1(config)#"),
    exercise([keyword("username"), argument("NetAdmin"), keyword("privilege"), argument("15"), keyword("secret"), argument("TestValueOnly8")], "R1(config)#"),
    exercise([keyword("show ip route vrf"), argument("BLUE")]),
    exercise([keyword("show access-lists"), argument("LAB-MGMT")]),
  ];
  for (const drill of cases) {
    yes(drill.answer, drill);
    for (const part of drill.teaching.syntax.filter(part => part.kind === "argument" && /[a-z]/i.test(part.text))) {
      no(drill.answer.replace(part.text, part.text.slice(0, 2)), drill, /value/);
      no(drill.answer.replace(part.text, part.text.toLowerCase()), drill, /capitalization/);
    }
  }
});

test("feedback does not repeat entered or expected secret values", () => {
  const drill = exercise([keyword("enable secret"), argument("SyntheticSecretOnly9")], "R1(config)#");
  for (const entered of ["WrongSyntheticSecret9", "syntheticsecretonly9"]) {
    const result = gradeCommand(`enable secret ${entered}`, drill);
    assert.equal(result.correct, false);
    assert.ok(!result.feedback.includes(entered));
    assert.ok(!result.feedback.includes("SyntheticSecretOnly9"));
  }
});

test("arguments that resemble keywords still remain literal", () => {
  const drill = exercise([keyword("description"), argument("show running-config interface")], "R1(config-if)#");
  yes(drill.answer, drill);
  no("desc sh run int", drill, /value/);
  no("description SHOW running-config interface", drill, /capitalization/);
});

test("interface aliases work only in annotated interface groups", () => {
  for (const [full, short] of [["gigabitethernet0/1", "Gi0/1"], ["fastethernet0/24", "Fa 0/24"], ["tengigabitethernet1/0/1", "Te1/0/1"], ["loopback0", "Lo0"], ["port-channel 1", "Po1"], ["vlan 10", "Vlan10"], ["serial0/0/1", "Se0/0/1"], ["gigabitethernet0/0.20", "Gi0/0.20"]]) {
    const drill = exercise([keyword("show interfaces"), iface(full)]);
    yes(`sh int ${short}`, drill);
    no(`show interfaces ${short}9`, drill, /interface/);
  }
  const range = exercise([keyword("interface range"), iface("fastethernet0/1 - 2")], "SW1(config)#");
  yes("int range Fa0/1-2", range);
  yes("int range Fa0/1 - Fa0/2", range);
  no("int range Fa0/1 - Fa0/3", range);
  for (const part of ["Gi0/1", "flash:Gi0/1.cfg", "http://example.test/Gi0/1", '"Gi0/1 label"']) {
    const drill = exercise([keyword("description"), argument(part)], "R1(config-if)#");
    no(`description ${part.replace("Gi", "gigabitethernet")}`, drill);
  }
});

test("interface normalization cannot consume extra operands", () => {
  const drill = exercise([keyword("ip route"), argument("192.0.2.0 255.255.255.0"), iface("gigabitethernet0/0"), argument("198.51.100.2")], "R1(config)#");
  yes("ip route 192.0.2.0 255.255.255.0 Gi 0/0 198.51.100.2", drill);
  no("ip route 192.0.2.0 255.255.255.0 Gi0/0 198.51.100.3", drill);
  no("ip route 192.0.2.0 255.255.255.0 Gi0/0 198.51.100.2 5", drill, /extra/);
  no("ip route 192.0.2.0 255.255.255.0 Gi0/01 198.51.100.2", drill, /interface/);
});

test("IOS output filters preserve full text and capitalization", () => {
  const drill = exercise([keyword("show logging | include"), argument("LINK")]);
  yes("sh logging | include LINK", drill);
  no("show logging | include link", drill, /capitalization/);
  no("show logging | include LI", drill, /value/);
  const route = exercise([keyword("show running-config | include"), argument("^ip route")]);
  no("show run | include ^ip rou", route);
  no("show run | include ^ip  route", route);
  yes("show  run  |  include   ^ip route", route);
});

test("filenames and URLs are not lowercased, abbreviated, or interface-normalized", () => {
  const drill = exercise([keyword("copy running-config"), argument("flash:Router-Gi0-1.cfg")]);
  yes("copy run flash:Router-Gi0-1.cfg", drill);
  no("copy run flash:router-gi0-1.cfg", drill, /capitalization/);
  no("copy run flash:Router-GigabitEthernet0-1.cfg", drill);
  const url = exercise([keyword("copy"), argument("sftp://BackupUser@192.0.2.9//home/BackupUser/File.cfg flash:File.cfg")]);
  no(url.answer.toLowerCase(), url);
});

test("Windows commands use full keywords and exact native options and values", () => {
  const drill = exercise([keyword("netsh wlan show interfaces")], "Command Prompt");
  yes("NETSH WLAN SHOW INTERFACES", drill);
  no("netsh wlan sh int", drill, /IOS abbreviations/);
  const ipconfig = exercise([keyword("ipconfig"), argument('/renew "Ethernet"')], "C:\\>", ["ipconfig /renew Ethernet"]);
  yes("IPCONFIG /renew \"Ethernet\"", ipconfig);
  yes("ipconfig /renew Ethernet", ipconfig);
  no('ipconfig /renew "ethernet"', ipconfig, /capitalization/);
  no('ipconfig /RENEW "Ethernet"', ipconfig, /capitalization/);
  no('ipc /renew "Ethernet"', ipconfig);
});

test("PowerShell cmdlet and parameter case are independent of value case", () => {
  const drill = exercise([keyword("Test-NetConnection"), argument("RouterA -Port 443")], "PS>", ["Test-NetConnection -ComputerName RouterA -Port 443"]);
  yes("test-netconnection RouterA -port 443", drill);
  yes("TEST-NETCONNECTION -computername RouterA -PORT 443", drill);
  no("Test-NetC RouterA -Port 443", drill);
  no("Test-NetConnection RouterA -P 443", drill);
  no("Test-NetConnection routera -Port 443", drill, /capitalization/);
});

test("native commands in PowerShell do not inherit cmdlet parameter matching", () => {
  const drill = exercise([keyword("curl.exe"), argument('-i -H "Authorization: Bearer SyntheticTokenOnly" http://127.0.0.1:8765/API/devices')], "PowerShell");
  yes(drill.answer, drill);
  no(drill.answer.replace("-i", "-I"), drill, /capitalization/);
  no(drill.answer.replace("-H", "-h"), drill, /capitalization/);
  no(drill.answer.replace("SyntheticTokenOnly", "synthetictokenonly"), drill, /capitalization/);
  no(drill.answer.replace("Bearer ", "Bearer  "), drill);
  no(drill.answer.replace("/API/", "/api/"), drill, /capitalization/);
});

test("Linux and macOS commands, flags, and filenames retain their case", () => {
  const scp = exercise([keyword("scp"), argument("-O User@192.0.2.1:flash:File.cfg ./File.cfg")], "Linux shell");
  yes(scp.answer, scp);
  no(scp.answer.replace("-O", "-o"), scp, /capitalization/);
  no(scp.answer.replace("scp", "SCP"), scp);
  no(scp.answer.replace("File.cfg", "file.cfg"), scp, /capitalization/);
  const ip = exercise([keyword("ip"), argument("-br"), keyword("address")], "Shell", ["ip -br addr", "ip -br a"]);
  yes("ip -br a", ip);
  no("ip -br ad", ip);
  no("IP -br address", ip);
  no("ip -BR address", ip);
  const mac = exercise([keyword("route"), argument("-n"), keyword("get default")], "macOS Terminal");
  no("rou -n get default", mac);
});

test("nested quoted shell payloads are not IOS commands to normalize", () => {
  const drill = exercise([keyword("ansible"), argument("branch_routers -i inventory.yml -m cisco.ios.ios_command -a 'commands=\"show clock\"' --limit r1 --ask-pass")], "user@ctrl:~/ccna-automation$");
  yes(drill.answer, drill);
  no(drill.answer.replace("show clock", "sh clock"), drill);
  no(drill.answer.replace("show clock", "SHOW CLOCK"), drill, /capitalization/);
  no(drill.answer.replace("--limit", "--lim"), drill);
  no(drill.answer.replace("inventory.yml", "Inventory.yml"), drill, /capitalization/);
  no(drill.answer.replace("clock\"'", "clock\""), drill, /quotation/);
});

test("quoted spaces are significant while separators outside quotes are flexible", () => {
  const drill = exercise([keyword("python"), argument('-c "print(  1)"')], "Terminal");
  yes('  python\t-c   "print(  1)" ', drill);
  no('python -c "print( 1)"', drill);
  no('python -c "print(  1)', drill, /quotation/);
  const description = exercise([keyword("description"), argument("Office uplink")], "R1(config-if)#");
  yes("desc  Office uplink", description);
  no("description Office  uplink", description);
});

test("explicit alternatives accept only their finite approved values", () => {
  const drill = exercise([keyword("ip nat pool"), argument("PUBPOOL 198.51.100.20 198.51.100.21"), keyword("netmask"), argument("255.255.255.240")], "R1(config)#", ["ip nat pool PUBPOOL 198.51.100.20 198.51.100.21 prefix-length 28"]);
  yes(drill.accept[0], drill);
  no(drill.accept[0].replace("PUBPOOL", "pubpool"), drill);
  no(drill.accept[0].replace("prefix-length 28", "prefix-length 27"), drill);
  const alternateName = exercise([keyword("show"), argument("PRIMARY")], "R1#", ["show show"]);
  yes("show show", alternateName);
  no("show SHOW", alternateName);
  const allowed = exercise([keyword("copy running-config startup-config")], "R1#", ["write memory", "write"]);
  yes("write memory", allowed);
  yes("write", allowed);
  no("wri mem", allowed);
});

test("feedback identifies blank, incomplete, extra, and incorrect values", () => {
  const drill = exercise([keyword("ip address"), argument("192.0.2.1 255.255.255.0")], "R1(config-if)#");
  no("", drill, /Enter the command/);
  no("ip", drill, /incomplete/);
  no("ip address 192.0.2.1", drill, /remaining value/);
  no("ip address 192.0.2.1 255.255.255.0 extra", drill, /extra/);
  no("ip address 192.0.2.1 255.255.255.128", drill, /value/);
  no("ip address 192.0.2.1 255.255.255.0\nno shutdown", drill, /one command/);
});

test("pasted prompts are diagnosed rather than silently removed", () => {
  const drill = exercise([keyword("show ip route")]);
  for (const prompt of ["R1#", "R1(config)#", "R1>", "C:\\>", "PS>", "user@ctrl:~$"]) no(`${prompt} show ip route`, drill, /Leave out.*prompt/);
  no("R1#show ip route", drill, /Leave out/);
});

test("mode feedback explains do and already-entered configuration modes", () => {
  no("do show ip route", exercise([keyword("show ip route")]), /already an EXEC/);
  const setting = exercise([keyword("ip routing")], "R1(config)#");
  no("do ip routing", setting, /do prefix runs an EXEC/);
  no("configure terminal", setting, /already in configuration mode/);
  no("show ip route", setting, /configuration prompt/);
  const inspection = exercise([keyword("do show ip route")], "R1(config)#");
  yes("do sh ip route", inspection);
  no("show ip route", inspection, /needs the do prefix/);
});

test("missing or inconsistent metadata falls back to literal matching", () => {
  const drill = { answer: "hostname RouterA", mode: "R1(config)#" };
  yes(drill.answer, drill);
  no("hostname routera", drill);
  no("host RouterA", drill);
  const bad = { ...drill, teaching: { syntax: [keyword("hostname OtherRouter")] } };
  yes(drill.answer, bad);
  no("hostname routera", bad);
  no("hostname OtherRouter", bad);
});

test("legacy signatures remain conservative and never guess argument roles", () => {
  assert.equal(matchesCommand("hostname RouterA", "hostname RouterA"), true);
  assert.equal(matchesCommand("hostname RouterA", "hostname routera"), false);
  assert.equal(checkCommand("show ip int br", "show ip interface brief"), false);
  assert.equal(checkCommand("conf t", "configure terminal", ["conf t"]), true);
  assert.equal(checkCommand("name US", "name USERS"), false);
  assert.equal(checkCommand("description Gi0/1", "description gigabitethernet0/1"), false);
});

test("every course canonical command and explicit alternative is accepted", () => {
  let count = 0, alternatives = 0;
    for (const drill of courseCommands()) {
      assert.equal(gradeCommand(drill.answer, drill).correct, true, `${drill.id}: canonical rejected`);
      for (const answer of drill.accept ?? []) {
        assert.equal(gradeCommand(answer, drill).correct, true, `${drill.id}: explicit alternative rejected`);
        alternatives++;
      }
      count++;
  }
  assert.ok(count > 0, "Test the current curated bank, without imposing a content quota");
  assert.ok(alternatives > 0, "Exercise the bank's explicit alternatives");
});

test("all course argument positions reject changed and truncated task values", () => {
  let changed = 0, truncated = 0;
  for (const drill of courseCommands()) {
    const syntax = drill.teaching?.syntax;
    assert.ok(syntax?.length, `${drill.id}: syntax metadata required`);
    for (let at = 0; at < syntax.length; at++) {
      const part = syntax[at];
      if (part.kind !== "argument") continue;
      const replace = text => syntax.map((item, index) => index === at ? text : item.text).join(" ");
      const mutation = replace(part.text + "__wrong");
      assert.equal(gradeCommand(mutation, drill).correct, false, `${drill.id}: changed argument ${at} accepted`);
      changed++;
      if (part.text.length > 1) {
        const short = replace(part.text.slice(0, Math.min(2, part.text.length - 1)));
        if (!(drill.accept ?? []).includes(short)) {
          assert.equal(gradeCommand(short, drill).correct, false, `${drill.id}: truncated argument ${at} accepted`);
          truncated++;
        }
      }
    }
  }
  assert.ok(changed > 0);
  assert.ok(truncated > 0);
});

test("course literals preserve case except documented PowerShell parameter names", () => {
  let count = 0;
  for (const drill of courseCommands()) {
    const syntax = drill.teaching?.syntax;
    assert.ok(syntax?.length, `${drill.id}: syntax metadata required`);
    for (let at = 0; at < syntax.length; at++) {
      const part = syntax[at];
      if (part.kind !== "argument" || !/[a-z]/i.test(part.text)) continue;
      if (/^Test-NetConnection /i.test(drill.answer) && /^-(?:Port|ComputerName)$/i.test(part.text)) continue;
      const changed = part.text.replace(/[a-z]/i, char => char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase());
      const mutation = syntax.map((item, index) => index === at ? changed : item.text).join(" ");
      if ((drill.accept ?? []).includes(mutation)) continue;
      assert.equal(gradeCommand(mutation, drill).correct, false, `${drill.id}: changed literal case at ${at} accepted`);
      count++;
    }
  }
  assert.ok(count > 0);
});

test("every course annotated interface permits bounded aliases but preserves port identity", () => {
  let count = 0;
  const aliases = [[/gigabitethernet/i, "Gi"], [/fastethernet/i, "Fa"], [/tengigabitethernet/i, "Te"], [/port-channel/i, "Po"], [/loopback/i, "Lo"], [/serial/i, "Se"]];
  for (const drill of courseCommands()) {
    const syntax = drill.teaching?.syntax;
    assert.ok(syntax?.length, `${drill.id}: syntax metadata required`);
    for (let at = 0; at < syntax.length; at++) {
      const part = syntax[at];
      if (part.kind !== "interface") continue;
      const replace = text => syntax.map((item, index) => index === at ? text : item.text).join(" ");
      const alias = aliases.find(([pattern]) => pattern.test(part.text));
      if (alias) assert.equal(gradeCommand(replace(part.text.replace(...alias)), drill).correct, true, `${drill.id}: annotated interface alias rejected`);
      assert.equal(gradeCommand(replace(part.text.replace(/\d+$/, "99")), drill).correct, false, `${drill.id}: wrong interface number accepted`);
      count++;
    }
  }
  assert.ok(count > 0);
});
