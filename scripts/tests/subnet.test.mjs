import test from "node:test";
import assert from "node:assert/strict";
import { isIP } from "node:net";
import { runtime, plain } from "./runtime.mjs";

const rt = runtime();
const subnet = { ...rt.load("src/lib/subnet.ts"), ...rt.load("src/lib/subnet-drills.ts") };
const MAX4 = (1n << 32n) - 1n;
const modes = ["network", "hosts", "same", "wildcard", "ipv6", "vlsm", "subnets", "troubleshoot", "ipv6-subnet", "summary"];
const difficulties = ["foundation", "standard", "challenge"];

function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

// Reference calculations deliberately use unsigned BigInt bit operations,
// independent of the trainer's arithmetic and formatting helpers.
function number4(ip) {
  const octets = ip.split(".");
  assert.equal(octets.length, 4, ip);
  return octets.reduce((n, octet) => {
    assert.match(octet, /^\d{1,3}$/);
    assert.ok(Number(octet) <= 255, ip);
    return (n << 8n) | BigInt(octet);
  }, 0n);
}

function address4(n) {
  return [24n, 16n, 8n, 0n].map(shift => Number((n >> shift) & 255n)).join(".");
}

function reference4(ip, prefix) {
  const bits = BigInt(32 - prefix);
  const size = 1n << bits;
  const wildcard = size - 1n;
  const mask = MAX4 ^ wildcard;
  const network = number4(ip) & mask;
  const lastAddress = network | wildcard;
  return {
    prefix,
    network: address4(network),
    broadcast: prefix >= 31 ? "—" : address4(lastAddress),
    first: address4(prefix >= 31 ? network : network + 1n),
    last: address4(prefix >= 31 ? lastAddress : lastAddress - 1n),
    size: Number(size),
    hosts: Number(prefix >= 31 ? size : size - 2n),
    mask: address4(mask),
    wildcard: address4(wildcard),
  };
}

function ordinaryPrefix(hosts) {
  // Find enough bits from the requirement, not by asking the production helper.
  let bits = 2;
  while ((1n << BigInt(bits)) - 2n < BigInt(hosts)) bits++;
  return 32 - bits;
}

function cidr4(text) {
  const match = /^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/.exec(text);
  assert.ok(match, `valid IPv4 CIDR: ${text}`);
  const prefix = Number(match[2]);
  assert.ok(prefix >= 0 && prefix <= 32, text);
  return { ip: match[1], prefix, start: number4(match[1]), size: 1n << BigInt(32 - prefix) };
}

function number6(text) {
  assert.equal(isIP(text), 6, `valid IPv6 literal: ${text}`);
  const sides = text.split("::");
  const left = sides[0] ? sides[0].split(":") : [];
  const right = sides.length === 2 && sides[1] ? sides[1].split(":") : [];
  const groups = sides.length === 2 ? [...left, ...Array(8 - left.length - right.length).fill("0"), ...right] : left;
  assert.equal(groups.length, 8);
  return groups.reduce((n, group) => (n << 16n) | BigInt(`0x${group}`), 0n);
}

function cidr6(text) {
  const split = text.split("/");
  assert.equal(split.length, 2, text);
  assert.match(split[1], /^\d{1,3}$/);
  const prefix = Number(split[1]);
  assert.ok(prefix >= 0 && prefix <= 128, text);
  return { ip: split[0], prefix, start: number6(split[0]), size: 1n << BigInt(128 - prefix) };
}

function fieldAnswers(drill) {
  return Object.fromEntries(drill.fields.map(field => [field.key, field.answer]));
}

function fixture(format, answer, options = {}) {
  return {
    mode: "network", difficulty: "standard", prompt: "A supplied test problem",
    explain: "Supplied test explanation", workedSteps: ["Read the supplied values."],
    fields: [{ key: "value", label: "Value", format, answer, ...options }],
  };
}

function check(drill, answer) {
  const result = subnet.gradeDrill(drill, { value: answer });
  assert.equal(result.fields.length, 1);
  assert.equal(result.fields[0].key, "value");
  assert.equal(typeof result.fields[0].feedback, "string");
  assert.ok(result.fields[0].feedback.trim().length > 0);
  assert.equal(result.allCorrect, result.fields[0].correct);
  return result.allCorrect;
}

