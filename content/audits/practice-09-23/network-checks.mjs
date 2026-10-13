// Independent arithmetic/selection checks for named teaching examples.
// This is not device simulation or a claim to verify every prose statement.
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {loadCourse} from '../../../scripts/load-course.mjs';
const {chapters} = await loadCourse(fileURLToPath(new URL('../../', import.meta.url)));
const chapter = n => chapters.find(c => c.number === n);
const question = (n, suffix) => {
  const q = chapter(n).questions.find(q => q.id.endsWith(suffix));
  assert.ok(q, `${n}${suffix}: example removed; review check applicability`);
  return q;
};
const selected = (n, suffix) => {const q = question(n, suffix); return q.answer.map(i => q.options[i]);};
const labText = n => JSON.stringify(chapter(n).lab);
let checks = 0;
function eq(actual, expected, label) {assert.deepEqual(actual, expected, label); checks++;}
function includes(actual, value, label) {assert.ok(actual.includes(value), label); checks++;}
const ip4 = s => s.split('.').reduce((v, part) => v * 256n + BigInt(part), 0n);
function ip6(s) {
  const halves = s.toLowerCase().split('::');
  assert.ok(halves.length <= 2, 'multiple IPv6 compressions');
  const left = halves[0] ? halves[0].split(':') : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const groups = halves.length === 1 ? left : [...left, ...Array(8-left.length-right.length).fill('0'), ...right];
  assert.equal(groups.length, 8);
  assert.ok(groups.every(h => /^[0-9a-f]{1,4}$/.test(h)));
  return groups.reduce((v, h) => (v << 16n) + BigInt('0x'+h), 0n);
}
function canonical(v) {
  const groups = Array.from({length:8}, (_, i) => ((v >> BigInt(16*(7-i))) & 65535n).toString(16));
  let best = -1, length = 1;
  for(let i=0;i<8;i++) if(groups[i] === '0') {
    let j=i; while(j<8 && groups[j] === '0') j++;
    if(j-i>length) {best=i; length=j-i;} i=j-1;
  }
  if(best < 0) return groups.join(':');
  return groups.slice(0,best).join(':')+'::'+groups.slice(best+length).join(':');
}
function prefix(cidr, version=4) {
  const [address, b] = cidr.split('/'), bits = Number(b), width = version === 4 ? 32 : 128;
  const size = 1n << BigInt(width-bits), value = version === 4 ? ip4(address) : ip6(address);
  const first = value / size * size;
  return {bits, first, last:first+size-1n, size};
}
function lookup(address, rows, version=4) {
  const value = version===4 ? ip4(address) : ip6(address);
  const matches = rows.map(([cidr, action]) => ({...prefix(cidr,version), action})).filter(r=>value>=r.first&&value<=r.last);
  return matches.sort((a,b)=>b.bits-a.bits)[0]?.action ?? 'discard: no match';
}
function eui64(mac) {
  const bytes=mac.split(':').map(h=>parseInt(h,16));
  bytes[0]^=2;
  return [...bytes.slice(0,3),255,254,...bytes.slice(3)].reduce((v,b)=>(v<<8n)+BigInt(b),0n);
}

// Route lookup uses installed prefixes only. AD is deliberately absent here.
eq(selected(17,'-q01')[0].match(/\d+\.\d+\.\d+\.\d+/)?.[0], lookup('10.20.30.150',[
  ['10.20.30.0/24','10.0.12.2'],['10.20.30.128/25','10.0.13.2'],['10.20.0.0/16','10.0.14.2'],
]),'17 q01: longer installed match');
const overlapRows=[['172.16.32.0/19','10.0.0.2'],['172.16.40.0/21','10.0.0.3'],['172.16.44.0/23','10.0.0.4'],['172.16.44.128/25','10.0.0.5']];
eq(selected(17,'-q07')[0].match(/\d+\.\d+\.\d+\.\d+/)?.[0],lookup('172.16.44.9',overlapRows),'17 q07: exclude nonmatching /25');
eq(['172.16.44.9','172.16.44.200','172.16.45.200','172.16.60.7'].map(a=>lookup(a,overlapRows)),['10.0.0.4','10.0.0.5','10.0.0.4','10.0.0.2'],'17 lab worksheet: four distinct lookup boundaries');
includes(labText(17),'172.16.44.200','17 worksheet input retained');
eq(selected(17,'-q14')[0].match(/\d+\.\d+\.\d+\.\d+/)?.[0],lookup('10.20.31.7',[
  ['10.20.0.0/16','10.0.12.2'],['10.20.30.0/24','10.0.13.2'],['0.0.0.0/0','203.0.113.1'],
]),'17 q14: covering route before default');
eq(['198.51.100.200','198.51.100.1'].map(a=>lookup(a,[['198.51.100.0/24','R2'],['198.51.100.128/25','Null0']])),['Null0','R2'],'17 lab: fault isolates upper half');
eq(selected(18,'-q11')[0].match(/\d+\.\d+\.\d+\.\d+/)?.[0],lookup('10.1.0.77',[['10.1.0.0/16','10.0.12.2'],['10.1.0.0/24','10.0.13.2']]),'18 q11: /24 wins over /16 regardless of differing AD');

