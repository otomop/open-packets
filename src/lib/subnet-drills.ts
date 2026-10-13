import { fmtIPv4, parseIPv4, subnetInfo, prefixForHosts, maskFromPrefix, prefixFromMask, expandIPv6, compressIPv6, sameSubnet } from "./subnet";

/* Generated subnetting practice and format-aware grading. */


export type Difficulty = "foundation" | "standard" | "challenge";
export type DrillMode = "network" | "hosts" | "same" | "wildcard" | "ipv6" | "vlsm" | "subnets" | "troubleshoot" | "ipv6-subnet" | "summary";
export type FieldFormat = "ipv4" | "integer" | "prefix" | "cidr4" | "yes-no" | "ipv6-expanded" | "ipv6-canonical" | "ipv6" | "cidr6" | "no-broadcast";
export interface DrillField {
  key: string; label: string; answer: string; placeholder?: string; format?: FieldFormat;
  help?: string; feedback?: string; requiredHosts?: number; min?: number; max?: number;
}
export interface AddressRequirement { name: string; endpoints: number; gateways: number; reserved: number }
/** Given problem data for independent checks without parsing teaching prose. */
export interface DrillContext {
  ip?: string; prefix?: number; addresses?: string[]; parent?: string;
  childPrefix?: number; subnetCount?: number; ordinal?: number; requiredHosts?: number;
  allocations?: AddressRequirement[];
  plan?: { network: string; prefix: number; host: string; mask: string; gateway: string; hostOrdinal: number; intendedHost: string; intendedGateway: string };
  networks?: string[]; candidate?: string; ipv6Operation?: "compress" | "expand";
}
export interface SubnetDrill {
  mode: DrillMode; difficulty: Difficulty; prompt: string; detail?: string; fields: DrillField[];
  explain: string; workedSteps: string[]; binary?: { ip: string; prefix: number };
  rule?: string; help?: string; context?: DrillContext;
}
export interface FieldGrade { key: string; correct: boolean; feedback: string }
export interface DrillGrade { fields: FieldGrade[]; allCorrect: boolean }

const IPV4_SPACE = 2 ** 32;
const PRIVATE_BASE = 10 * 2 ** 24;
const validPrefix = (prefix: number, bits = 32): boolean => Number.isInteger(prefix) && prefix >= 0 && prefix <= bits;
function ipv6Number(ip: string): bigint | null {
  const full = expandIPv6(ip);
  return full === null ? null : BigInt(`0x${full.replace(/:/g, "")}`);
}
function fmtIPv6(n: bigint): string {
  if (n < 0n || n >= (1n << 128n)) throw new RangeError("IPv6 value outside the 128-bit address space.");
  return compressIPv6(n.toString(16).padStart(32, "0").match(/.{4}/g)!.join(":"))!;
}
function network6(n: bigint, prefix: number): bigint {
  if (!validPrefix(prefix, 128)) throw new RangeError("Enter a whole IPv6 prefix from 0 to 128.");
  const bits = BigInt(128 - prefix);
  return (n >> bits) << bits;
}
function randomTools(random: () => number) {
  const rnd = (n: number): number => {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError("The random source must return a finite value from 0 (inclusive) to 1 (exclusive).");
    return Math.floor(value * n);
  };
  return { rnd, pick: <T,>(values: readonly T[]): T => values[rnd(values.length)] };
}
const numberField = (key: string, label: string, answer: number, max = IPV4_SPACE, min = 0): DrillField => ({ key, label, answer: String(answer), format: "integer", min, max, placeholder: "Whole number" });
const prefixField = (key: string, label: string, answer: number, requiredHosts?: number): DrillField => ({ key, label, answer: String(answer), format: "prefix", min: 0, max: 32, placeholder: "e.g. /26", requiredHosts });
const ipField = (key: string, label: string, answer: string): DrillField => ({ key, label, answer, format: "ipv4", placeholder: "e.g. 10.20.0.1" });
const cidrField = (key: string, label: string, answer: string, requiredHosts?: number): DrillField => ({ key, label, answer, format: "cidr4", placeholder: "Network/prefix", requiredHosts });
const yesField = (key: string, label: string, yes: boolean): DrillField => ({ key, label, answer: yes ? "yes" : "no", format: "yes-no", placeholder: "yes / no" });
const totalNeeded = (r: AddressRequirement): number => r.endpoints + r.gateways + r.reserved;

const byteBits = (value: number): string => value.toString(2).padStart(8, "0");
const ipv4Bits = (address: string): string => address.split(".").map(octet => byteBits(Number(octet))).join(".");

function maskWalkthrough(prefix: number): string {
  const mask = fmtIPv4(maskFromPrefix(prefix));
  const conversions = [...new Set(mask.split(".").map(Number))].map(value => {
    if (value === 0) return "00000000 has no set bits, so its decimal value is 0";
    const places = [128, 64, 32, 16, 8, 4, 2, 1].filter(place => (value & place) !== 0);
    return `${byteBits(value)} = ${places.join(" + ")} = ${value}`;
  });
  return `/${prefix} means ${prefix} network bits and 32 − ${prefix} = ${32 - prefix} host bits. Write ${prefix} one-bits followed by ${32 - prefix} zero-bits: ${ipv4Bits(mask)}. Convert the octets by adding the place values of their one-bits: ${conversions.join("; ")}. In the same octet order, the mask is ${mask}.`;
}

function boundaryWalkthrough(address: string, prefix: number): string {
  const s = subnetInfo(address, prefix);
  if (prefix === 32) return `All 32 bits are fixed by 255.255.255.255. There are no host bits to clear, so the lowest address stays ${address}; the block size is 2^0 = 1.`;
  const index = Math.floor(prefix / 8), value = Number(address.split(".")[index]);
  const maskByte = Number(s.mask.split(".")[index]), increment = 256 - maskByte;
  const block = Math.floor(value / increment), start = block * increment;
  return `The first octet containing host bits is octet ${index + 1}. Its mask value is ${maskByte}, so boundaries occur every 256 − ${maskByte} = ${increment}. The address has ${value} there. Divide ${value} by ${increment} and round down to ${block}, then multiply back: ${block} × ${increment} = ${start}. Keep earlier octets, use ${start} here and clear any later octets to zero: ${s.network}.`;
}

function andWalkthrough(address: string, prefix: number): string {
  const s = subnetInfo(address, prefix), index = Math.min(3, Math.floor(prefix / 8));
  const value = Number(address.split(".")[index]), maskByte = Number(s.mask.split(".")[index]);
  const masked = value & maskByte;
  return `${address} AND ${s.mask} gives ${s.network}. In octet ${index + 1}, ${byteBits(value)} AND ${byteBits(maskByte)} = ${byteBits(masked)} (${value} AND ${maskByte} = ${masked}). A mask one keeps an address bit; a mask zero clears it. Earlier full-prefix octets stay unchanged and any later host octets become zero.`;
}