test("IPv4 parsing is strict dotted decimal and keeps the unsigned address domain", () => {
  for (const [text, expected] of [["0.0.0.0", 0], ["255.255.255.255", 4294967295], ["128.0.0.0", 2147483648], [" 192.168.001.010 ", 3232235786]]) {
    assert.equal(subnet.parseIPv4(text), expected, text);
  }
  for (const text of ["", "1.2.3", "1.2.3.4.5", "256.0.0.1", "-1.0.0.1", "1.2.3.4x", "1.2.3.1e2", "1.2.3.+4", "1.2.3. 4", "0x0a.0.0.1", "1.2.3.0000", "1..2.3"]) {
    assert.equal(subnet.parseIPv4(text), null, text);
  }
  for (const n of [0, 1, 255, 256, 2147483648, 4294967295]) {
    assert.equal(subnet.fmtIPv4(n), address4(BigInt(n)));
  }
  for (const n of [-1, 4294967296, 1.5, NaN, Infinity, -Infinity]) assert.throws(() => subnet.fmtIPv4(n), undefined, String(n));
});

test("all 33 contiguous masks round-trip and noncontiguous masks are rejected", () => {
  for (let prefix = 0; prefix <= 32; prefix++) {
    const expected = reference4("203.0.113.207", prefix);
    assert.equal(subnet.maskFromPrefix(prefix), Number(number4(expected.mask)));
    assert.equal(subnet.prefixFromMask(expected.mask), prefix);
  }
  for (const mask of ["255.0.255.0", "255.255.127.0", "255.255.255.253", "128.128.0.0", "0.0.0.1", "255.255.256.0", "255.255.255.0/24"]) {
    assert.equal(subnet.prefixFromMask(mask), null, mask);
  }
  for (const prefix of [-1, 33, 8.5, NaN, Infinity]) assert.throws(() => subnet.maskFromPrefix(prefix), undefined, String(prefix));
});

test("IPv4 boundary arithmetic covers /0, high unsigned addresses, /31 and /32", () => {
  for (const [ip, prefix] of [["203.0.113.4", 0], ["255.255.255.255", 1], ["172.16.200.9", 21], ["192.168.10.64", 26], ["255.255.255.255", 31], ["0.0.0.0", 31], ["255.255.255.255", 32]]) {
    const expected = reference4(ip, prefix);
    const actual = subnet.subnetInfo(ip, prefix);
    for (const [key, value] of Object.entries(expected)) assert.equal(actual[key], value, `${ip}/${prefix} ${key}`);
  }
  // RFC 3021 endpoints are both addresses of the /31; a /32 is one host.
  assert.equal(subnet.subnetInfo("192.0.2.1", 31).first, "192.0.2.0");
  assert.equal(subnet.subnetInfo("192.0.2.1", 31).hosts, 2);
  assert.equal(subnet.subnetInfo("192.0.2.1", 32).hosts, 1);
  const random = seeded(0x71b3a);
  for (let prefix = 0; prefix <= 32; prefix++) {
    for (let i = 0; i < 20; i++) {
      const ip = address4(BigInt(Math.floor(random() * 4294967296)));
      const expected = reference4(ip, prefix);
      const actual = subnet.subnetInfo(ip, prefix);
      for (const [key, value] of Object.entries(expected)) assert.equal(actual[key], value, `${ip}/${prefix} ${key}`);
    }
  }
  for (const prefix of [-1, 33, 3.5, NaN, Infinity]) assert.throws(() => subnet.subnetInfo("1.2.3.4", prefix));
  assert.throws(() => subnet.subnetInfo("not-an-address", 24));
});

test("sameSubnet and binary views cannot turn invalid input into plausible evidence", () => {
  assert.equal(subnet.sameSubnet("0.0.0.0", "255.255.255.255", 0), true);
  assert.equal(subnet.sameSubnet("192.0.2.0", "192.0.2.1", 31), true);
  assert.equal(subnet.sameSubnet("192.0.2.1", "192.0.2.2", 31), false);
  assert.equal(subnet.sameSubnet("192.0.2.1", "192.0.2.1", 32), true);
  assert.equal(subnet.sameSubnet("192.0.2.1", "192.0.2.2", 32), false);
  for (const prefix of [-1, 33, 2.5, NaN, Infinity]) assert.equal(subnet.sameSubnet("1.1.1.1", "1.1.1.2", prefix), false);
  assert.equal(subnet.sameSubnet("bad", "0.0.0.0", 0), false);
  assert.deepEqual(plain(subnet.toBinaryOctets("128.255.0.1")), ["10000000", "11111111", "00000000", "00000001"]);
  assert.throws(() => subnet.toBinaryOctets("bad"));
});