// IPv6 values are independently computed as 128-bit integers.
eq(selected(19,'-q01'),[canonical(ip6('2001:0db8:0000:0000:0000:0a00:0000:0001'))],'19 q01: canonical zero compression');
eq(selected(19,'-q03'),[canonical(ip6('2001:db8:10:1::')+eui64('00:1a:2b:3c:4d:5e'))],'19 q03: EUI-64 byte placement and bit inversion');
const p56=prefix('2001:db8:5c00::/56',6);
eq(selected(19,'-q08'),[`${p56.size/(1n<<64n)}; ${canonical(p56.last/(1n<<64n)*(1n<<64n))}/64`],'19 q08: child count and final /64');
eq(selected(19,'-q15'),[canonical(prefix('2001:db8:5:c7f2::1/60',6).first)+'/60'],'19 q15: partial-hextet boundary');
includes(selected(20,'-q06')[0],lookup('2001:db8:20::12',[
  ['::/0','Gi0/0'],['2001:db8:20::/64','Gi0/1'],['2001:db8:20::12/128','Gi0/2'],
],6),'20 q06: IPv6 host exception');

// Directed local-port costs model the STP lab's stated stable topology.
// Bridge priorities are unique, so MAC/port-ID ties do not enter these cases.
const links=[['SW1','Fa0/24','SW2','Fa0/24',19,19],['SW1','Gi0/1','SW3','Gi0/1',4,4],['SW2','Gi0/1','SW3','Gi0/2',4,4]];
const priorities={SW1:32768,SW2:24576,SW3:28672};
function tree(edges, bids=priorities) {
  const names=Object.keys(bids), root=names.toSorted((a,b)=>bids[a]-bids[b])[0];
  const distance=Object.fromEntries(names.map(n=>[n,n===root?0:Infinity]));
  for(let pass=0;pass<names.length;pass++) for(const [a,,b,,ca,cb] of edges) {
    distance[a]=Math.min(distance[a],ca+distance[b]);
    distance[b]=Math.min(distance[b],cb+distance[a]);
  }
  const ports={};
  for(const n of names) {
    const choices=edges.flatMap(([a,pa,b,pb,ca,cb])=>a===n?[{port:pa,neighbor:b,cost:ca+distance[b]}]:b===n?[{port:pb,neighbor:a,cost:cb+distance[a]}]:[]);
    if(n!==root) ports[n]=choices.toSorted((a,b)=>a.cost-b.cost||bids[a.neighbor]-bids[b.neighbor])[0].port;
  }
  const roles={};
  for(const [a,pa,b,pb] of edges) {
    const designated=distance[a]<distance[b]||distance[a]===distance[b]&&bids[a]<bids[b]?a:b;
    roles[a+':'+pa]=ports[a]===pa?'root':designated===a?'designated':'alternate';
    roles[b+':'+pb]=ports[b]===pb?'root':designated===b?'designated':'alternate';
  }
  return {root,distance,ports,roles};
}
const base=tree(links);
eq(base.distance,{SW1:8,SW2:0,SW3:4},'14 lab: baseline root costs');
eq(base.ports,{SW1:'Gi0/1',SW3:'Gi0/2'},'14 lab: baseline root ports');
eq(base.roles['SW1:Fa0/24'],'alternate','14 lab: baseline alternate');
const changed=tree(links.map((l,i)=>i===0?[...l.slice(0,4),2,19]:l));
eq(changed.distance,{SW1:2,SW2:0,SW3:4},'14 lab: changed local cost');
eq([changed.roles['SW1:Gi0/1'],changed.roles['SW3:Gi0/1']],['designated','alternate'],'14 lab: designated end changes');
const failure=tree(links.slice(0,2));
eq(failure.distance,{SW1:19,SW2:0,SW3:23},'14 lab: failed SW3 root link');
eq(failure.ports,{SW1:'Fa0/24',SW3:'Gi0/1'},'14 lab: failed-link root ports');
const newRoot=tree(links,{...priorities,SW1:4096});
eq(newRoot.distance,{SW1:0,SW2:8,SW3:4},'14 lab: priority change root costs');
eq(newRoot.roles['SW2:Fa0/24'],'alternate','14 lab: priority change alternate');
includes(labText(14),'cost 19','14 explicit baseline costs retained');
const secondVlan=tree(links.map((l,i)=>i===0?[...l.slice(0,4),6,6]:l),{SW1:8192,SW2:16384,SW3:24576});
eq(secondVlan.distance,{SW1:0,SW2:6,SW3:4},'14 new lab challenge: independent VLAN 20 costs');
eq(secondVlan.ports,{SW2:'Fa0/24',SW3:'Gi0/1'},'14 new lab challenge: independent VLAN 20 root ports');
eq([secondVlan.roles['SW2:Gi0/1'],secondVlan.roles['SW3:Gi0/2']],['alternate','designated'],'14 new lab challenge: opposite ends and VLAN-specific roles');
includes(chapter(14).lab.challenge,'SW2 uses Fa0/24 at cost 6','14 challenge solution matches independent model');
const triangle=[['A','A-B','B','B-A',4,4],['B','B-C','C','C-B',4,4],['A','A-C','C','C-A',19,19]];
const triangleBids={A:24576,B:28672,C:32768};
const triangleBase=tree(triangle,triangleBids);
eq(triangleBase.distance,{A:0,B:4,C:8},'14 q21: whole-topology path costs');
eq(triangleBase.roles['C:C-A'],'alternate','14 q21: non-root end discards');
includes(selected(14,'-q21')[0],'C uses C-B at cost 8','14 q21 key agrees with path model');
const triangleRoot=tree(triangle,{...triangleBids,B:4096});
eq(triangleRoot.distance,{A:4,B:0,C:4},'14 q22: changed root equal paths');
eq([triangleRoot.roles['A:A-C'],triangleRoot.roles['C:C-A']],['designated','alternate'],'14 q22: BID breaks designated tie');
includes(selected(14,'-q22')[0],'A is designated','14 q22 key agrees with tie resolution');
const triangleCost=tree(triangle.map((l,i)=>i===2?[...l.slice(0,5),2]:l),triangleBids);
eq(triangleCost.distance,{A:0,B:4,C:2},'14 q23: one-sided receiving-cost change');
eq([triangleCost.roles['B:B-C'],triangleCost.roles['C:C-B']],['alternate','designated'],'14 q23: altered designated comparison');
eq(selected(14,'-q23').some(s=>s.includes('C-A')&&s.includes('cost 2'))&&selected(14,'-q23').some(s=>s.includes('B becomes alternate')),true,'14 q23 selected pair matches independent roles');

