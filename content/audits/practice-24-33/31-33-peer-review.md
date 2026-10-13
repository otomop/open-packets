# Independent peer review: practice chapters 31–33

Reviewed 24 September 2026 by the services/security reviewer, independently of the author.

## Scope and result

Read the complete lab, every question and every option, correct answer, explanation and wrong-answer explanation, every flashcard, every command drill and every ticket with its diagnosis and repair for chapters 31–33. Used the lesson context, prerequisite progression and objective verbs to judge scope and demand. Final changed portions were reread after the author corrected the findings below. No remaining actionable technical, answer-key, setup or recovery issue was found.

| Chapter | Questions | Difficulty 1 / 2 / 3 | Cards | Drills | Tickets | Numbered lab steps |
|---|---:|---:|---:|---:|---:|---:|
| 31 Troubleshooting toolkit | 24 | 4 / 16 / 4 | 14 | 8 | 3 | 12 |
| 32 Security concepts | 18 | 10 / 7 / 1 | 19 | 1 | 2 | 3 required + 6 optional |
| 33 AAA with TACACS+ and RADIUS | 24 | 9 / 14 / 1 | 19 | 11 | 2 | 12 |

Difficulty describes the reasoning actually requested, not empirical exam difficulty. Counts were loaded from the final JSON banks; the review did not impose a uniform target.

## Findings corrected and reread

1. **All three labs: evidence-checklist placement.** The original `## Evidence to keep` heading was outside the loader's recognized lab sections. Changed to `### Evidence to keep` within the final numbered step, so it remains attached to the exercise rather than being collected into the introduction.
2. **Chapter 31 independent challenge: missing service prerequisites.** The supplied incident initially specified addresses, routes and ICMP observations but asked for a DNS/application retest without defining the service. It now explicitly supplies SRV HTTP and DNS, the `app.lab.example` A record, both clients' resolver addresses and the original named-page complaint. The independent variation therefore contains the information needed for its prescribed retests.
3. **Chapter 32 optional save step: interactive prompts.** Step 9 now explicitly finishes each startup-configuration destination prompt before moving to the other device. This avoids treating an interactive copy operation as a finished batch.
4. **Ticket titles that announced the diagnosis.** Neutral titles were saved and reread for 31 t03, 32 t01/t02 and 33 t01/t02. The exhibits and diagnostic alternatives now carry the reasoning task.
5. **Chapter 33 demand labels.** q14 recognizes the EXEC start/stop accounting command and is level 1. q21 directly compares the supplied observed NAS source with the registered source; q22 applies the explicitly stated fresh-session and accounting acceptance checks. Those are level 2. Their existing IDs and answer meanings remain unchanged; the final bank is ordered by demand.
6. **Chapter 33 configuration-source links.** The two old TACACS+/RADIUS configuration URLs redirected to Cisco's generic support index. The author replaced them with working Cisco IOS XE guides, preserving the distinction between named server-object reference syntax and the separately qualified Packet Tracer path.

## Technical and pedagogical review

### Chapter 31

The cold setup supplies both LANs, the transit /30, interfaces, access VLANs, server services, client settings and both static routes. The return-route, far-interface shutdown, client-VLAN and DNS faults have separate observation and restoration stages. Source-address comparisons do not overclaim that a successful router ping certifies the original client's service. The optional DHCP exercise provides a pool and relay context and distinguishes a server-side Offer observation from successful client delivery.

The questions distinguish positive evidence from absence of evidence: a traceroute timeout, TCP analysis label, historical counter total or unmatched capture does not independently prove a cause. CRC and output-drop cases use changes over an interval. HTTP 503, TCP reset, ICMP prohibition and fragmentation-needed cases identify the demonstrated stage without claiming a universal cause or fix. All paired tests identify the relevant source or capture scope.

The independent challenge correctly uses an obsolete `10.31.10.50/32` Null0 route over a working `10.31.10.0/24` return route. PC-B `.60` and R1 `.1` still use the /24. Its narrow repair removes only the confirmed obsolete host route, then repeats both the affected named service and unaffected controls. The answer is inside a closed solution container. Tickets preserve clear evidence, a narrow repair and a post-repair client test.

### Chapter 32

The required worksheet covers exposure, policy, authentication factors and program actions before the optional device exercise. Learners do not have to perform a large configuration task to demonstrate a descriptive security objective. NIST-specific password and biometric requirements are explicitly attributed rather than presented as universal IOS behavior.