function ipv6FormatWalkthrough(full: string, canonical: string, compress: boolean): string[] {
  const padded = full.split(":"), short = padded.map(group => Number.parseInt(group, 16).toString(16));
  if (!compress) {
    const hasGap = canonical.includes("::"), visible = canonical.split(":").filter(Boolean);
    const [left, right = ""] = canonical.split("::");
    const leftCount = left ? left.split(":").length : 0, rightCount = right ? right.split(":").length : 0;
    return [
      `Read ${canonical}. ${hasGap ? `There are ${leftCount} visible groups before :: and ${rightCount} after it: ${leftCount} + ${rightCount} = ${visible.length} visible groups.` : `It already shows ${visible.length} groups and contains no ::.`} A complete IPv6 address has eight groups.`,
      hasGap ? `The :: therefore represents 8 − ${visible.length} = ${8 - visible.length} all-zero groups. Insert them between the visible left and right portions. The eight groups before padding are ${short.join(":")}.` : `No groups are missing: 8 − ${visible.length} = 0. Keep the existing eight positions: ${short.join(":")}; only the width of each group needs checking.`,
      `Pad on the left to four hexadecimal digits in each position: ${short.map((group, index) => `${group} → ${padded[index]}`).join("; ")}. Padding changes the spelling, not the value.`,
      `Join those eight padded groups with single colons: ${full}. Check 8 × 4 = 32 hexadecimal digits, representing 32 × 4 = 128 bits. There is no :: in the expanded answer.`,
    ];
  }
  const runs: { start: number; length: number }[] = [];
  for (let index = 0; index < short.length;) {
    if (short[index] !== "0") { index++; continue; }
    const start = index;
    while (index < short.length && short[index] === "0") index++;
    runs.push({ start, length: index - start });
  }
  const longest = Math.max(0, ...runs.map(run => run.length));
  const choices = runs.filter(run => run.length === longest), chosen = choices[0];
  const runList = runs.map(run => `group${run.length === 1 ? "" : "s"} ${run.start + 1}${run.length > 1 ? `–${run.start + run.length}` : ""} (${run.length} zero group${run.length === 1 ? "" : "s"})`).join("; ");
  return [
    `Start with the eight groups in ${full}. Remove only leading zeros within each group: ${padded.map((group, index) => `${group} → ${short[index]}`).join("; ")}. Retain one 0 for a group whose value is zero.`,
    `The shortened groups, before any ::, are ${short.join(":")}. ${runs.length ? `Their zero runs are ${runList}.` : "There are no all-zero groups, so there is no run to compress."}`,
    longest >= 2 ? `${choices.length > 1 ? `There are ${choices.length} tied longest runs of ${longest} groups. Choose the leftmost, ` : `The longest run has ${longest} groups: choose `}groups ${chosen.start + 1}–${chosen.start + chosen.length}. Replace exactly that run with ::; ${8 - longest} other groups remain visible.` : longest === 1 ? "The longest zero run is only one group. RFC 5952 keeps that group as 0 rather than using ::, even though single-group compression can be valid IPv6 syntax." : "Because there is no zero run, do not insert ::. The answer still uses all eight groups, with their leading zeros removed.",
    `Use lowercase hexadecimal and join the remaining groups: ${canonical}. ${longest >= 2 ? `Expanding its :: restores ${longest} zero groups: ${8 - longest} visible + ${longest} omitted = 8, reproducing the original address.` : "Padding its eight groups back to four digits reproduces the original address."}`,
  ];
}