// Fresh OSPF elections exclude priority zero, then compare priority and RID.
function election(candidates) {return candidates.filter(c=>c.priority>0).toSorted((a,b)=>b.priority-a.priority||Number(ip4(b.rid)-ip4(a.rid))).map(c=>c.name);}
eq(election([{name:'RA',priority:1,rid:'4.4.4.4'},{name:'RB',priority:0,rid:'9.9.9.9'},{name:'RC',priority:1,rid:'3.3.3.3'},{name:'RD',priority:50,rid:'1.1.1.1'}]).slice(0,2),['RD','RA'],'21 q04: fresh DR/BDR selection');
includes(selected(21,'-q04')[0],'RD is DR; RA is BDR','21 q04 key matches computed election');
eq(Number(selected(21,'-q05')[0]),10+20+1,'21 q05: outgoing directional path sum');
eq([100,1000,10000].map(speed=>Math.max(1,Math.floor(10000/speed))),[100,10,1],'21 q15: stated reference-bandwidth costs');
includes(selected(21,'-q15')[0],'10000','21 q15: command matches required reference bandwidth');
eq(election([{name:'1.1.1.1',priority:1,rid:'1.1.1.1'},{name:'2.2.2.2',priority:0,rid:'2.2.2.2'},{name:'3.3.3.3',priority:1,rid:'3.3.3.3'},{name:'4.4.4.4',priority:1,rid:'4.4.4.4'}]).slice(0,2),['4.4.4.4','3.3.3.3'],'22 q14: fresh IPv6 OSPF election');
includes(selected(22,'-q14')[0],'4.4.4.4','22 q14: DR answer');
includes(selected(22,'-q14')[0],'3.3.3.3','22 q14: BDR answer');
includes(selected(22,'-q17')[0],`[110/${Math.min(10+1,25+1)}]`,'22 q17: lower directional path');
includes(selected(23,'-q06')[0],String(110-5),'23 q06: tracked priority remains above peer');