The optional exercise supplies a fresh management LAN, a working console, SSH preparation, fresh-session verification and a bounded login-block experiment. It separates the induced quiet period from recovery. The console remains the recovery path; an old session is not treated as a new authentication test. Paper observations and unsupported simulator features are identified honestly.

The bank distinguishes a vulnerability, attack evidence and attribution; it does not infer who used a broadly exposed credential merely from the exposure. The independent challenge connects social engineering, a departed user's account and recovery-media handling to observable actions and retests. Its answer remains closed until requested.

### Chapter 33

The management topology, server identity, local recovery account, central-only account, shared key, authentication ports and actual VTY ranges are specified. The lab saves a tested local baseline and uses separate TACACS+ and RADIUS working copies. Authentication PASS, explicit FAIL and unavailable-method ERROR are tested with new sessions; rejection does not fall through merely because a local account exists. An Access-Challenge is an ongoing exchange on a supporting client, not automatic failure or permission.

The named server-object exercise shows configuration modes and the chain from server object through group, method list and line binding. Local login recovery is not confused with EXEC authorization or accounting. The material explicitly identifies which features were and were not exercised.

The independent challenge separates three supplied problems: a VTY bound to the wrong method list, registration that does not recognize the actual loopback NAS source, and the server's missing return route. The server's gateway through R3 can reach R3's own loopback. Its solution preserves the local console and verifies central success, explicit rejection and service-unavailable fallback separately.

## Primary-source checks

The following sources were opened during this peer review on 24 September 2026. These are targeted checks of relevant claims, not a claim that every device release or simulator implementation was exercised.

| Claim checked | Primary evidence |
|---|---|
| Descriptive security/AAA scope in v1.1 and management-client configuration scope in v2.0 | [Cisco CCNA v1.1 topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf); [Cisco CCNA v2.0 topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf) |
| Router-selected versus explicit ping source, extended datagram/DF controls and conventional IOS UDP traceroute | [Cisco extended ping and traceroute](https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13730-ext-ping-trace.html) |
| Conventional Windows traceroute probes | [Microsoft tracert](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/tracert) |
| Password-only length, composition and periodic-change rules; biometric use with a physical authenticator and a non-biometric alternative | [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html), sections 3.1.1 and 3.2.3 |
| Login-block quiet mode and console recovery | [Cisco IOS Login Enhancements](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/sec_usr_cfg/configuration/15-mt/sec-usr-cfg-15-mt-book/sec-login-enhance.html) |
| Authentication FAIL stops; ERROR permits trying the next configured method; named-list selection | [Cisco Configuring Authentication](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/sec_usr_aaa/configuration/15-mt/sec-usr-aaa-15-mt-book/configuring_authentication.html) |
| Named TACACS+ server/group syntax and configuration modes | [Cisco IOS XE TACACS+ guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9600/software/release/17-18/configuration_guide/sec/b_1718_sec_9600_cg/configuring_tacacs_.html); [Cisco IOS XE 16.11 named-server example](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9200/software/release/16-11/configuration_guide/sec/b_1611_sec_9200_cg/configuring_tacacs_.html) |
| Named RADIUS server/group syntax, ports and source-interface dependency | [Cisco IOS XE RADIUS guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/sec/b_1718_sec_9300_cg/configuring_radius.html) |
| Classic TACACS+ obfuscation and the need to protect its transport path | [RFC 8907](https://www.rfc-editor.org/rfc/rfc8907.html), sections 4.5 and 10 |
| RADIUS conventional/legacy authentication port, Access-Challenge continuation and response validation | [RFC 2865](https://www.rfc-editor.org/rfc/rfc2865.html), sections 3 and 4.4 |

## Final consistency checks

A read-only Node check passed for all three final banks: nondecreasing difficulty order, feedback for every wrong option, evidence checklists under the recognized final step, and solution containers in every independent challenge. These checks supplement the full semantic read; they do not establish device execution.

## Verification limits

This is a full content and configuration-reasoning peer review, not an executed Packet Tracer, CML, hardware or AAA-server test. Representative output and paper incidents were assessed as authored evidence. Release-specific capability caveats and supplied fallback worksheets remain necessary. Root owns independent numerical checks, actual application rendering and final integration; the chapter author owns the exact item-decision ledger and restricted content verification. No application, styling or chapter content was edited by this reviewer during the peer pass.
