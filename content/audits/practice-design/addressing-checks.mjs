// Independent arithmetic checks of concrete checkpoint answers and lab plans.
// Uses integer address ranges, rather than the course's octet-increment method.
import assert from 'node:assert/strict';
import {loadCourse} from '../../../scripts/load-course.mjs';
import {fileURLToPath} from 'node:url';
const {chapters} = await loadCourse(fileURLToPath(new URL('../../', import.meta.url)));
const ipv4 = chapters.find(c => c.number === 4);
const vlsm = chapters.find(c => c.number === 5);
const ip = text => text.split('.').reduce((n, octet) => (n << 8n) + BigInt(octet), 0n);
const dotted = n => [24n, 16n, 8n, 0n].map(shift => Number((n >> shift) & 255n)).join('.');
function range(text) {
  const [address, bits] = text.split('/');
  const size = 1n << BigInt(32 - Number(bits));
  const first = ip(address) / size * size;
  return {first, last: first + size - 1n, size, prefix: Number(bits)};
}
const usable = (address, subnet) => ip(address) > range(subnet).first && ip(address) < range(subnet).last;
const overlap = (a, b) => range(a).first <= range(b).last && range(b).first <= range(a).last;
const inside = (child, parent) => range(child).first >= range(parent).first && range(child).last <= range(parent).last;
const hostCapacity = bits => Number((1n << BigInt(32 - bits)) - 2n);
const smallestLan = hosts => { for (let bits = 30; bits >= 0; bits--) if (hostCapacity(bits) >= hosts) return bits; };
const question = (c, suffix) => { const q = c.questions.find(q => q.id.endsWith(suffix)); assert.ok(q, c.id + suffix); return q; };
const selected = (c, suffix) => { const q = question(c, suffix); return q.answer.map(i => q.options[i]); };
let checks = 0;
function eq(actual, expected, label) { assert.deepEqual(actual, expected, label); checks++; }
function classify(c, suffix, predicate) {
  const q = question(c, suffix);
  eq(q.answer.slice().sort((a,b) => a-b), q.options.flatMap((option, i) => predicate(option) ? [i] : []), q.id);
}
eq(selected(ipv4, '-q01'), [dotted(range('10.1.1.77/27').first)], '04 network');
eq(selected(ipv4, '-q02'), [dotted(range('172.16.200.9/21').last)], '04 broadcast');
eq(selected(ipv4, '-q03'), [dotted(((1n << 32n) - 1n) ^ ((1n << BigInt(32-smallestLan(6))) - 1n))], '04 gateway-inclusive capacity');
classify(ipv4, '-q04', a => usable(a, '192.168.10.64/26'));
classify(ipv4, '-q08', a => usable(a, '172.20.77.210/20'));
eq(Number(selected(ipv4, '-q10')[0].replaceAll(',', '')), hostCapacity(22), '04 usable host count');
eq(Number(selected(ipv4, '-q17')[0]), Number(0b10101101n & 0b11000000n), '04 bitwise AND');
eq(selected(ipv4, '-q16'), [dotted(range('10.55.128.1/18').last - 1n)], '04 last usable');
const q01 = selected(vlsm, '-q01')[0];
eq(q01.match(/\d+\.\d+\.\d+\.\d+/g), [dotted(range('172.16.77.210/20').first), dotted(range('172.16.77.210/20').last)], '05 /20 range');
eq(Number(selected(vlsm, '-q02')[0].match(/^\/(\d+)/)[1]), smallestLan(71), '05 includes gateway');
eq(selected(vlsm, '-q03')[0], `${2 ** (23 - 16)} subnets; ${hostCapacity(23)} usable each`, '05 subnet and host counts');
eq(selected(vlsm, '-q04')[0].match(/\d+\.\d+\.\d+\.\d+/g), [20,23].flatMap(bits => { const r = range(`10.4.200.77/${bits}`); return [dotted(r.first), dotted(r.last)]; }), '05 same address with different masks');
eq(selected(vlsm, '-q07'), ['10.44.8.0/22'], '05 exact summary answer');
eq(range('10.44.8.0/22').first, range('10.44.8.0/24').first, '05 exact summary start');
eq(range('10.44.8.0/22').last, range('10.44.11.0/24').last, '05 exact summary end');
const summary = selected(vlsm, '-q08')[0];
eq(inside('10.44.9.0/24', summary) && inside('10.44.12.0/24', summary), true, '05 containing summary');
eq(inside('10.44.9.0/24', '10.44.8.0/22') && inside('10.44.12.0/24', '10.44.8.0/22'), false, '05 longer summary insufficient');
classify(vlsm, '-q09', a => ['10.0.0.0/8','172.16.0.0/12','192.168.0.0/16'].some(p => ip(a) >= range(p).first && ip(a) <= range(p).last));
classify(vlsm, '-q17', a => overlap(a, '10.20.4.0/22'));
eq(selected(vlsm, '-q20'), [dotted(range('10.50.6.0/23').first + 9n * range('0.0.0.0/27').size) + '/27'], '05 tenth child subnet');
eq(Number(selected(vlsm, '-q21')[0]), hostCapacity(27) - 1 - 8 - 4, '05 reserved capacity');
classify(vlsm, '-q22', text => {
  const addresses = text.match(/\d+\.\d+\.\d+\.\d+/g);
  return addresses.length === 2 && addresses.every(a => usable(a, '10.44.8.224/30'));
});
const free = selected(vlsm, '-q24').map(range).sort((a,b) => a.first < b.first ? -1 : 1);
eq([free[0].first, free[0].last + 1n, free[1].last], [ip('10.66.0.208'), free[1].first, ip('10.66.0.255')], '05 exact remaining interval');
eq(selected(vlsm, '-q25'), [`ip address ${dotted(range('172.18.12.96/27').last - 1n)} 255.255.255.224`], '05 last-address gateway');
classify(vlsm, '-q28', text => {
  const allocations = text.match(/\d+\.\d+\.\d+\.\d+\/\d+/g);
  return allocations.length === 3
    && allocations.every((a,i) => inside(a, '172.18.40.0/23') && range(a).prefix === smallestLan([200,50,20][i]))
    && allocations.every((a,i) => allocations.every((b,j) => i===j || !overlap(a,b)));
});