// Added questions: non-nibble IPv6 boundaries, exact wildcard selection,
// independently directed path costs, and effective first-hop priority.
eq(selected(19,'-q18'),[canonical(ip6('2001:0db8:0000:0000:0001:0000:0000:000a'))],'19 q18: leftmost equal-length zero run');
const site56=prefix('2001:db8:1200:3400::/56',6);
eq(question(19,'-q19').options.filter(cidr=>{
  const child=prefix(cidr,6); return child.first<site56.first||child.last>site56.last;
}),selected(19,'-q19'),'19 q19: exactly one proposed child lies outside allocation');
eq(selected(19,'-q20'),[canonical(prefix('2001:db8:7:ab3d::25/61',6).first)+'/61'],'19 q20: /61 masks three low bits of fourth group');
eq(ip6('::'+selected(19,'-q21')[0]),eui64('02:aa:bb:cc:dd:ee'),'19 q21: initially set universal/local bit is inverted');
eq(selected(19,'-q22'),[canonical(ip6('ff02::1:ff00:0')+(ip6('2001:db8:4::ab12:3456')&0xffffffn))],'19 q22: solicited-node uses final 24 address bits');
const adequate=[61,64,60,59].filter(bits=>2**(64-bits)>=20).sort((a,b)=>b-a)[0];
includes(selected(19,'-q29')[0],'/'+adequate+',','19 q29: smallest listed allocation for twenty /64 LANs');
includes(selected(20,'-q17')[0],lookup('2001:db8:44:ab3d::8',[
  ['2001:db8:44:ab30::/60','FE80::2'],['2001:db8:44:ab38::/61','FE80::3'],['2001:db8:44:ab30::/61','FE80::4'],['::/0','FE80::5'],
],6),'20 q17: /61 matching interval excludes adjacent /61');
eq(lookup('2001:db8:18::25',[['2001:db8:18::/64','/64'],['2001:db8:18::25/128','/128']],6),'/128','20 q18: installed host exception wins');
includes(selected(20,'-q18')[0],'/128','20 q18: key identifies host exception');
eq(lookup('2001:db8:24::44',[['2001:db8:24::/64','/64'],['::/0','/0']],6),'/64','20 q24: covering route after exact host removal');
includes(selected(20,'-q24')[0],'/64','20 q24: key identifies remaining covering route');
const wildcardMatches=(address,base,wildcard)=>(ip4(address)&(0xffffffffn^ip4(wildcard)))===(ip4(base)&(0xffffffffn^ip4(wildcard)));
const selectors=question(21,'-q08').options.filter(command=>{
  const [,base,wildcard]=command.split(' ');
  const addressBits=ip4(wildcard).toString(2).replaceAll('0','').length;
  return 2**addressBits===1&&wildcardMatches('172.16.5.33',base,wildcard);
});
eq(selectors,selected(21,'-q08'),'21 q08: keyed selector matches exactly one address, the intended interface');
const ipv4String=v=>[24n,16n,8n,0n].map(shift=>Number((v>>shift)&255n)).join('.');
eq(selected(21,'-q20'),[ipv4String(prefix('192.168.21.33/27').first)+'/27'],'21 q20: actual interface mask determines advertised Ethernet prefix');
eq(Number(selected(21,'-q21')[0]),7,'21 q21: explicit cost takes precedence over automatic value ten');
eq([Math.min(5+1,20+1),Math.min(30+1,10+1)],[6,11],'21 q23: independently directed lowest paths');
includes(selected(21,'-q23')[0],'cost 6','21 q23: forward metric');
includes(selected(21,'-q23')[0],'cost 11','21 q23: return metric');
eq([5+10+1,15+1],[16,16],'21 q24: independent equal-cost paths');
includes(selected(21,'-q24')[0],'16','21 q24: keyed ECMP metric');
eq(wildcardMatches('192.168.31.65','192.168.31.32','0.0.0.31'),false,'21 q31: mistaken selector excludes intended interface');
includes(selected(21,'-q31')[0],'192.168.31.65','21 q31: correction includes actual interface address');
eq([Math.min(10+7,30+7),Math.min(20+1,5+1)],[17,6],'22 q24: IPv6 OSPF directional path metrics');
includes(selected(22,'-q24')[0],'17','22 q24: forward metric');
includes(selected(22,'-q24')[0],'6','22 q24: return metric');
eq(135-40,95,'23 q20: effective tracked priority');
eq(135-40<110,true,'23 q20: eligible preempting peer outranks incumbent');
includes(selected(23,'-q20')[0],'R2','23 q20: lower-priority incumbent yields to eligible peer');
eq(255>254,true,'23 q23: address owner priority exceeds ordinary peer');
includes(selected(23,'-q23')[0],'R1','23 q23: key identifies owner');

