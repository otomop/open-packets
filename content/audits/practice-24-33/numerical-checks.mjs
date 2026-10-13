// Independent worked-example arithmetic and forwarding decisions.
// These checks do not emulate IOS, DHCP, DNS, QoS or an operating system.
import assert from 'node:assert/strict';
const results = [];
function check(item, calculation, actual, expected) {
  assert.deepEqual(actual, expected, `${item}: ${calculation}`);
  results.push({item, calculation, result: actual});
}
const ip = value => value.split('.').reduce((n, octet) => n * 256 + Number(octet), 0);
const network = (value, prefix) => Math.floor(ip(value) / 2 ** (32 - prefix));
const onLink = (a, b, prefix) => network(a, prefix) === network(b, prefix);
function route(destination, routes) {
  return routes.filter(r => onLink(destination, r.network, r.prefix))
    .sort((a, b) => b.prefix - a.prefix || a.metric - b.metric)[0].name;
}
check('24-q10 / lab2', 'excluded /24 hosts', 49 + (254 - 53 + 1), 251);
check('24-q10 / lab2', 'eligible /24 hosts before bindings', 254 - 251, 3);
check('24-q10', 'candidates remaining after three allocations', 3 - 3, 0);
check('24-q23', 'ordinary /27 hosts', 2 ** 5 - 2, 30);
check('24-q23', 'eligible range .10 through .29', 30 - 9 - 1, 20);
check('24-q09', 'default T1 hours for 12-hour lease', 12 * 0.5, 6);
check('24-lab', 'default T1/T2 hours for 8-hour lease', [8 * 0.5, 8 * 0.875], [4, 7]);
check('24-lab9', 'expanded .50 through .254 candidates', 254 - 50 + 1, 205);
check('24-challenge', 'excluded addresses', 49 + (254 - 60 + 1), 244);
check('24-challenge', 'remaining .50 through .59 candidates', 254 - 244, 10);
check('25-q12', 'ordinary remaining TTL seconds', 86400 - 3600, 82800);
check('25-q12', 'remaining TTL hours', 82800 / 3600, 23);
check('25-q22', 'reverse lookup name', '10.1.1.80'.split('.').reverse().join('.') + '.in-addr.arpa', '80.1.1.10.in-addr.arpa');
check('25-challenge', 'new reverse lookup name', '10.1.1.81'.split('.').reverse().join('.') + '.in-addr.arpa', '81.1.1.10.in-addr.arpa');
check('26-q24', 'inclusive pool capacity', 23 - 20 + 1, 4);
check('26-q24', 'shortfall for five simultaneous address allocations', 5 - 4, 1);
check('26-q24', 'pool endpoints inside allocated /28', [20, 23].every(x => onLink(`198.51.100.${x}`, '198.51.100.16', 28)), true);
check('26-q27', 'incorrect /32 takes precedence over correct pool route', route('198.51.100.20', [
  {network: '198.51.100.16', prefix: 28, metric: 1, name: 'EDGE'},
  {network: '198.51.100.20', prefix: 32, metric: 1, name: 'wrong neighbor'},
  {network: '0.0.0.0', prefix: 0, metric: 1, name: 'default'},
]), 'wrong neighbor');
check('26-lab11', 'remaining illustrative lifetime seconds', 45 - 20, 25);
check('26-challenge', 'static public service address inside return /28', onLink('198.51.100.17', '198.51.100.16', 28), true);
check('26-challenge', 'published inside service shares client LAN', onLink('10.20.30.50', '10.20.30.1', 24), true);
check('27-q16 / lab12', 'octet delta', 1037500000 - 1000000000, 37500000);
check('27-q16 / lab12', 'mean bits/s', 37500000 * 8 / 30, 10000000);
check('27-lab12', 'directional utilization percent', 10000000 / 100000000 * 100, 10);
check('27-challenge', 'mean bits/s', (570000000 - 540000000) * 8 / 20, 12000000);
check('27-challenge', 'directional utilization percent', 12000000 / 100000000 * 100, 12);
check('27-lab3', 'selected stratum-8 upstream gives stratum 9 locally', 8 + 1, 9);
check('27-challenge', 'warnings threshold excludes notification severity 5', 5 <= 4, false);
check('27-challenge', 'warnings threshold permits error severity 3', 3 <= 4, true);
check('28-lab1', 'packets/s', 1000 / 20, 50);
check('28-lab1', 'one-call Layer 3 bits/s', (160 + 40) * 50 * 8, 80000);
check('28-lab1', 'two-call offered rate exceeds supplied allowance', 80000 * 2 > 128000, true);
check('28-lab4', 'new priority exceed drops', 900 - 400, 500);
check('28-lab8', 'AF21 decimal', 8 * 2 + 2 * 1, 18);
check('28-AF32', 'AF32 decimal', 8 * 3 + 2 * 2, 28);
check('28-lab8', 'AF21 DS byte with ECN zero', (18 * 4).toString(16), '48');
check('28-q15', 'serialization milliseconds', 1500 * 8 / 1000000 * 1000, 12);
check('28-t02', 'new policer drops', 920 - 200, 720);
check('28-challenge', 'burst exceeds service while average is below it', [18 > 12, 7 < 12], [true, true]);
check('29-storage', 'remaining bytes', 180000000 - 70000000, 110000000);
check('29-lab9', 'probe file bytes including newline', Buffer.byteLength('CCNA secure transfer practice\n'), 30);
check('29-challenge', 'handover file bytes including newline', Buffer.byteLength('CCNA handover checkpoint\n'), 25);
check('30-lab2', 'inclusive DHCP range size', 149 - 100 + 1, 50);
check('30-lab2', 'static server and new client outside pool', [20, 60].every(x => x < 100 || x > 149), true);
check('30-lab8', 'remote endpoint incorrectly on-link with /16', onLink('192.168.40.120', '192.168.50.10', 16), true);
check('30-lab9', 'remote endpoint off-link with intended /24', onLink('192.168.40.120', '192.168.50.10', 24), false);
check('30-challenge', '/27 block size', 2 ** (32 - 27), 32);
check('30-challenge', 'router, server and unused .30 in same /27', [1, 10, 30].every(x => onLink(`192.168.60.${x}`, '192.168.60.0', 27)), true);
check('30-challenge', 'ordinary /27 host range and broadcast octet', [1, 2 ** 5 - 2, 2 ** 5 - 1], [1, 30, 31]);
check('30-challenge', 'local resolver and real gateway remain on-link', ['192.168.40.20', '192.168.40.1'].every(x => onLink('192.168.40.60', x, 24)), true);
const clientRoutes = [
  {network: '0.0.0.0', prefix: 0, metric: 10, name: 'Ethernet default'},
  {network: '0.0.0.0', prefix: 0, metric: 25, name: 'Wi-Fi default'},
  {network: '10.70.8.0', prefix: 24, metric: 200, name: 'VPN service route'},
];
check('30-q17', 'longest matching route before metric', route('10.70.8.25', clientRoutes), 'VPN service route');
check('30-q17', 'other destination uses preferred default', route('10.70.9.25', clientRoutes), 'Ethernet default');
check('31-q18', 'new input packets', 3000000 - 1000000, 2000000);
check('31-q18', 'new CRC errors', 900 - 900, 0);
check('31-q25', 'new output drops', 150 - 50, 100);
const toolkitRoutes = [
  {network: '10.31.10.0', prefix: 24, metric: 1, name: 'R1 transit next hop'},
  {network: '10.31.10.50', prefix: 32, metric: 1, name: 'Null0 discard'},
];
check('31-challenge', '.50 matches discard exception', route('10.31.10.50', toolkitRoutes), 'Null0 discard');
check('31-challenge', '.60 uses network route', route('10.31.10.60', toolkitRoutes), 'R1 transit next hop');
check('31-challenge', 'router address uses network route', route('10.31.10.1', toolkitRoutes), 'R1 transit next hop');
check('33-challenge', 'loopback NAS source is off server LAN', onLink('10.255.33.1', '10.33.0.100', 24), false);
check('33-challenge', 'server gateway is on server LAN', onLink('10.33.0.1', '10.33.0.100', 24), true);
console.log(JSON.stringify({result: 'passed', checks: results.length, results, limits: 'Authored arithmetic and supplied route decisions only; no networking device or simulator execution.'}, null, 2));