test("ordinary LAN host capacity chooses the smallest sufficient block and rejects impossible input", () => {
  for (const [need, prefix] of [[1, 30], [2, 30], [3, 29], [6, 29], [7, 28], [62, 26], [63, 25], [254, 24], [255, 23], [65534, 16], [4294967294, 0]]) {
    assert.equal(subnet.prefixForHosts(need), prefix);
    const capacity = (1n << BigInt(32 - prefix)) - 2n;
    assert.ok(capacity >= BigInt(need));
    assert.ok((1n << BigInt(31 - prefix)) - 2n < BigInt(need), "one smaller block cannot fit");
  }
  for (const need of [0, -1, 1.5, NaN, Infinity, -Infinity, 4294967295, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => subnet.prefixForHosts(need), undefined, String(need));
  }
});

test("IPv6 representation follows RFC 4291 parsing and RFC 5952 longest-leftmost canonicalization", () => {
  const cases = [
    ["0000:0000:0000:0000:0000:0000:0000:0000", "::"],
    ["0000:0000:0000:0000:0000:0000:0000:0001", "::1"],
    ["2001:0DB8:0000:0000:0001:0000:0000:0001", "2001:db8::1:0:0:1"],
    ["2001:0db8:0001:0000:0000:0000:0000:0000", "2001:db8:1::"],
    ["2001:0db8:0001:0002:0003:0004:0000:0006", "2001:db8:1:2:3:4:0:6"],
    ["2001:0db8:0000:0001:0000:0000:0000:0001", "2001:db8:0:1::1"],
  ];
  for (const [full, canonical] of cases) {
    assert.equal(isIP(full), 6);
    assert.equal(subnet.compressIPv6(full), canonical);
    assert.equal(subnet.expandIPv6(canonical), full.toLowerCase());
  }
  assert.equal(subnet.expandIPv6("2001:db8:1:2:3:4::6"), "2001:0db8:0001:0002:0003:0004:0000:0006", "single-zero :: is valid input but not canonical output");
  for (const text of ["", ":", ":::1", "1::2::3", "1:2:3:4:5:6:7", "1:2:3:4:5:6:7:8:9", "1:2:3:4:5:6:7:8::", "1:2:3:4:5:6:7:", "2001:db8::gg", "2001:db8::12345", "2001: db8::1"]) {
    assert.equal(subnet.expandIPv6(text), null, text);
    assert.equal(subnet.compressIPv6(text), null, text);
  }
});

test("modified EUI-64 validates a MAC and toggles rather than always sets the U/L bit", () => {
  for (const mac of ["00:1a:2b:3c:4d:5e", "00-1A-2B-3C-4D-5E", "001a.2b3c.4d5e", "001a2b3c4d5e"]) assert.equal(subnet.eui64(mac), "21a:2bff:fe3c:4d5e", mac);
  assert.equal(subnet.eui64("02:1a:2b:3c:4d:5e"), "1a:2bff:fe3c:4d5e");
  for (const mac of ["zz00:1a:2b:3c:4d:5ezz", "00:1a:2b:3c:4d:5", "00:1a:2b:3c:4d:5e:6f", "00:1a-2b:3c:4d:5e", "001a.2b3c.4d5g", ""]) assert.equal(subnet.eui64(mac), null, mac);
});

test("grading rejects decimal junk, enforces each numeric domain and accepts an optional prefix slash", () => {
  const count = fixture("integer", "65536", { min: 1, max: 4294967296 });
  assert.equal(check(count, "65536"), true, "host/subnet counts are not capped at prefix length");
  const prefix = fixture("prefix", "26", { min: 0, max: 32 });
  assert.equal(check(prefix, " /26 "), true);
  for (const text of ["26abc", "26.0", "2.6e1", "0x1a", "+26", "26/", "26 0", "/33", "-1", "", "/26/", "//26"]) assert.equal(check(prefix, text), false, text);
  for (const text of ["65536abc", "65536.0", "6.5536e4", "0x10000", "/65536", "", "-65536"]) assert.equal(check(count, text), false, text);
  assert.equal(check(fixture("integer", "33", { min: 0, max: 32 }), "33"), false, "the declared bound still applies when an answer is malformed");
});

test("yes/no grading requires a complete answer rather than a matching initial letter", () => {
  for (const answer of ["yes", "no"]) {
    const drill = fixture("yes-no", answer);
    assert.equal(check(drill, ` ${answer.toUpperCase()} `), true);
    for (const junk of [answer[0], answer === "yes" ? "yellow" : "nothing", answer + " maybe", "", "true", "false"]) assert.equal(check(drill, junk), false, junk);
  }
});