const freshRows=[['192.0.2.0/24','connected'],['192.0.2.1/32','receive'],['10.72.0.0/20','10.0.30.2'],['10.72.8.0/23','10.0.31.2'],['10.72.9.128/26','Null0'],['0.0.0.0/0','10.0.32.2']];
eq(['192.0.2.1','192.0.2.10','10.72.9.130','10.72.9.200','10.72.12.7','203.0.113.25'].map(a=>lookup(a,freshRows)),['receive','connected','Null0','10.0.31.2','10.0.30.2','10.0.32.2'],'17 new challenge: six distinct destination actions');
eq(lookup('10.72.9.130',freshRows.filter(([cidr])=>!cidr.endsWith('/26'))),'10.0.31.2','17 new challenge: withdrawal exposes covering route');
eq(['10.72.0.0/20','10.72.8.0/23','10.72.9.128/26'].map(cidr=>{const p=prefix(cidr);return [ipv4String(p.first),ipv4String(p.last)];}),[['10.72.0.0','10.72.15.255'],['10.72.8.0','10.72.9.255'],['10.72.9.128','10.72.9.191']],'17 new challenge: ranges calculated from masks');
includes(chapter(17).lab.challenge,'10.72.9.191','17 challenge solution retains checked endpoint');
eq(lookup('172.20.9.130',[['172.20.0.0/20','A'],['172.20.8.0/23','B']]),'B','17 q24: remaining longer prefix after withdrawal');
includes(selected(17,'-q24')[0],'Path B','17 q24: key agrees with remaining table');
const challenge18=prefix('198.51.100.65/26');
eq([ipv4String(challenge18.first),ipv4String(challenge18.last)],['198.51.100.64','198.51.100.127'],'18 challenge: new network boundary from loopback address');
includes(chapter(18).lab.challenge,'ip route 198.51.100.64 255.255.255.192 gigabitethernet0/1 10.0.13.2 150','18 challenge: backup matches whole /26 and intended exit');
eq(['198.51.100.65','198.51.100.95','198.51.100.96','198.51.100.126'].map(address=>lookup(address,[['198.51.100.64/26','primary'],['198.51.100.64/27','mistaken standby']])),['mistaken standby','mistaken standby','primary','primary'],'18 challenge: narrower standby diverts only first half');
includes(chapter(18).lab.challenge,'198.51.100.64/27 spans .64–.95','18 challenge solution matches independent mask-error range');

