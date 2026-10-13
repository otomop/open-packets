import type { DrillMode } from "@/lib/subnet-drills";

export interface SubnetGuide {
  id: DrillMode;
  title: string;
  description: string;
  chapterId: string;
  sectionId: string;
  pitfall: string;
  scope: string;
}

/** Ordered from individual IPv4 calculations to planning, policy and IPv6. */
export const SUBNET_MODES: SubnetGuide[] = [
  {
    id: "network",
    title: "Network & broadcast",
    description: "Find the complete address range, usable hosts and capacity.",
    chapterId: "ipv4-addressing",
    sectionId: "network-broadcast-and-usable-hosts",
    pitfall: "A .0 or .255 ending alone does not identify a network or broadcast address. A supported /31 point-to-point link uses both addresses; /32 identifies one address.",
    scope: "Core IPv4 address arithmetic for v1.1 objective 1.6 and v2.0 objective 1.3. Configuration and operational verification remain in the lesson and lab.",
  },
  {
    id: "hosts",
    title: "Size a LAN",
    description: "Choose the smallest subnet that meets the full address requirement.",
    chapterId: "subnetting-vlsm",
    sectionId: "the-block-size-method-in-any-octet",
    pitfall: "A longer prefix makes the subnet smaller. Do not add another gateway address when the prompt already includes it, or use the /31 point-to-point exception for a user LAN.",
    scope: "Capacity planning supports the IPv4 subnetting work in v1.1 1.6 and v2.0 1.3.",
  },
  {
    id: "subnets",
    title: "Equal-size subnets",
    description: "Split a parent block and count the resulting child networks.",
    chapterId: "subnetting-vlsm",
    sectionId: "why-one-mask-never-fits-everyone",
    pitfall: "Do not subtract two from the subnet count. Subnet counts and ordinary-LAN usable-host counts answer different questions.",
    scope: "Fixed-length planning supports v1.1 1.6 and v2.0 1.3. The supplied parent prefix, not a historical address class, sets the calculation.",
  },
  {
    id: "same",
    title: "Same subnet?",
    description: "Compare network membership using the stated masks.",
    chapterId: "ipv4-addressing",
    sectionId: "why-the-mask-decides-everything",
    pitfall: "Matching the first three octets is not a general test. If masks differ, assess each host's view separately; one may consider the other local while the reverse is remote.",
    scope: "Supports IPv4 verification in v1.1 1.6 and addressing troubleshooting in v2.0 1.3. This mode assesses membership, not end-to-end connectivity.",
  },
  {
    id: "troubleshoot",
    title: "Repair an address plan",
    description: "Find invalid host, mask or gateway choices from the supplied requirements.",
    chapterId: "ipv4-addressing",
    sectionId: "verify-and-troubleshoot",
    pitfall: "Do not choose an arbitrary usable address as the gateway; it must be assigned to the intended router. A working ping alone does not certify a correct mask.",
    scope: "Address-plan diagnosis supports v1.1 1.6/1.10 and v2.0 1.3/1.6. These exercises do not replace client or device troubleshooting labs.",
  },
  {
    id: "vlsm",
    title: "VLSM allocation",
    description: "Fit different LAN sizes into one parent without overlaps.",
    chapterId: "subnetting-vlsm",
    sectionId: "vlsm-allocate-largest-first",
    pitfall: "Enter network/prefix, not an arbitrary host/prefix. Follow the exercise's allocation rule; a different plan can be technically valid but answer a different question.",
    scope: "VLSM is applied IPv4 subnetting for v1.1 1.6 and v2.0 1.3. Reserved or fragmented production address space needs additional planning.",
  },
  {
    id: "summary",
    title: "Summarize prefixes",
    description: "Find one containing prefix and check what else it includes.",
    chapterId: "subnetting-vlsm",
    sectionId: "summarisation-keep-the-shared-bits",
    pitfall: "Four consecutive /24s do not automatically form one exact /22. A boundary crossing can require a broader prefix that attracts traffic for additional destinations.",
    scope: "Supporting address-boundary and routing-table interpretation practice. This is not an added BGP, OSPF summarization or other routing-protocol configuration objective.",
  },
  {
    id: "wildcard",
    title: "ACL wildcard masks",
    description: "Translate a subnet prefix into the bits an ACL must compare.",
    chapterId: "acls",
    sectionId: "wildcard-masks",
    pitfall: "Do not put the subnet mask in the wildcard field. ACL wildcards can be noncontiguous; subtracting a subnet mask produces only the contiguous-subnet case practiced here.",
    scope: "Supporting address matching for ACL objectives v1.1 5.6 and v2.0 4.6. Policy, rule order, direction and return traffic are taught in Chapter 34.",
  },
  {
    id: "ipv6",
    title: "IPv6 notation",
    description: "Write a requested expanded or canonical representation without changing its bits.",
    chapterId: "ipv6-addressing",
    sectionId: "writing-an-address-without-making-a-mistake",
    pitfall: "A spelling can be valid IPv6 without being canonical. :: may appear only once, and canonical text does not use it for a single zero group.",
    scope: "Notation supports IPv6 addressing objectives v1.1 1.8 and v2.0 1.4. Canonical formatting follows RFC 5952; it is not the only valid IPv6 spelling.",
  },
  {
    id: "ipv6-subnet",
    title: "IPv6 prefixes",
    description: "Find prefix boundaries and divide an allocation into smaller networks.",
    chapterId: "ipv6-addressing",
    sectionId: "prefixes-and-how-big-a-subnet-is",
    pitfall: "Do not round a prefix down to the nearest whole group or hexadecimal digit. IPv6 has no broadcast subtraction, but not every bit combination is an ordinary assignable host address.",
    scope: "Prefix work supports v1.1 1.8 and v2.0 1.4. Ordinary Ethernet SLAAC uses /64; larger allocations and other link types can use different prefix lengths.",
  },
];

export const guideByMode = Object.fromEntries(
  SUBNET_MODES.map((guide) => [guide.id, guide]),
) as Record<DrillMode, SubnetGuide>;