test("IPv6 grading assesses the requested representation, including ties and single-zero compression", () => {
  const full = "2001:0db8:0000:0000:0001:0000:0000:0001";
  const canonical = "2001:db8::1:0:0:1";
  const compressed = fixture("ipv6-canonical", canonical);
  assert.equal(check(compressed, canonical), true);
  for (const wrongForm of [full, "2001:db8:0:0:1::1", "2001:db8::0:1:0:0:1", canonical.toUpperCase()]) assert.equal(check(compressed, wrongForm), false, wrongForm);
  const expanded = fixture("ipv6-expanded", full);
  assert.equal(check(expanded, full.toUpperCase()), true);
  for (const wrongForm of [canonical, "2001:db8:0:0:1:0:0:1", "2001:0db8:0000:0000:0001:0000:0000:0002"]) assert.equal(check(expanded, wrongForm), false, wrongForm);
  const single = "2001:db8:1:2:3:4:0:6";
  assert.equal(check(fixture("ipv6-canonical", single), "2001:db8:1:2:3:4::6"), false);
  assert.equal(check(fixture("ipv6", single), "2001:db8:1:2:3:4::6"), true, "equivalent-address tasks have a different contract");
});

test("multi-field grading preserves correct work and identifies only the incorrect fields", () => {
  const drill = { ...fixture("ipv4", "192.0.2.0"), fields: [
    { key: "network", label: "Network", format: "ipv4", answer: "192.0.2.0" },
    { key: "hosts", label: "Hosts", format: "integer", answer: "254", min: 1, max: 4294967294 },
  ] };
  const result = subnet.gradeDrill(drill, { network: "192.0.2.0", hosts: "256" });
  assert.equal(result.allCorrect, false);
  assert.deepEqual(plain(result.fields.map(x => ({ key: x.key, correct: x.correct }))), [{ key: "network", correct: true }, { key: "hosts", correct: false }]);
  assert.equal(subnet.gradeDrill(drill, { network: "192.0.2.0", hosts: "254" }).allCorrect, true);
  assert.equal(subnet.gradeDrill(drill, {}).allCorrect, false);
});

test("IPv4 allocation grading requires the requested aligned network and prefix", () => {
  const drill = fixture("cidr4", "192.0.2.64/26");
  for (const text of ["192.0.2.64/26", " 192.0.2.64 / 26 "]) assert.equal(check(drill, text), true);
  for (const text of ["192.0.2.65/26", "192.0.2.127/26", "192.0.2.64/27", "192.0.2.128/26", "192.0.2.64/33", "192.0.2.64/26.0", "192.0.2.64/2.6e1", "192.0.2.64/255.255.255.192", "192.0.2.64/26 extra"]) {
    assert.equal(check(drill, text), false, text);
  }
  for (const [answer, equivalent] of [["0.0.0.0/0", "0.0.0.0/0"], ["255.255.255.254/31", "255.255.255.254/31"], ["255.255.255.255/32", "255.255.255.255/32"]]) {
    assert.equal(check(fixture("cidr4", answer), equivalent), true);
  }
});

test("IPv6 allocation grading accepts equivalent network spellings while rejecting host bits and wrong lengths", () => {
  const drill = fixture("cidr6", "2001:db8:abcd:1200::/64");
  for (const text of ["2001:db8:abcd:1200::/64", "2001:0DB8:ABCD:1200:0000:0000:0000:0000 / 64"]) assert.equal(check(drill, text), true, text);
  for (const text of ["2001:db8:abcd:1200::1/64", "2001:db8:abcd:1201::/64", "2001:db8:abcd:1200::/63", "2001:db8:abcd:1200::/129", "2001:db8:abcd:1200::/64.0", "2001:db8:abcd:1200::/64 extra", "2001:db8:abcd:1200::%eth0/64"]) {
    assert.equal(check(drill, text), false, text);
  }
  assert.equal(check(fixture("cidr6", "::/0"), "0000:0000:0000:0000:0000:0000:0000:0000/0"), true);
  assert.equal(check(fixture("cidr6", "2001:db8::1/128"), "2001:0db8:0000:0000:0000:0000:0000:0001/128"), true);
});