export function makeDrill(mode: DrillMode, difficulty: Difficulty = "standard", random: () => number = Math.random): SubnetDrill {
  if (!["foundation", "standard", "challenge"].includes(difficulty)) throw new RangeError("Unknown subnetting difficulty.");
  const { rnd, pick } = randomTools(random);
  const ip = (): string => fmtIPv4(PRIVATE_BASE + rnd(2 ** 24));
  const finish = (data: Omit<SubnetDrill, "mode" | "difficulty" | "explain"> & { explain?: string }): SubnetDrill => ({ ...data, mode, difficulty, explain: data.explain ?? data.workedSteps.join(" ") });
  const ordinaryPrefixes = difficulty === "foundation" ? [24, 25, 26, 27, 28] : difficulty === "standard" ? [12, 15, 18, 20, 21, 23, 25, 27, 29, 30] : [9, 11, 14, 17, 19, 22, 26, 28, 30];

  if (mode === "network") {
    const prefix = pick(difficulty === "challenge" ? [...ordinaryPrefixes, 31, 32] : ordinaryPrefixes);
    const address = ip(), s = subnetInfo(address, prefix), special = prefix >= 31;
    return finish({
      prompt: `${address}/${prefix}`,
      detail: prefix === 31 ? "This is an RFC 3021 point-to-point link. Identify its two endpoint addresses; enter none for a directed broadcast." : prefix === 32 ? "This is a single IPv4 host prefix, not an ordinary LAN. Identify its one address; enter none for a directed broadcast." : "Find the boundaries and usable address range of this ordinary IPv4 LAN.",
      fields: [ipField("network", special ? "Lowest address in the prefix" : "Network address", s.network),
        special ? { key: "broadcast", label: "Directed broadcast", answer: "none", format: "no-broadcast", placeholder: "none", help: "Use none, n/a or —." } : ipField("broadcast", "Broadcast address", s.broadcast),
        ipField("first", special ? "First endpoint / individual address" : "First usable address", s.first),
        ipField("last", special ? "Last endpoint / individual address" : "Last usable address", s.last),
        numberField("hosts", special ? "Addresses represented / endpoints" : "Usable addresses", s.hosts)],
      workedSteps: [maskWalkthrough(prefix), boundaryWalkthrough(address, prefix),
        `The ${32 - prefix} host bits give 2^${32 - prefix} = ${s.size} addresses per block. Starting at ${s.network}, add ${s.size} − 1 = ${s.size - 1} addresses to reach the block's last address, ${fmtIPv4(parseIPv4(s.network)! + s.size - 1)}.`,
        prefix === 31 ? `The problem specifies an RFC 3021 point-to-point /31. Its two addresses, ${s.first} and ${s.last}, both identify endpoints; neither is reserved as the directed broadcast. Enter none for broadcast.` : prefix === 32 ? `The /32 fixes a single address, ${s.network}. It has no separate directed broadcast, so enter none. This is a host prefix, not an ordinary Ethernet LAN with network and broadcast reservations.` : `For this ordinary LAN, ${s.network} is the subnet identifier and ${s.broadcast} is the broadcast address. The first usable address is the network plus 1: ${s.first}. The last is the broadcast minus 1: ${s.last}.`,
        special ? `Enter first address ${s.first}, last address ${s.last}, and address count ${s.hosts}. Do not subtract two: ${prefix === 31 ? "that would incorrectly remove both point-to-point endpoints" : "that would incorrectly treat a single-host prefix as an ordinary LAN"}.` : `Subtract the two reserved addresses from the block: ${s.size} − 2 = ${s.hosts} usable addresses. The answer is network ${s.network}, broadcast ${s.broadcast}, range ${s.first}–${s.last}, and ${s.hosts} usable addresses.`,
        `Check the result against the original ${address}: it lies between the lowest address ${s.network} and highest address ${fmtIPv4(parseIPv4(s.network)! + s.size - 1)}. Applying mask ${s.mask} returns ${s.network}, confirming the prefix boundary.`],
      binary: { ip: address, prefix }, context: { ip: address, prefix },
      rule: special ? "Treat /31 point-to-point and /32 host prefixes explicitly; do not apply ordinary LAN host subtraction." : "Network = all host bits zero; broadcast = all host bits one; usable addresses = block size − 2.",
    });
  }
  if (mode === "hosts") {
    const endpoints = pick(difficulty === "foundation" ? [2, 5, 10, 20, 30, 50, 60] : difficulty === "standard" ? [14, 25, 30, 50, 60, 100, 120, 250, 300, 500] : [125, 250, 500, 1000, 2000, 4000, 6000]);
    const reserved = difficulty === "foundation" ? 0 : pick([2, 4, 8, 16, 32]);
    const requirement = { name: "LAN", endpoints, gateways: 1, reserved };
    const need = totalNeeded(requirement), prefix = prefixForHosts(need), s = subnetInfo("10.0.0.0", prefix);
    return finish({
      prompt: `Size a LAN for ${endpoints} endpoints, 1 gateway address and ${reserved} additional reserved usable addresses.`,
      detail: "The endpoint count excludes the gateway and reserves. Choose the smallest ordinary LAN block that satisfies the entire address budget.",
      fields: [numberField("required", "Total usable addresses needed", need), prefixField("prefix", "Longest prefix that fits", prefix, need), { ...ipField("mask", "Subnet mask", s.mask), requiredHosts: need }, numberField("hosts", "Usable addresses provided", s.hosts)],
      workedSteps: [`Count every usable address requested: ${endpoints} endpoints + 1 gateway + ${reserved} reserved usable addresses = ${need}. The gateway and reserves were not included in the endpoint count.`,
        `An ordinary IPv4 LAN also reserves its network and broadcast addresses. Add those separately: ${need} + 2 = ${need + 2} total addresses required.`,
        `Compare powers of two around ${need + 2}: 2^${31 - prefix} = ${s.size / 2} is too small, while 2^${32 - prefix} = ${s.size} is large enough. Choose ${32 - prefix} host bits, so the prefix is 32 − ${32 - prefix} = /${prefix}.`,
        maskWalkthrough(prefix),
        `The chosen /${prefix} provides ${s.size} − 2 = ${s.hosts} usable addresses, enough for ${need}. The next longer prefix, /${prefix + 1}, would provide only ${s.size / 2} − 2 = ${s.size / 2 - 2}; ${s.size / 2 - 2} is less than ${need}, proving that /${prefix} is the longest prefix that fits.`,
        `Enter total required ${need}, prefix /${prefix}, mask ${s.mask}, and usable capacity ${s.hosts}. After the full planned budget, ${s.hosts} − ${need} = ${s.hosts - need} usable addresses remain beyond the requested reserves.`],
      context: { requiredHosts: need, allocations: [requirement] }, rule: "Count gateways and reserved usable addresses before choosing a prefix. Network and broadcast are additional overhead.",
    });
  }
  if (mode === "same") {
    const prefix = pick(ordinaryPrefixes), size = 2 ** (32 - prefix);
    const base = parseIPv4(subnetInfo(ip(), prefix).network)!;
    const offsetA = 1 + rnd(size - 2), wantSame = rnd(2) === 0;
    let offsetB = 1 + rnd(size - 2);
    if (wantSame && offsetA === offsetB) offsetB = offsetB === size - 2 ? 1 : offsetB + 1;
    const otherBase = base + size < PRIVATE_BASE + 2 ** 24 ? base + size : base - size;
    const a = fmtIPv4(base + offsetA), b = fmtIPv4((wantSame ? base : otherBase) + offsetB);
    return finish({
      prompt: `${a} and ${b}, both configured with /${prefix}`,
      detail: "Both addresses are distinct ordinary hosts. Assume the same working Layer 2 segment, no isolation or filters, and no special routing or proxy ARP. Does their IP configuration place them in the same subnet?",
      fields: [yesField("same", "Same IP subnet?", wantSame), ipField("networkA", "First host's network", subnetInfo(a, prefix).network), ipField("networkB", "Second host's network", subnetInfo(b, prefix).network)],
      workedSteps: [maskWalkthrough(prefix),
        `Find the first host's network. ${andWalkthrough(a, prefix)}`,
        `Repeat independently for the second host. ${andWalkthrough(b, prefix)}`,
        `Compare the complete results: ${subnetInfo(a, prefix).network}/${prefix} and ${subnetInfo(b, prefix).network}/${prefix}. They ${wantSame ? "match, so answer yes" : "differ, so answer no"}. Enter ${subnetInfo(a, prefix).network} for the first network and ${subnetInfo(b, prefix).network} for the second.`,
        `Check that these are actual host addresses: ${a} is within ${subnetInfo(a, prefix).first}–${subnetInfo(a, prefix).last}; ${b} is within ${subnetInfo(b, prefix).first}–${subnetInfo(b, prefix).last}. Neither is a network or broadcast address, and the addresses are distinct.`,
        wantSame ? `With the stated working Layer 2 segment and no filtering, ${a} treats ${b} as local and resolves it directly with ARP; ${b} makes the same decision about ${a}. A gateway is not needed for this exchange.` : `Despite sharing the stated Layer 2 segment, ${a} treats ${b} as remote and vice versa. An appropriate gateway and routes would be needed; this arithmetic does not establish that such routing is configured.`],
      binary: { ip: a, prefix }, context: { addresses: [a, b], prefix }, rule: "Compare all prefix bits, not just the first three octets.",
    });
  }
  if (mode === "wildcard") {
    const prefix = pick(difficulty === "foundation" ? [16, 24, 25, 26, 27, 28] : difficulty === "standard" ? [...ordinaryPrefixes, 8, 16, 32] : [0, ...ordinaryPrefixes, 31, 32]);
    const s = subnetInfo(ip(), prefix);
    return finish({
      prompt: `${s.network}/${prefix}`,
      detail: "Write the contiguous subnet mask and its matching ACL wildcard. This exercise describes an address match, not an interface filtering policy.",
      fields: [ipField("mask", "Subnet mask", s.mask), ipField("wildcard", "Wildcard mask", s.wildcard)],
      workedSteps: [`The requested match is ${s.network}/${prefix}. Keep its first ${prefix} address bits fixed and allow the remaining ${32 - prefix} bits to vary.`,
        maskWalkthrough(prefix),
        `Invert the subnet mask one octet at a time: ${s.mask.split(".").map((octet, index) => `octet ${index + 1}: 255 − ${octet} = ${255 - Number(octet)}`).join("; ")}. In the original order, these four results give wildcard ${s.wildcard}.`,
        `Check the bits: mask ${ipv4Bits(s.mask)} becomes wildcard ${ipv4Bits(s.wildcard)}. The ${prefix} wildcard zero-bits compare the corresponding address bits; the ${32 - prefix} one-bits ignore them.`,
        `Enter mask ${s.mask} and wildcard ${s.wildcard}. ${prefix === 32 ? `With ${s.network} as the base, every bit must match: this selects that one address.` : prefix === 0 ? "Every bit is ignored, so this /0 match includes the entire IPv4 address space." : prefix === 31 ? `The wildcard ignores one bit and selects exactly two addresses: ${s.first} and ${s.last}.` : `With ${s.network} as the base, the match spans ${s.network}–${s.broadcast}, including the subnet identifier and broadcast address; an ACL match is not a list of usable hosts.`} The inverse-mask shortcut is valid here because the question specifies a contiguous CIDR subnet.`],
      binary: { ip: s.network, prefix }, context: { ip: s.network, prefix }, rule: "For a CIDR subnet match, mask octet + wildcard octet = 255.",
    });
  }
  if (mode === "subnets") {
    const parentPrefix = pick(difficulty === "foundation" ? [24, 25] : difficulty === "standard" ? [16, 20, 22, 24] : [10, 13, 17, 21]);
    const requested = pick(difficulty === "foundation" ? [2, 4] : difficulty === "standard" ? [3, 5, 6, 8] : [5, 9, 17, 24]);
    const borrowed = Math.ceil(Math.log2(requested)), childPrefix = parentPrefix + borrowed;
    const count = 2 ** borrowed, parent = subnetInfo(ip(), parentPrefix), base = parseIPv4(parent.network)!;
    const size = 2 ** (32 - childPrefix), ordinal = 2 + rnd(count - 1);
    return finish({
      prompt: `Divide ${parent.network}/${parentPrefix} into at least ${requested} equal-size subnets.`,
      detail: "Borrow the fewest possible bits. Number the resulting subnets from 1 in increasing address order; subnet 1 starts at the parent network. Enter network/prefix for the requested rows.",
      fields: [prefixField("prefix", "Child prefix", childPrefix), numberField("count", "Total equal-size subnets created", count), cidrField("firstSubnet", "Subnet 1", `${parent.network}/${childPrefix}`), cidrField("selectedSubnet", `Subnet ${ordinal}`, `${fmtIPv4(base + (ordinal - 1) * size)}/${childPrefix}`)],
      workedSteps: [`Start with ${parent.network}/${parentPrefix}. It has 32 − ${parentPrefix} = ${32 - parentPrefix} host bits and 2^${32 - parentPrefix} = ${parent.size} addresses, spanning ${parent.network}–${parent.broadcast}. The child subnets must stay inside that range.`,
        `Find the fewest bits that produce at least ${requested} children. With ${borrowed - 1} bits, 2^${borrowed - 1} = ${count / 2}, which is fewer than ${requested}. With ${borrowed} bits, 2^${borrowed} = ${count}, which is enough. Borrow ${borrowed} bits.`,
        `Add those bits to the parent's prefix: ${parentPrefix} + ${borrowed} = /${childPrefix}. Each child has 32 − ${childPrefix} = ${32 - childPrefix} host bits, so its block size is 2^${32 - childPrefix} = ${size} addresses. Its mask is ${fmtIPv4(maskFromPrefix(childPrefix))}.`,
        `Subnet 1 uses offset zero and starts at ${parent.network}: enter ${parent.network}/${childPrefix}. Its block ends ${size - 1} addresses later at ${fmtIPv4(base + size - 1)}. This first subnet counts; do not subtract a subnet-zero allocation.`,
        `Subnet ${ordinal} is ${ordinal} − 1 = ${ordinal - 1} complete blocks after subnet 1. Multiply ${ordinal - 1} × ${size} = ${(ordinal - 1) * size} addresses, then add that offset to ${parent.network}: ${fmtIPv4(base + (ordinal - 1) * size)}. Enter ${fmtIPv4(base + (ordinal - 1) * size)}/${childPrefix}.`,
        `Check its boundary: offset ${(ordinal - 1) * size} ÷ block size ${size} = ${ordinal - 1} exactly. The selected child spans ${fmtIPv4(base + (ordinal - 1) * size)}–${fmtIPv4(base + ordinal * size - 1)}, still inside ${parent.network}/${parentPrefix}.`,
        `Verify the whole allocation: ${count} children × ${size} addresses = ${parent.size}, exactly the parent size. Enter child prefix /${childPrefix} and total count ${count}; ${count} − ${requested} = ${count - requested} children are available beyond the minimum requested.`],
      context: { parent: `${parent.network}/${parentPrefix}`, subnetCount: requested, childPrefix, ordinal }, binary: { ip: parent.network, prefix: childPrefix }, rule: "Child prefix = parent prefix + borrowed bits. Subnet count = 2^borrowed bits.",
    });
  }
  if (mode === "troubleshoot") {
    const prefix = pick(ordinaryPrefixes.filter(p => p <= 29)), s = subnetInfo(ip(), prefix), base = parseIPv4(s.network)!;
    const hostOrdinal = 2 + rnd(Math.min(s.hosts - 1, 50));
    const intendedHost = fmtIPv4(base + hostOrdinal), intendedGateway = s.first;
    const fault = rnd(difficulty === "foundation" ? 4 : 5);
    const host = fault === 1 ? s.network : fault === 2 ? s.broadcast : intendedHost;
    const mask = fault === 3 ? fmtIPv4(maskFromPrefix(prefix + 1)) : s.mask;
    const adjacentBase = base + s.size < PRIVATE_BASE + 2 ** 24 ? base + s.size : base - s.size;
    const gateway = fault === 4 ? fmtIPv4(adjacentBase + 1) : intendedGateway;
    return finish({
      prompt: `Approved LAN: ${s.network}/${prefix}. The gateway uses the first usable address; this workstation must use usable address number ${hostOrdinal}.`,
      detail: `Current workstation: address ${host}, mask ${mask}, gateway ${gateway}. Does it match the approved plan? Then enter all three intended values, retaining fields that are already right. Assume one working LAN, no duplicate assignments, no filtering and no special routes.`,
      fields: [yesField("valid", "Matches the approved address plan?", fault === 0), ipField("host", "Intended workstation address", intendedHost), ipField("mask", "Intended subnet mask", s.mask), ipField("gateway", "Intended gateway", intendedGateway)],
      workedSteps: [`Use the approved ${s.network}/${prefix} as the reference, rather than treating the current settings as correct. ${maskWalkthrough(prefix)}`,
        `The approved block contains 2^${32 - prefix} = ${s.size} addresses. Add ${s.size - 1} to ${s.network} to find broadcast ${s.broadcast}. Reserve those two boundary addresses; the usable range is ${s.first}–${s.last}.`,
        `Number usable addresses from 1, immediately after the network identifier. The gateway is ${s.network} + 1 address = ${intendedGateway}. Workstation number ${hostOrdinal} is ${s.network} + ${hostOrdinal} addresses = ${intendedHost}; it is inside the usable range and distinct from the gateway.`,
        `Compare the current workstation address ${host} with that plan. ${fault === 1 ? `It equals the network identifier ${s.network}, so it cannot be this ordinary host's address.` : fault === 2 ? `It equals the broadcast address ${s.broadcast}, so it cannot be assigned to the workstation.` : `It matches the required host address ${intendedHost}. Keep this field.`} ${fault === 1 || fault === 2 ? `The required correction is ${intendedHost}.` : "This address check does not yet validate the mask or gateway."}`,
        `Compare the current mask ${mask} with approved ${s.mask}. ${fault === 3 ? `The current mask is /${prefix + 1}, with ${s.size / 2} addresses per block instead of ${s.size}. It changes the host's local/remote decision; replace it with ${s.mask}.` : `It is the intended /${prefix}; keep ${s.mask}.`} Do not alter the approved subnet size to make another incorrect setting appear local.`,
        `Check gateway ${gateway} using the approved mask ${s.mask}: its network is ${subnetInfo(gateway, prefix).network}/${prefix}. ${fault === 4 ? `That differs from ${s.network}/${prefix}, so this gateway is off-link under the plan. Replace it with the assigned first usable address ${intendedGateway}.` : `That matches ${s.network}/${prefix}, and ${gateway} is the assigned first usable address. Keep it.`}`,
        `Answer ${fault === 0 ? "yes" : "no"} to whether the current settings match the complete plan. Enter workstation ${intendedHost}, mask ${s.mask}, and gateway ${intendedGateway}. ${fault === 0 ? "No addressing change is needed." : "Change the identified wrong field and retain the others."} Then test the gateway and intended remote application separately; correct arithmetic is not proof of application service.`],
      context: { plan: { network: s.network, prefix, host, mask, gateway, hostOrdinal, intendedHost, intendedGateway } }, binary: { ip: intendedHost, prefix }, rule: "Validate host usability, exact mask and reachable on-link gateway against the approved plan.",
    });
  }
  if (mode === "vlsm") {
    const parentPrefix = pick(difficulty === "foundation" ? [24] : difficulty === "standard" ? [20, 22, 24] : [16, 18, 21, 23]);
    const differences = difficulty === "foundation" ? [1, 2, 3] : difficulty === "standard" ? [1, 2, 3, 4] : [2, 2, 3, 4];
    const parent = subnetInfo(ip(), parentPrefix);
    const requirements: AddressRequirement[] = differences.map((difference, index) => {
      const size = 2 ** (32 - parentPrefix - difference);
      const need = size / 2 - 1 + rnd(size / 2);
      const reserved = difficulty === "foundation" ? 0 : Math.min(pick([1, 2, 4, 8]), Math.max(0, need - 3));
      return { name: `LAN ${String.fromCharCode(65 + index)}`, endpoints: need - 1 - reserved, gateways: 1, reserved };
    });
    // Rotate requirements so the supplied order is not always the allocation order.
    const rotation = rnd(requirements.length);
    const supplied = [...requirements.slice(rotation), ...requirements.slice(0, rotation)].map((r, i) => ({ ...r, name: `LAN ${String.fromCharCode(65 + i)}` }));
    const ordered = [...supplied].sort((a, b) => totalNeeded(b) - totalNeeded(a) || a.name.localeCompare(b.name));
    let cursor = parseIPv4(parent.network)!;
    const answers = new Map<string, string>(), allocationSteps: string[] = [];
    for (const r of ordered) {
      const need = totalNeeded(r), prefix = prefixForHosts(need), size = 2 ** (32 - prefix);
      cursor = Math.ceil(cursor / size) * size;
      const answer = `${fmtIPv4(cursor)}/${prefix}`;
      answers.set(r.name, answer);
      allocationSteps.push(`${r.name} needs ${r.endpoints} endpoints + ${r.gateways} gateway + ${r.reserved} reserves = ${need} usable addresses. Add network and broadcast: ${need} + 2 = ${need + 2} total. A /${prefix + 1} supplies only ${size / 2 - 2} usable addresses; /${prefix} supplies ${size - 2}. Choose the smallest sufficient block: 2^${32 - prefix} = ${size} total addresses, /${prefix}.`);
      const offset = cursor - parseIPv4(parent.network)!;
      const child = subnetInfo(fmtIPv4(cursor), prefix);
      allocationSteps.push(`Place ${r.name} at the next free address, ${fmtIPv4(cursor)}. It is ${offset} addresses after the aligned parent start, and ${offset} ÷ ${size} = ${offset / size} exactly, so this is a /${prefix} boundary. Enter ${answer}. It covers ${child.network}–${child.broadcast}, with usable range ${child.first}–${child.last}. The next free address is ${fmtIPv4(cursor + size)}.`);
      cursor += size;
    }
    return finish({
      prompt: `Allocate ordinary LANs from ${parent.network}/${parentPrefix}.`,
      detail: supplied.map(r => `${r.name}: ${r.endpoints} endpoints + ${r.gateways} gateway + ${r.reserved} reserved usable addresses.`).join(" ") + " Use the policy below so each row has one expected allocation.",
      fields: supplied.map((r, i) => ({ ...cidrField(`s${i}`, `${r.name} — network/prefix`, answers.get(r.name)!, totalNeeded(r)), help: `${totalNeeded(r)} usable addresses needed, including the gateway and reserves.` })),
      workedSteps: [`The parent ${parent.network}/${parentPrefix} contains 2^${32 - parentPrefix} = ${parent.size} addresses, spanning ${parent.network}–${parent.broadcast}. Start allocation at ${parent.network}; every child block must fit inside this range.`,
        `First compute the complete usable budgets: ${supplied.map(r => `${r.name}: ${r.endpoints} + ${r.gateways} + ${r.reserved} = ${totalNeeded(r)}`).join("; ")}. Descending total requirement gives ${ordered.map(r => `${r.name} (${totalNeeded(r)})`).join(", ")}. If totals tie, use alphabetical LAN name as the stated policy requires.`,
        ...allocationSteps,
        `Check the completed plan: the child blocks occupy ${cursor - parseIPv4(parent.network)!} addresses from ${parent.network} through ${fmtIPv4(cursor - 1)}, within the parent ending at ${parent.broadcast}. Each block starts where the previous one ends plus 1, so none overlap. Remaining space is ${parent.size} − ${cursor - parseIPv4(parent.network)!} = ${parent.size - (cursor - parseIPv4(parent.network)!)} addresses, from ${fmtIPv4(cursor)} through ${parent.broadcast}. Enter each allocation in its named LAN row, even when the allocation order differs from row order.`],
      context: { parent: `${parent.network}/${parentPrefix}`, allocations: supplied },
      rule: "Use the smallest block for each total; largest total first, alphabetical name for ties. Start at the parent's lowest address and place each block at the next valid boundary without deliberate gaps.",
      help: "Other nonoverlapping VLSM designs can work. This exercise grades the explicit allocation policy, not every possible design.",
    });
  }
  if (mode === "summary") {
    const childPrefix = pick(difficulty === "foundation" ? [24, 26] : difficulty === "standard" ? [20, 23, 25, 27] : [13, 18, 21, 26, 28]);
    const spanBits = difficulty === "foundation" ? 1 : pick([2, 3]);
    const parent = subnetInfo(ip(), childPrefix - spanBits), base = parseIPv4(parent.network)!, size = 2 ** (32 - childPrefix);
    const span = 2 ** spanBits;
    const indexes = difficulty === "foundation" ? [0, 1] : rnd(2) === 0 ? Array.from({ length: span }, (_, i) => i) : [0, span - 1];
    const networks = indexes.map(i => `${fmtIPv4(base + i * size)}/${childPrefix}`);
    const low = base, high = base + (indexes[indexes.length - 1] + 1) * size - 1;
    let prefix = 32;
    while (Math.floor(low / 2 ** (32 - prefix)) !== Math.floor(high / 2 ** (32 - prefix))) prefix--;
    const summary = subnetInfo(fmtIPv4(low), prefix), extra = summary.size - indexes.length * size;
    return finish({
      prompt: `Find the single smallest covering summary for ${networks.join(", ")}.`,
      detail: "Include every address in every listed subnet. Count extra addresses, not usable hosts. A covering summary may include networks that were not listed.",
      fields: [cidrField("summary", "Smallest covering network/prefix", `${summary.network}/${prefix}`), yesField("extra", "Includes addresses outside the listed subnets?", extra > 0), numberField("extraAddresses", "Number of extra addresses covered", extra)],
      workedSteps: [`The supplied subnets are ${networks.join(", ")}. They all use /${childPrefix}, so each contains 2^${32 - childPrefix} = ${size} addresses. Put them in increasing address order; these are already listed in that order.`,
        `The lowest required address is ${fmtIPv4(low)}. The last listed network is ${networks[networks.length - 1]}; add ${size} − 1 = ${size - 1} addresses to its start to obtain highest required address ${fmtIPv4(high)}. The summary must cover this full interval, not just the listed network identifiers.`,
        `Write the two interval endpoints in binary:\n${fmtIPv4(low)} = ${ipv4Bits(fmtIPv4(low))}\n${fmtIPv4(high)} = ${ipv4Bits(fmtIPv4(high))}\nCompare from the left; a summary must preserve only bits shared by both endpoints.`,
        `The first ${prefix} bits match: ${low.toString(2).padStart(32, "0").slice(0, prefix)}. Bit ${prefix + 1} differs: ${low.toString(2).padStart(32, "0")[prefix]} in the low endpoint and ${high.toString(2).padStart(32, "0")[prefix]} in the high endpoint. Therefore /${prefix} is the longest common prefix; /${prefix + 1} would separate these endpoints and could not cover both.`,
        `Clear the remaining ${32 - prefix} bits to form the summary network ${summary.network}. The result is ${summary.network}/${prefix}, mask ${summary.mask}, covering ${summary.network}–${summary.broadcast}: 2^${32 - prefix} = ${summary.size} addresses.`,
        `The listed subnets do not overlap. Their combined size is ${indexes.length} × ${size} = ${indexes.length * size} addresses. The single summary covers ${summary.size} − ${indexes.length * size} = ${extra} additional addresses. Count all addresses here; do not subtract network and broadcast from each block.`,
        `Enter summary ${summary.network}/${prefix}, extra-space answer ${extra > 0 ? "yes" : "no"}, and extra-address count ${extra}. ${extra ? `The omitted interval ${fmtIPv4(base + size)}–${fmtIPv4(base + (span - 1) * size - 1)} is included by this summary. Before using it operationally, check that directing traffic for that additional space is appropriate.` : "The listed subnets fill this summary exactly, so there is no extra coverage."}`],
      context: { networks }, binary: { ip: fmtIPv4(low), prefix }, rule: "Smallest covering summary = longest shared prefix of the lowest and highest included address.",
    });
  }
  if (mode === "ipv6") {
    const groups = Array.from({ length: 8 }, () => 1 + rnd(65535));
    const shape = pick(difficulty === "foundation" ? [0, 1] : difficulty === "standard" ? [0, 1, 2, 3] : [0, 1, 2, 3, 4, 5]);
    if (shape === 0) groups.splice(2, 3, 0, 0, 0);
    if (shape === 1) groups.splice(5, 3, 0, 0, 0);
    if (shape === 2) groups.splice(0, 3, 0, 0, 0);
    if (shape === 3) { groups[0] = 0; groups[1] = 0; groups[4] = 0; groups[5] = 0; }
    if (shape === 4) groups[3] = 0; // A single zero hextet is not compressed by RFC 5952.
    if (shape === 5) groups[2] = 1 + rnd(15);
    const full = groups.map(g => g.toString(16).padStart(4, "0")).join(":"), canonical = compressIPv6(full)!;
    const compress = rnd(2) === 0, source = compress ? full : canonical;
    return finish({
      prompt: source,
      detail: compress ? "Write the canonical RFC 5952 form: lowercase, no leading zeros, longest zero run compressed, leftmost run when tied. Do not compress a single zero hextet." : "Fully expand to eight groups of exactly four hexadecimal digits. Either letter case is accepted; do not use ::.",
      fields: [{ key: "v6", label: compress ? "Canonical IPv6 address" : "Fully expanded IPv6 address", answer: compress ? canonical : full, format: compress ? "ipv6-canonical" : "ipv6-expanded", placeholder: compress ? "Canonical IPv6" : "8 groups × 4 hex digits" }],
      workedSteps: ipv6FormatWalkthrough(full, canonical, compress),
      context: { ip: source, ipv6Operation: compress ? "compress" : "expand" }, rule: "An equivalent address is not sufficient when the exercise asks for a particular written format.",
      help: "These are hexadecimal notation exercises; an example's address type is not a recommendation to assign it to an interface.",
    });
  }
  if (mode === "ipv6-subnet") {
    const prefix = pick(difficulty === "foundation" ? [48, 56, 60] : difficulty === "standard" ? [48, 52, 56, 60] : [49, 53, 57, 61, 62, 63]);
    const raw = ipv6Number(`2001:db8:${rnd(65536).toString(16)}:${rnd(65536).toString(16)}::`)!;
    const parent = network6(raw, prefix), count = 2 ** (64 - prefix), ordinal = 1 + rnd(count);
    const selected = parent + BigInt(ordinal - 1) * (1n << 64n);
    const belongs = rnd(2) === 0;
    const parentSize = 1n << BigInt(128 - prefix);
    // Keep even the deliberately nonmember example inside the documentation /32.
    const adjacentParent = parent + parentSize < ipv6Number("2001:db9::")! ? parent + parentSize : parent - parentSize;
    const candidate = (belongs ? parent + BigInt(rnd(count)) * (1n << 64n) : adjacentParent) + BigInt(1 + rnd(65535));
    const parentCidr = `${fmtIPv6(parent)}/${prefix}`;
    const fourth = Number((parent >> 64n) & 65535n), selectedFourth = Number((selected >> 64n) & 65535n);
    const parentGroups = expandIPv6(fmtIPv6(parent))!.split(":"), candidateGroups = expandIPv6(fmtIPv6(candidate))!.split(":");
    const candidateFourth = Number((candidate >> 64n) & 65535n), fourthMask = 65536 - count;
    const bits16 = (value: number): string => value.toString(2).padStart(16, "0");
    const first48Match = parentGroups.slice(0, 3).join(":") === candidateGroups.slice(0, 3).join(":");
    return finish({
      prompt: `Allocate /64 LAN prefixes from ${parentCidr}.`,
      detail: `Number the /64s from 1 in increasing order, starting at the parent prefix. Find /64 number ${ordinal}. Separately decide whether candidate ${fmtIPv6(candidate)} belongs anywhere inside the parent /${prefix}.`,
      fields: [numberField("count", "Number of /64 LAN prefixes", count, 65536, 1), { key: "selectedSubnet", label: `/64 number ${ordinal} — network/prefix`, answer: `${fmtIPv6(selected)}/64`, format: "cidr6", placeholder: "IPv6 network/64" }, yesField("member", "Candidate is inside the parent allocation?", belongs)],
      workedSteps: [`Start with parent ${parentCidr}. Its first three hextets, ${parentGroups.slice(0, 3).join(":")}, account for 3 × 16 = 48 fixed bits. The parent also fixes ${prefix} − 48 = ${prefix - 48} bits in the fourth hextet; the /64 boundary is at that hextet's end.`,
        `There are 64 − ${prefix} = ${64 - prefix} bits available to number /64 LANs, so the allocation contains 2^${64 - prefix} = ${count} /64 prefixes. All ${count} count; IPv6 has no broadcast address and no subnet-count minus-two rule.`,
        `The fourth hextet begins at 0x${fourth.toString(16)} (${fourth} decimal). Its ${count} consecutive values end at ${fourth} + ${count} − 1 = ${fourth + count - 1}, or 0x${(fourth + count - 1).toString(16)}. In binary, the first value is ${bits16(fourth)}; retain its first ${prefix - 48} bits while varying the remaining ${64 - prefix}.${prefix % 4 ? ` Because /${prefix} ends inside a four-bit hexadecimal digit, whole-digit comparison alone would be insufficient.` : ""}`,
        `/64 number ${ordinal} is ${ordinal} − 1 = ${ordinal - 1} positions after the first /64. Add that offset to the fourth hextet: ${fourth} + ${ordinal - 1} = ${selectedFourth} decimal, or 0x${fourth.toString(16)} + 0x${(ordinal - 1).toString(16)} = 0x${selectedFourth.toString(16)}. Keep the first three hextets and set the final four to zero: ${fmtIPv6(selected)}/64.`,
        `Now check candidate ${fmtIPv6(candidate)} against the entire parent, not just the numbered /64. Its first three hextets are ${candidateGroups.slice(0, 3).join(":")}; the parent's are ${parentGroups.slice(0, 3).join(":")}. These ${first48Match ? "match, so continue to the fixed bits in the fourth hextet" : "differ, which already proves the candidate is outside the parent; the fourth-hextet check cannot override that mismatch"}.`,
        `To retain only the ${prefix - 48} fixed bits in the fourth hextet, use mask 0x${fourthMask.toString(16).padStart(4, "0")} (${bits16(fourthMask)}). Candidate 0x${candidateFourth.toString(16)} gives ${bits16(candidateFourth)} AND ${bits16(fourthMask)} = ${bits16(candidateFourth & fourthMask)}, or 0x${(candidateFourth & fourthMask).toString(16)}. Compare that with parent 0x${fourth.toString(16)}, together with the first 48 bits.`,
        `Clearing all bits after /${prefix} gives candidate network ${fmtIPv6(network6(candidate, prefix))}/${prefix}. It ${belongs ? "matches" : "does not match"} ${parentCidr}, so membership is ${belongs ? "yes" : "no"}. Enter count ${count}, selected prefix ${fmtIPv6(selected)}/64, and ${belongs ? "yes" : "no"} for candidate membership.`],
      context: { parent: parentCidr, childPrefix: 64, ordinal, candidate: fmtIPv6(candidate) }, rule: "Count /64s with 2^(64 − parent prefix). Compare prefix bits for membership; IPv6 has no broadcast address.",
    });
  }
  throw new RangeError("Unknown subnetting drill mode.");
}