const address19=ip6('2001:db8:44:7::')+eui64('02:aa:bb:cc:dd:ee');
eq(canonical(address19),'2001:db8:44:7:aa:bbff:fecc:ddee','19 challenge: full EUI-64 address');
eq(canonical(ip6('ff02::1:ff00:0')+(address19&0xffffffn)),'ff02::1:ffcc:ddee','19 challenge: solicited-node derivation');
const allocation19=prefix('2001:db8:44:ab30::/60',6);
eq([canonical(allocation19.first),canonical(allocation19.last/(1n<<64n)*(1n<<64n)),canonical(allocation19.first+2n*(1n<<64n))],['2001:db8:44:ab30::','2001:db8:44:ab3f::','2001:db8:44:ab32::'],'19 challenge: first, last and third /64');
includes(chapter(19).lab.challenge,'2001:db8:44:ab32::1/64','19 challenge router uses independently allocated third /64');
const lan21=prefix('192.168.20.0/24');
eq([ipv4String(lan21.first+128n),ipv4String(lan21.first+129n),ipv4String(lan21.first+138n),ipv4String(lan21.first+190n)],['192.168.20.128','192.168.20.129','192.168.20.138','192.168.20.190'],'21 challenge: third /26, first/tenth/last usable');
includes(chapter(21).lab.challenge,'192.168.20.129 255.255.255.192','21 challenge configuration matches third /26');
const lan22=prefix('2001:db8:220:a0::/60',6);
eq(canonical(lan22.first+3n*(1n<<64n)),'2001:db8:220:a3::','22 challenge: fourth /64');
includes(chapter(22).lab.challenge,'2001:db8:220:a3::1/64','22 challenge configuration matches fourth /64');

// Dijkstra over the lab's directed outgoing costs, including the shared
// Ethernet paths. These cases can select an intermediate router, not just
// the explicitly contrasted direct/shared alternatives.
function ospfPath(start,destination,shared,lanCost) {
  const routers=['R1','R2','R3'];
  const edges=routers.flatMap(a=>routers.filter(b=>b!==a).map(b=>[a,b,shared[a]]));
  edges.push(['R1','R3',25],['R3','R1',25],[destination,'LAN',lanCost]);
  const distance=Object.fromEntries([...routers,'LAN'].map(n=>[n,n===start?0:Infinity]));
  const pending=new Set([...routers,'LAN']);
  while(pending.size) {
    const node=[...pending].sort((a,b)=>distance[a]-distance[b])[0];pending.delete(node);
    for(const [a,b,cost]of edges)if(a===node)distance[b]=Math.min(distance[b],distance[a]+cost);
  }
  return distance.LAN;
}
const sharedBase={R1:10,R2:10,R3:10};
eq([ospfPath('R1','R2',sharedBase,5),ospfPath('R3','R2',sharedBase,5)],[15,15],'21 challenge: both routes to added LAN');
eq([ospfPath('R1','R3',{...sharedBase,R1:40},1),ospfPath('R3','R1',{...sharedBase,R1:40},1)],[26,11],'21 challenge: asymmetric client routes after one outgoing-cost change');
eq([ospfPath('R1','R2',{...sharedBase,R1:40},5),ospfPath('R3','R2',{...sharedBase,R1:40},5)],[40,15],'21 challenge: intermediate R3 path beats direct shared route to new LAN');
includes(chapter(21).lab.challenge,'25 + 10 + 5 = 40','21 solution includes independently selected indirect path');
eq([ospfPath('R1','R2',sharedBase,7),ospfPath('R3','R2',sharedBase,7)],[17,17],'22 challenge: added IPv6 LAN costs');
eq([ospfPath('R1','R3',{...sharedBase,R1:50},1),ospfPath('R3','R1',{...sharedBase,R1:50},1)],[26,11],'22 challenge: IPv6 asymmetric client routes');
eq([ospfPath('R1','R2',{...sharedBase,R1:50},7),ospfPath('R3','R2',{...sharedBase,R1:50},7)],[42,17],'22 challenge: indirect path to new IPv6 LAN');
includes(chapter(22).lab.challenge,'25 + 10 + 7 = 42','22 solution includes independently selected indirect path');

console.log(JSON.stringify({result:'passed',checks,note:'Selected numerical keys and named topology/selection examples only; no simulator or device execution.'},null,2));