test("VLSM overlap feedback points to the collision without erasing an independently correct allocation", () => {
  const drill = {
    mode: "vlsm", difficulty: "standard", prompt: "Allocate two LANs", workedSteps: ["Allocate largest first."], explain: "Use distinct blocks.",
    context: { parent: "192.0.2.0/24" },
    fields: [
      { key: "s0", label: "LAN A", answer: "192.0.2.0/26", format: "cidr4", requiredHosts: 50 },
      { key: "s1", label: "LAN B", answer: "192.0.2.64/27", format: "cidr4", requiredHosts: 20 },
    ],
  };
  const result = subnet.gradeDrill(drill, { s0: "192.0.2.0/26", s1: "192.0.2.32/27" });
  assert.equal(result.allCorrect, false);
  assert.equal(result.fields[0].correct, true);
  assert.equal(result.fields[1].correct, false);
  assert.match(result.fields[1].feedback, /overlap.*LAN A/i);
  const outside = subnet.gradeDrill(drill, { s0: "192.0.2.0/26", s1: "192.0.3.0/27" });
  assert.match(outside.fields[1].feedback, /outside.*parent/i);
  const unaligned = subnet.gradeDrill(drill, { s0: "192.0.2.0/26", s1: "192.0.2.65/27" });
  assert.match(unaligned.fields[1].feedback, /not aligned|network boundary/i);
});