/* ---------- grading ---------- */
function inferredFormat(_mode: DrillMode, key: string, answer: string): FieldFormat {
  if (["yes", "no"].includes(answer.toLowerCase())) return "yes-no";
  if (["none", "n/a", "—"].includes(answer.toLowerCase())) return "no-broadcast";
  if (key === "prefix") return "prefix";
  if (key === "v6") return /^(?:[\da-f]{4}:){7}[\da-f]{4}$/i.test(answer) ? "ipv6-expanded" : "ipv6-canonical";
  if (answer.includes("/")) return answer.includes(":") ? "cidr6" : "cidr4";
  if (answer.includes(":")) return "ipv6";
  if (parseIPv4(answer) !== null) return "ipv4";
  return "integer";
}
function parseCidr4(value: string): { ip: number; prefix: number } | null {
  const match = value.trim().match(/^([^/\s]+)\s*\/\s*(\d{1,2})$/);
  if (!match) return null;
  const ip = parseIPv4(match[1]), prefix = Number(match[2]);
  return ip !== null && validPrefix(prefix) ? { ip, prefix } : null;
}
function parseCidr6(value: string): { ip: bigint; prefix: number } | null {
  const match = value.trim().match(/^([^/\s]+)\s*\/\s*(\d{1,3})$/);
  if (!match) return null;
  const ip = ipv6Number(match[1]), prefix = Number(match[2]);
  return ip !== null && validPrefix(prefix, 128) ? { ip, prefix } : null;
}
export function checkField(mode: DrillMode, key: string, given: string, answer: string, metadata?: DrillField | FieldFormat): boolean {
  const field: DrillField = typeof metadata === "string" ? { key, label: key, answer, format: metadata } : { key, label: key, answer, ...metadata };
  return gradeField(mode, field, given).correct;
}
function gradeField(mode: DrillMode, field: DrillField, given: string, context?: DrillContext): FieldGrade {
  const value = given.trim(), answer = field.answer.trim();
  const format = field.format ?? inferredFormat(mode, field.key, answer);
  const result = (correct: boolean, feedback: string): FieldGrade => ({ key: field.key, correct, feedback });
  const wrong = (feedback?: string): FieldGrade => result(false, feedback ?? field.feedback ?? `Review the calculation for ${field.label.toLowerCase()}; the expected value is ${answer}.`);
  if (!value) return wrong(`Enter ${field.label.toLowerCase()}. ${field.help ?? field.placeholder ?? "Use the requested format."}`);
  if (format === "yes-no") {
    if (!/^(yes|no)$/i.test(value)) return wrong("Enter the complete word yes or no; an unrelated word beginning with y or n is not an answer.");
    if (value.toLowerCase() === answer.toLowerCase()) return result(true, "Correct.");
    if (mode === "same" && context?.addresses && context.prefix !== undefined) return wrong(`Apply /${context.prefix} to both addresses. Their network identifiers are ${context.addresses.map(ip => subnetInfo(ip, context.prefix!).network).join(" and ")}; compare these complete identifiers, not just the final octets.`);
    if (mode === "ipv6-subnet" && context?.parent) return wrong(`Compare the candidate's prefix bits with the parent ${context.parent}. The question asks about the entire parent allocation, not only the numbered /64.`);
    if (mode === "troubleshoot") return wrong("Check each current field against the approved plan: usable host number, exact mask and first-usable gateway. Link-up status alone does not establish correct addressing.");
    if (mode === "summary") return wrong("Compare the total address count in the covering prefix with the combined count in the listed subnets. Any difference is extra space included by the summary.");
    return wrong();
  }
  if (format === "no-broadcast") {
    return /^(none|n\/?a|—)$/i.test(value) ? result(true, "Correct: this special prefix has no directed broadcast address.") : wrong("For this /31 point-to-point or /32 host prefix, enter none, n/a or —. Do not reserve an endpoint as a broadcast address.");
  }
  if (format === "integer" || format === "prefix") {
    const text = format === "prefix" ? value.replace(/^\//, "") : value;
    if (!/^\d+$/.test(text)) return wrong(format === "prefix" ? "Enter a whole prefix length, such as 26 or /26; do not enter a dotted mask here." : "Enter a nonnegative whole number in decimal digits, without units, fractions or scientific notation.");
    const number = Number(text), min = field.min ?? 0, max = field.max ?? (format === "prefix" ? 32 : Number.MAX_SAFE_INTEGER);
    if (!Number.isSafeInteger(number) || number < min || number > max) return wrong(`Enter a whole number from ${min} to ${max}.`);
    if (number === Number(answer.replace(/^\//, ""))) return result(true, "Correct.");
    if (format === "prefix" && field.requiredHosts) {
      if (number >= 31) return wrong("This is an ordinary LAN address budget. /31 point-to-point and /32 host-prefix exceptions do not apply.");
      const capacity = 2 ** (32 - number) - 2;
      return wrong(capacity < field.requiredHosts ? `/${number} provides ${capacity} usable addresses, fewer than the required ${field.requiredHosts}. Use a larger block (a shorter prefix).` : `/${number} fits, but is larger than necessary. Choose the longest prefix that still supplies ${field.requiredHosts} usable addresses.`);
    }
    if (field.key === "required" && context?.allocations) return wrong(`Add endpoints, gateway addresses and reserved usable addresses. The complete requirement is ${answer}; network and broadcast overhead is added when choosing a block, not counted as usable addresses.`);
    if (field.key === "hosts" && context?.prefix !== undefined) return wrong(context.prefix >= 31 ? `This explicitly described /${context.prefix} represents ${answer} address${answer === "1" ? "" : "es"}; the ordinary LAN minus-two rule does not apply.` : `A /${context.prefix} has ${32 - context.prefix} host bits. Calculate 2^${32 - context.prefix} − 2 for the ordinary usable count.`);
    if (mode === "subnets" && context?.parent) return wrong("Count borrowed bits relative to the parent prefix. Choose the smallest power of two that meets the requested subnet count; add those bits to the parent prefix.");
    if (mode === "ipv6-subnet" && context?.parent) return wrong(`Subtract the parent prefix length from 64, then raise 2 to that number of bits. Count /64 prefixes; do not subtract two for IPv6.`);
    return wrong();
  }
  if (format === "ipv4") {
    const actual = parseIPv4(value), expected = parseIPv4(answer);
    if (actual === null) return wrong("Use four decimal octets from 0 to 255, separated by dots. Do not add a prefix or explanatory text.");
    if (field.key === "mask" && prefixFromMask(value) === null) return wrong("A subnet mask must have contiguous one-bits followed by zero-bits; this dotted value is not a valid mask.");
    if (actual === expected) return result(true, "Correct.");
    if (mode === "troubleshoot" && context?.plan) {
      const plan = context.plan, s = subnetInfo(plan.network, plan.prefix);
      if (field.key === "host" && [s.network, s.broadcast].includes(fmtIPv4(actual))) return wrong("This is the network identifier or broadcast address. The workstation needs the specified ordinary usable host address.");
      if (field.key === "gateway" && (!sameSubnet(plan.network, value, plan.prefix) || [s.network, s.broadcast].includes(fmtIPv4(actual)))) return wrong(`The gateway must be an ordinary usable address inside ${plan.network}/${plan.prefix}. This plan assigns the first usable address, ${s.first}.`);
      if (field.key === "mask") return wrong(`This mask is valid but does not match the approved /${plan.prefix} plan. Use ${s.mask}; the host mask controls which destinations it treats as on-link.`);
    }
    if (field.key === "mask" && field.requiredHosts) {
      const prefix = prefixFromMask(value)!;
      if (prefix >= 31 || 2 ** (32 - prefix) - 2 < field.requiredHosts) return wrong(`This mask does not supply ${field.requiredHosts} ordinary usable LAN addresses. Recheck the full budget, including gateway and reserves.`);
      return wrong(`This is a valid mask but not the smallest block for the ${field.requiredHosts}-address budget. Expected ${answer}.`);
    }
    if (/network/i.test(field.key) && context?.prefix !== undefined) {
      const size = 2 ** (32 - context.prefix);
      if (actual % size !== 0) return wrong(`That is inside a /${context.prefix} block, not its network boundary. Clear the ${32 - context.prefix} host bits; expected ${answer}.`);
    }
    if (context?.ip && context.prefix !== undefined && parseIPv4(context.ip) !== null) {
      const s = subnetInfo(context.ip, context.prefix);
      if (context.prefix <= 30 && ["first", "last"].includes(field.key) && [s.network, s.broadcast].includes(fmtIPv4(actual))) return wrong("That address is reserved as the network identifier or broadcast address. Move one address inside the usable range.");
      if (field.key === "broadcast" && actual === parseIPv4(s.network)! + s.size) return wrong("That is the next subnet's network address. The current broadcast is one address earlier.");
    }
    return wrong(`The address is valid dotted decimal, but does not match this field. Expected ${answer}.`);
  }
  if (format === "cidr4") {
    const actual = parseCidr4(value), expected = parseCidr4(answer)!;
    if (!actual) return wrong("Enter an IPv4 network and whole prefix from 0 to 32, such as 10.20.0.0/26.");
    const size = 2 ** (32 - actual.prefix);
    if (actual.ip % size !== 0) return wrong(`${fmtIPv4(actual.ip)} is not aligned to /${actual.prefix}. Its network is ${subnetInfo(fmtIPv4(actual.ip), actual.prefix).network}/${actual.prefix}; enter a network boundary.`);
    if (actual.ip === expected.ip && actual.prefix === expected.prefix) return result(true, "Correct.");
    if (field.requiredHosts && (actual.prefix >= 31 || size - 2 < field.requiredHosts)) return wrong(`This ordinary LAN needs ${field.requiredHosts} usable addresses. /${actual.prefix} is too small or uses a special-purpose prefix.`);
    if (context?.parent) {
      const parent = parseCidr4(context.parent);
      if (parent && (actual.ip < parent.ip || actual.ip + size > parent.ip + 2 ** (32 - parent.prefix))) return wrong(`This block extends outside the supplied parent ${context.parent}. Keep the entire child block inside that allocation.`);
    }
    return wrong(mode === "vlsm" ? `This is an aligned block, but it does not follow the stated smallest-block, largest-first allocation policy for this LAN. Expected ${answer}.` : `This is an aligned prefix, but not the requested ${field.label.toLowerCase()}. Expected ${answer}.`);
  }
  if (format === "cidr6") {
    const actual = parseCidr6(value), expected = parseCidr6(answer)!;
    if (!actual) return wrong("Enter a valid hexadecimal IPv6 network followed by its whole prefix, such as 2001:db8:1::/64.");
    if (network6(actual.ip, actual.prefix) !== actual.ip) return wrong("This address has nonzero bits after the prefix boundary. Enter the subnet's network prefix with those bits cleared.");
    if (actual.ip === expected.ip && actual.prefix === expected.prefix) return result(true, "Correct; equivalent IPv6 spellings are accepted for allocation questions.");
    return wrong(actual.prefix !== expected.prefix ? `This exercise asks for /${expected.prefix} LAN prefixes. Keep that length and calculate the requested subnet's address.` : `The /${actual.prefix} is aligned but is not the requested numbered subnet. Count from subnet 1 at the parent base; expected ${answer}.`);
  }
  const expanded = expandIPv6(value), target = expandIPv6(answer);
  if (!expanded) return wrong("Enter a hexadecimal IPv6 address: eight hextets, or one :: replacing omitted zero hextets. Do not add a prefix or zone ID here.");
  if (expanded !== target) return wrong("This is valid IPv6 text but represents a different 128-bit address. Recount the omitted hextets and preserve every nonzero digit.");
  if (format === "ipv6-expanded" && !/^(?:[\da-f]{4}:){7}[\da-f]{4}$/i.test(value)) return wrong("The address value is right, but expansion requires eight groups of exactly four hexadecimal digits, with no ::.");
  if (format === "ipv6-canonical" && value !== compressIPv6(value)) return wrong("The address value is right, but its format is not canonical: use lowercase, remove leading zeros and compress only the longest zero run of at least two hextets (leftmost if tied).");
  return result(true, "Correct.");
}
export function gradeDrill(drill: SubnetDrill, values: Record<string, string>): DrillGrade {
  const fields = drill.fields.map(field => gradeField(drill.mode, field, values[field.key] ?? "", drill.context));
  if (drill.mode === "vlsm") {
    const submitted = drill.fields.map(field => ({ field, cidr: parseCidr4(values[field.key] ?? "") }));
    for (let i = 0; i < submitted.length; i++) {
      if (fields[i].correct || !submitted[i].cidr) continue;
      const a = submitted[i].cidr!;
      if (a.ip % 2 ** (32 - a.prefix) !== 0) continue;
      const overlap = submitted.find((b, j) => j !== i && b.cidr && b.cidr.ip % 2 ** (32 - b.cidr.prefix) === 0 && a.ip < b.cidr.ip + 2 ** (32 - b.cidr.prefix) && b.cidr.ip < a.ip + 2 ** (32 - a.prefix));
      if (overlap) fields[i].feedback += ` It also overlaps your entry for ${overlap.field.label}.`;
    }
  }
  return { fields, allCorrect: fields.length > 0 && fields.every(field => field.correct) };
}