// Guided and changed lab address plans; every interface must be in range.
for (const [subnet, hosts, capacity] of [
  ['192.168.44.128/26', ['192.168.44.129','192.168.44.130','192.168.44.150'], 62],
  ['192.168.44.192/27', ['192.168.44.193','192.168.44.194'], 30],
  ['10.7.16.0/21', ['10.7.16.1','10.7.19.77','10.7.23.250'], 2046],
  ['10.44.8.0/25', ['10.44.8.1','10.44.8.10'], 126],
  ['10.44.8.128/26', ['10.44.8.129','10.44.8.140'], 62],
  ['10.44.8.192/27', ['10.44.8.193','10.44.8.200'], 30],
]) {
  eq(hosts.every(a => usable(a, subnet)), true, subnet + ': usable interface assignments');
  eq(hostCapacity(range(subnet).prefix), capacity, subnet + ': capacity');
}
const plan = ['10.44.8.0/25','10.44.8.128/26','10.44.8.192/27','10.44.8.224/30'];
eq(plan.every(a => inside(a, '10.44.8.0/24')), true, '05 allocations contained');
eq(plan.every((a,i) => plan.every((b,j) => i===j || !overlap(a,b))), true, '05 allocations do not overlap');
eq(plan.reduce((sum,a) => sum + Number(range(a).size), 0), 228, '05 allocated block capacity');
const remaining = ['10.44.8.228/30','10.44.8.232/29','10.44.8.240/28'].map(range);
eq(remaining.map(r => [dotted(r.first), dotted(r.last)]), [['10.44.8.228','10.44.8.231'],['10.44.8.232','10.44.8.239'],['10.44.8.240','10.44.8.255']], '05 exact initial free blocks');
eq(overlap('10.44.8.129/25', '10.44.8.192/27'), true, '05 proposed growth overlaps Devices');
eq([100,70,20].reduce((sum,hosts) => sum + Number(range(`0.0.0.0/${smallestLan(hosts)}`).size),4), 292, '05 growth cannot fit original /24');
eq(usable('10.44.9.1','10.44.9.0/25') && usable('10.44.9.10','10.44.9.0/25') && !usable('10.44.9.140','10.44.9.0/25'), true, '05 new router and host, invalid carried-over host number');
const challenge = ['192.168.72.0/26','192.168.72.64/27','192.168.72.96/28','192.168.72.112/29','192.168.72.120/30'];
eq(challenge.map(a => hostCapacity(range(a).prefix)), [62,30,14,6,2], '05 independent challenge capacities');
eq(challenge.map(a => dotted(range(a).last)), ['192.168.72.63','192.168.72.95','192.168.72.111','192.168.72.119','192.168.72.123'], '05 independent challenge broadcasts');
eq(challenge.every(a => inside(a, '192.168.72.0/24')) && challenge.every((a,i) => challenge.every((b,j) => i===j || !overlap(a,b))), true, '05 independent challenge placement');
const challengeFree = ['192.168.72.124/30','192.168.72.128/25'].map(range);
eq([challengeFree[0].first, challengeFree[0].last + 1n, challengeFree[1].last], [ip('192.168.72.124'),challengeFree[1].first,ip('192.168.72.255')], '05 independent challenge remaining blocks');
eq(smallestLan(100), 25, '05 extra LAN size');
eq(challenge.every(a => !overlap(a,'192.168.72.128/25')) && inside('192.168.72.128/25','192.168.72.0/24'), true, '05 extra LAN fits');
console.log(JSON.stringify({result: 'passed', arithmeticChecks: checks, note: 'Selected numerical keys and named address plans only; full editorial review is recorded separately.'}, null, 2));