for (const mode of modes) {
  for (const difficulty of difficulties) {
    test(`${mode}/${difficulty}: deterministic exercises have complete fields, scoped numeric limits and gradeable answers`, () => {
      const formats = new Set(["ipv4", "integer", "prefix", "cidr4", "yes-no", "ipv6-expanded", "ipv6-canonical", "ipv6", "cidr6", "no-broadcast"]);
      for (let seed = 1; seed <= 32; seed++) {
        const drill = subnet.makeDrill(mode, difficulty, seeded(seed));
        assert.deepEqual(plain(drill), plain(subnet.makeDrill(mode, difficulty, seeded(seed))), `all randomness must use the supplied RNG, seed ${seed}`);
        assert.equal(drill.mode, mode);
        assert.equal(drill.difficulty, difficulty);
        assert.ok(drill.prompt.trim().length > 0);
        assert.ok(drill.explain.trim().length > 0);
        assert.ok(drill.workedSteps.length > 0);
        assert.ok(drill.workedSteps.every(step => typeof step === "string" && step.trim().length > 0));
        assert.ok(drill.fields.length > 0);
        assert.equal(new Set(drill.fields.map(field => field.key)).size, drill.fields.length);
        for (const field of drill.fields) {
          assert.ok(field.label.trim().length > 0);
          assert.ok(formats.has(field.format), `${mode} ${field.key} needs an explicit answer format`);
          assert.equal(typeof field.answer, "string");
          if (field.format === "integer" || field.format === "prefix") {
            assert.ok(Number.isSafeInteger(field.min), `${field.key} min`);
            assert.ok(Number.isSafeInteger(field.max), `${field.key} max`);
            assert.ok(field.min >= 0 && field.min <= field.max);
            const n = Number(field.answer.replace(/^\//, ""));
            assert.ok(Number.isSafeInteger(n) && n >= field.min && n <= field.max, `${field.key} answer outside its declared domain`);
          }
        }
        const correct = Object.fromEntries(drill.fields.map(field => [field.key, field.answer]));
        assert.equal(subnet.gradeDrill(drill, correct).allCorrect, true, `${mode}/${difficulty}/${seed} answer round-trip`);
        assert.equal(subnet.gradeDrill(drill, {}).allCorrect, false, "an untouched exercise is not correct");
        const first = drill.fields[0];
        const oneWrong = subnet.gradeDrill(drill, { ...correct, [first.key]: "invalid answer" });
        assert.equal(oneWrong.allCorrect, false);
        assert.equal(oneWrong.fields.find(field => field.key === first.key).correct, false);
        assert.ok(oneWrong.fields.filter(field => field.key !== first.key).every(field => field.correct), "one invalid answer must not erase correct independent work");
      }
    });
  }
}

test("valid extreme RNG draws terminate while invalid mode, difficulty and draws fail explicitly", () => {
  for (const mode of modes) {
    for (const difficulty of difficulties) {
      for (const value of [0, 1 - Number.EPSILON]) {
        let draws = 0;
        const drill = subnet.makeDrill(mode, difficulty, () => {
          if (++draws > 1000) throw new Error("Generator did not terminate for a valid constant random source");
          return value;
        });
        assert.equal(drill.mode, mode);
        assert.ok(drill.fields.length > 0);
      }
    }
  }
  assert.throws(() => subnet.makeDrill("not-a-mode", "standard", seeded(1)));
  assert.throws(() => subnet.makeDrill("network", "not-a-difficulty", seeded(1)));
  for (const value of [-0.1, 1, NaN, Infinity]) assert.throws(() => subnet.makeDrill("network", "standard", () => value), undefined, String(value));
});

function verifyGeneratedMath(drill) {
  const c = drill.context;
  assert.ok(c, `${drill.mode} needs supplied problem inputs for verification`);
  const answers = fieldAnswers(drill);
  const expect = (key, value) => {
    assert.ok(key in answers, `${drill.mode}: missing ${key}`);
    assert.equal(answers[key], String(value), `${drill.mode}/${drill.difficulty} ${key}: ${drill.prompt}`);
  };
  const parentText = () => c.parent ?? c.parentCIDR;
  if (drill.mode === "network") {
    const expected = reference4(c.ip, c.prefix);
    for (const key of ["network", "first", "last", "hosts"]) expect(key, expected[key]);
    expect("broadcast", c.prefix >= 31 ? "none" : expected.broadcast);
    if (c.prefix === 31) assert.match([drill.prompt, drill.detail, drill.rule, drill.explain].join(" "), /point.to.point|two.endpoint/i);
    if (c.prefix === 32) assert.match([drill.prompt, drill.detail, drill.rule, drill.explain].join(" "), /one address|single address|host route|loopback/i);
  } else if (drill.mode === "hosts") {
    const allocation = c.allocations[0];
    const required = allocation.endpoints + allocation.gateways + allocation.reserved;
    assert.equal(c.requiredHosts, required);
    const prefix = ordinaryPrefix(required);
    expect("required", required);
    expect("prefix", prefix);
    expect("mask", reference4("0.0.0.0", prefix).mask);
    expect("hosts", (1n << BigInt(32 - prefix)) - 2n);
  } else if (drill.mode === "same") {
    assert.equal(c.addresses.length, 2);
    const [a, b] = c.addresses;
    assert.notEqual(number4(a), number4(b), "two separate hosts must not receive one address");
    const ra = reference4(a, c.prefix), rb = reference4(b, c.prefix);
    if (c.prefix <= 30) {
      for (const [ip, range] of [[a, ra], [b, rb]]) {
        assert.ok(number4(ip) > number4(range.network) && number4(ip) < number4(range.broadcast), `${ip} must be a usable host, not a subnet boundary`);
      }
    }
    expect("same", ra.network === rb.network ? "yes" : "no");
    expect("networkA", ra.network);
    expect("networkB", rb.network);
  } else if (drill.mode === "wildcard") {
    const expected = reference4(c.ip, c.prefix);
    assert.equal(c.ip, expected.network);
    expect("mask", expected.mask);
    expect("wildcard", expected.wildcard);
    assert.equal(number4(answers.mask) ^ number4(answers.wildcard), MAX4);
  } else if (drill.mode === "ipv6") {
    assert.equal(number6(answers.v6), number6(c.ip));
    if (c.ipv6Operation === "compress") {
      // Node's native IPv6 URL serializer is independent of the trainer parser.
      expect("v6", new URL(`http://[${c.ip}]/`).hostname.slice(1, -1));
    } else {
      assert.equal(c.ipv6Operation, "expand");
      assert.match(answers.v6, /^(?:[0-9a-f]{4}:){7}[0-9a-f]{4}$/);
      expect("v6", number6(c.ip).toString(16).padStart(32, "0").match(/.{4}/g).join(":"));
    }
  } else if (drill.mode === "vlsm") {
    const parent = cidr4(parentText());
    assert.equal(parent.start % parent.size, 0n, "aligned parent");
    const rows = c.allocations.map((a, index) => ({ ...a, index, required: a.endpoints + a.gateways + a.reserved }));
    assert.ok(rows.length > 1);
    assert.ok(rows.every(a => Number.isSafeInteger(a.required) && a.required > 0));
    // Supplied LAN order must not give away the allocation order. Independently
    // sort requirements, then map each allocation back to its original field.
    rows.sort((a, b) => b.required - a.required || a.name.localeCompare(b.name));
    let cursor = parent.start;
    const intervals = [];
    rows.forEach(row => {
      const prefix = ordinaryPrefix(row.required);
      const actual = cidr4(answers[`s${row.index}`]);
      assert.equal(actual.prefix, prefix, "smallest sufficient block includes gateway/reserve");
      assert.equal(actual.start, cursor, "no gap or overlap in the specified allocation order");
      assert.equal(actual.start % actual.size, 0n, "each block is aligned to its own size");
      assert.ok(actual.start >= parent.start && actual.start + actual.size <= parent.start + parent.size, "allocation is contained in the parent");
      intervals.push([actual.start, actual.start + actual.size]);
      cursor += actual.size;
    });
    for (let i = 0; i < intervals.length; i++) for (let j = i + 1; j < intervals.length; j++) assert.ok(intervals[i][1] <= intervals[j][0] || intervals[j][1] <= intervals[i][0], "no two allocations overlap");
  } else if (drill.mode === "subnets") {
    const parent = cidr4(parentText());
    let borrowed = 0;
    while (2 ** borrowed < c.subnetCount) borrowed++;
    const prefix = parent.prefix + borrowed;
    assert.ok(prefix <= 30, "ordinary child LANs keep host capacity");
    const size = 1n << BigInt(32 - prefix);
    expect("prefix", prefix);
    expect("count", 2 ** borrowed);
    expect("firstSubnet", `${address4(parent.start)}/${prefix}`);
    expect("selectedSubnet", `${address4(parent.start + BigInt(c.ordinal - 1) * size)}/${prefix}`);
    assert.ok(c.ordinal >= 1 && c.ordinal <= 2 ** borrowed);
    assert.ok(borrowed === 0 || 2 ** (borrowed - 1) < c.subnetCount, "borrowing one less bit would miss the requirement");
  } else if (drill.mode === "troubleshoot") {
    const plan = c.plan;
    const expected = reference4(plan.network, plan.prefix);
    assert.equal(plan.network, expected.network);
    assert.ok(Number.isInteger(plan.hostOrdinal) && plan.hostOrdinal > 0);
    const intendedHost = address4(number4(plan.network) + BigInt(plan.hostOrdinal));
    const intendedGateway = address4(number4(plan.network) + BigInt(plan.gatewayOrdinal ?? 1));
    assert.ok(number4(intendedHost) <= number4(expected.last));
    assert.notEqual(intendedHost, intendedGateway);
    expect("host", intendedHost);
    expect("mask", expected.mask);
    expect("gateway", intendedGateway);
    expect("valid", plan.host === intendedHost && plan.mask === expected.mask && plan.gateway === intendedGateway ? "yes" : "no");
  } else if (drill.mode === "ipv6-subnet") {
    const parent = cidr6(parentText());
    assert.equal(c.childPrefix, 64);
    assert.ok(parent.prefix <= 64);
    const count = 1n << BigInt(64 - parent.prefix);
    const selected = cidr6(answers.selectedSubnet);
    expect("count", count);
    assert.equal(selected.prefix, 64);
    assert.equal(selected.start, parent.start + (BigInt(c.ordinal) - 1n) * (1n << 64n));
    assert.equal(selected.start % selected.size, 0n);
    assert.ok(selected.start >= parent.start && selected.start + selected.size <= parent.start + parent.size);
    const candidate = number6(c.candidate);
    expect("member", candidate >= parent.start && candidate < parent.start + parent.size ? "yes" : "no");
  } else if (drill.mode === "summary") {
    const networks = c.networks.map(cidr4).sort((a, b) => a.start < b.start ? -1 : a.start > b.start ? 1 : 0);
    assert.ok(networks.length >= 2);
    for (const row of networks) assert.equal(row.start % row.size, 0n);
    const low = networks[0].start;
    const high = networks.reduce((max, n) => n.start + n.size - 1n > max ? n.start + n.size - 1n : max, low);
    const diff = low ^ high;
    const prefix = diff === 0n ? 32 : 32 - diff.toString(2).length;
    const size = 1n << BigInt(32 - prefix);
    const start = low & (MAX4 ^ (size - 1n));
    let covered = 0n, end = -1n;
    for (const row of networks) {
      const rowEnd = row.start + row.size;
      if (rowEnd > end) covered += rowEnd - (row.start > end ? row.start : end);
      if (rowEnd > end) end = rowEnd;
    }
    const extra = size - covered;
    expect("summary", `${address4(start)}/${prefix}`);
    expect("extra", extra ? "yes" : "no");
    expect("extraAddresses", extra);
  } else assert.fail(`No independent reference for ${drill.mode}`);
}

for (const mode of modes) {
  test(`${mode}: generated answers agree with independent problem arithmetic at every difficulty`, () => {
    for (const difficulty of difficulties) {
      for (let seed = 1; seed <= 64; seed++) verifyGeneratedMath(subnet.makeDrill(mode, difficulty, seeded(seed * 0x9e3779b1)));
      for (const extreme of [0, 1 - Number.EPSILON]) {
        let draws = 0;
        verifyGeneratedMath(subnet.makeDrill(mode, difficulty, () => {
          if (++draws > 1000) throw new Error("Nonterminating generator");
          return extreme;
        }));
      }
    }
  });
}

test("no-broadcast grading does not reward a directed-broadcast address on /31 or /32", () => {
  assert.equal(check(fixture("no-broadcast", "none"), "none"), true);
  assert.equal(check(fixture("no-broadcast", "none"), "192.0.2.1"), false);
});

function mentionsWorkedValue(drill, value) {
  const steps = drill.workedSteps.join(" ");
  const expected = String(value);
  if (/^\d+$/.test(expected)) {
    assert.match(steps.replace(/(?<=\d),(?=\d)/g, ""), new RegExp(`(?<![0-9])${expected}(?![0-9])`), `${drill.mode}: explain the current value ${expected}`);
  } else assert.ok(steps.includes(expected), `${drill.mode}: explain the current value ${expected}`);
}

for (const mode of modes) {
  test(`${mode}: the walkthrough uses the supplied problem values and reaches every calculated result`, () => {
    for (const difficulty of difficulties) {
      for (let seed = 1; seed <= 12; seed++) {
        const drill = subnet.makeDrill(mode, difficulty, seeded(seed * 0x9e3779b1));
        const c = drill.context;
        for (const field of drill.fields) {
          // Verdicts may be stated naturally; calculated numbers, addresses and
          // allocations must be demonstrated in the actual problem's steps.
          if (!["yes-no", "no-broadcast"].includes(field.format)) mentionsWorkedValue(drill, field.answer);
        }
        if (c.ip) mentionsWorkedValue(drill, c.ip);
        if (c.parent) mentionsWorkedValue(drill, c.parent);
        for (const address of c.addresses ?? []) mentionsWorkedValue(drill, address);
        if (c.networks) {
          // A summary can teach from its enclosing interval without repeating
          // every listed subnet. Verify the actual first and last addresses.
          const ranges = c.networks.map(cidr4);
          const low = ranges.reduce((n, range) => range.start < n ? range.start : n, MAX4);
          const high = ranges.reduce((n, range) => range.start + range.size - 1n > n ? range.start + range.size - 1n : n, 0n);
          mentionsWorkedValue(drill, address4(low));
          mentionsWorkedValue(drill, address4(high));
          mentionsWorkedValue(drill, ranges.length);
        }
        for (const allocation of c.allocations ?? []) {
          for (const value of [allocation.name, allocation.endpoints, allocation.gateways, allocation.reserved]) mentionsWorkedValue(drill, value);
        }
        if (c.subnetCount !== undefined) mentionsWorkedValue(drill, c.subnetCount);
        if (c.ordinal !== undefined) mentionsWorkedValue(drill, c.ordinal);
        if (c.candidate) mentionsWorkedValue(drill, c.candidate);
        if (c.plan) {
          for (const value of [c.plan.network, c.plan.host, c.plan.mask, c.plan.gateway, c.plan.hostOrdinal]) mentionsWorkedValue(drill, value);
        }
      }
    }
  });
}

test("IPv4 walkthroughs show the calculated binary mask rather than asking the learner to infer it", () => {
  for (const mode of ["network", "hosts", "same", "wildcard", "troubleshoot"]) {
    for (const difficulty of difficulties) {
      for (let seed = 1; seed <= 12; seed++) {
        const drill = subnet.makeDrill(mode, difficulty, seeded(seed * 0x9e3779b1));
        const answers = fieldAnswers(drill);
        const prefix = drill.context.prefix ?? drill.context.plan?.prefix ?? Number(answers.prefix);
        const maskBits = ("1".repeat(prefix) + "0".repeat(32 - prefix)).match(/.{8}/g).join(".");
        const dottedMask = maskBits.split(".").map(byte => parseInt(byte, 2)).join(".");
        mentionsWorkedValue(drill, maskBits);
        mentionsWorkedValue(drill, dottedMask);
      }
    }
  }
});

test("a /31 wildcard walkthrough demonstrates both matched addresses without inventing a broadcast endpoint", () => {
  const drill = Array.from({ length: 64 }, (_, i) => subnet.makeDrill("wildcard", "challenge", seeded((i + 1) * 0x9e3779b1))).find(item => item.context.prefix === 31);
  assert.ok(drill, "challenge samples include the /31 ACL-match boundary");
  const first = number4(drill.context.ip);
  mentionsWorkedValue(drill, address4(first));
  mentionsWorkedValue(drill, address4(first + 1n));
  assert.ok(!drill.workedSteps.join(" ").includes(`${address4(first)}–—`));
});
