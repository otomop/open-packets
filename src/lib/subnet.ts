/* IPv4 / IPv6 arithmetic and drill generators for the subnetting trainer. */

export function parseIPv4(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p) || Number(p) > 255) return null;
    n = n * 256 + Number(p);
  }
  return n;
}

export function fmtIPv4(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n >= 2 ** 32) throw new RangeError("IPv4 values must be integers from 0 to 4294967295.");
  return [24, 16, 8, 0].map((s) => Math.floor(n / 2 ** s) % 256).join(".");
}

export function maskFromPrefix(prefix: number): number {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) throw new RangeError("Enter a whole IPv4 prefix from 0 to 32.");
  return prefix === 0 ? 0 : (2 ** 32 - 2 ** (32 - prefix));
}

export function prefixFromMask(mask: string): number | null {
  const n = parseIPv4(mask);
  if (n === null) return null;
  const bits = n.toString(2).padStart(32, "0");
  if (!/^1*0*$/.test(bits)) return null;
  return bits.indexOf("0") === -1 ? 32 : bits.indexOf("0");
}

export interface SubnetInfo {
  network: string;
  broadcast: string;
  first: string;
  last: string;
  hosts: number;
  size: number;
  mask: string;
  wildcard: string;
  prefix: number;
  blockOctet: number; // 0..3 index of the boundary octet (or -1 for /32 / /0)
  blockSize: number;
}

export function subnetInfo(ip: string, prefix: number): SubnetInfo {
  const n = parseIPv4(ip);
  if (n === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) throw new Error("Enter a valid IPv4 address and a prefix from 0 to 32.");
  const size = 2 ** (32 - prefix);
  const network = Math.floor(n / size) * size;
  const broadcast = network + size - 1;
  const hosts = prefix === 32 ? 1 : prefix === 31 ? 2 : size - 2;
  const blockOctet = prefix === 0 || prefix === 32 ? -1 : Math.floor((prefix - 1) / 8);
  const bitsInOctet = prefix - blockOctet * 8;
  const blockSize = prefix === 0 || prefix % 8 === 0 ? (prefix === 0 ? 256 : 1) : 2 ** (8 - bitsInOctet);
  return {
    network: fmtIPv4(network),
    broadcast: prefix >= 31 ? "—" : fmtIPv4(broadcast),
    first: fmtIPv4(prefix >= 31 ? network : network + 1),
    last: fmtIPv4(prefix >= 31 ? broadcast : broadcast - 1),
    hosts,
    size,
    mask: fmtIPv4(maskFromPrefix(prefix)),
    wildcard: fmtIPv4(size - 1),
    prefix,
    blockOctet,
    blockSize,
  };
}

export function toBinaryOctets(ip: string): string[] {
  const n = parseIPv4(ip);
  if (n === null) throw new RangeError("Enter a valid IPv4 address before converting to binary.");
  return [24, 16, 8, 0].map((s) => (Math.floor(n / 2 ** s) % 256).toString(2).padStart(8, "0"));
}

export function sameSubnet(a: string, b: string, prefix: number): boolean {
  const na = parseIPv4(a), nb = parseIPv4(b);
  if (na === null || nb === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;
  const size = 2 ** (32 - prefix);
  return Math.floor(na / size) === Math.floor(nb / size);
}

/** Smallest prefix that provides at least `hosts` usable addresses (classic −2 rule). */
export function prefixForHosts(hosts: number): number {
  if (!Number.isSafeInteger(hosts) || hosts < 1 || hosts > 2 ** 32 - 2) throw new RangeError("A LAN requirement must be a whole number from 1 to 4294967294 usable addresses.");
  for (let p = 30; p >= 0; p--) if (2 ** (32 - p) - 2 >= hosts) return p;
  return 0;
}

/* ---------- IPv6 ---------- */

export function expandIPv6(addr: string): string | null {
  const a = addr.trim().toLowerCase();
  if (!/^[0-9a-f:]+$/.test(a) || (a.match(/::/g) ?? []).length > 1 || /:::/.test(a)) return null;
  const [head, tail] = a.split("::");
  const h = head ? head.split(":") : [];
  const t = tail !== undefined ? (tail ? tail.split(":") : []) : [];
  if (a.includes("::")) {
    const missing = 8 - h.length - t.length;
    if (missing < 1) return null;
    const groups = [...h, ...Array(missing).fill("0"), ...t];
    if (groups.some((g) => g.length === 0 || g.length > 4)) return null;
    return groups.map((g) => g.padStart(4, "0")).join(":");
  }
  if (h.length !== 8 || h.some((g) => g.length === 0 || g.length > 4)) return null;
  return h.map((g) => g.padStart(4, "0")).join(":");
}

export function compressIPv6(addr: string): string | null {
  const full = expandIPv6(addr);
  if (!full) return null;
  const groups = full.split(":").map((g) => g.replace(/^0+(?=.)/, ""));
  // find longest run of "0" groups (length >= 2)
  let best = -1, bestLen = 0, cur = -1, curLen = 0;
  groups.forEach((g, i) => {
    if (g === "0") {
      if (cur === -1) cur = i;
      curLen++;
      if (curLen > bestLen) {
        best = cur;
        bestLen = curLen;
      }
    } else {
      cur = -1;
      curLen = 0;
    }
  });
  if (bestLen >= 2) {
    const left = groups.slice(0, best).join(":");
    const right = groups.slice(best + bestLen).join(":");
    return `${left}::${right}`;
  }
  return groups.join(":");
}

/** Modified EUI-64 interface id from a MAC like 00:1a:2b:3c:4d:5e */
export function eui64(mac: string): string | null {
  const m = mac.trim();
  if (!/^(?:[\da-f]{12}|(?:[\da-f]{2}:){5}[\da-f]{2}|(?:[\da-f]{2}-){5}[\da-f]{2}|(?:[\da-f]{4}\.){2}[\da-f]{4})$/i.test(m)) return null;
  const hex = m.replace(/[:.\-]/g, "").toLowerCase();
  const first = (parseInt(hex.slice(0, 2), 16) ^ 0x02).toString(16).padStart(2, "0");
  const id = first + hex.slice(2, 6) + "fffe" + hex.slice(6);
  return [id.slice(0, 4), id.slice(4, 8), id.slice(8, 12), id.slice(12, 16)].map((g) => g.replace(/^0+(?=.)/, "")).join(":");
}
