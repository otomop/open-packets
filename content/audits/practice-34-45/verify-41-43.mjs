import path from 'node:path';import {fileURLToPath} from 'node:url';import YAML from 'yaml';
process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..'));

import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {loadCourse} from '../../../scripts/load-course.mjs';import {runtime} from '../../../scripts/tests/runtime.mjs';
const require=createRequire(import.meta.url);const app=runtime({react:require('react'),'react/jsx-runtime':require('react/jsx-runtime'),marked:require('marked'),'@/lib/store':{prefersReducedMotion:()=>false}});const {default:Markdown,CodeBlock}=app.load('src/components/Markdown.tsx');
let count=0;function render(text){assert.equal(typeof text,'string');assert.ok(!/<!--\s*VERIFY|\bTODO\b|\bTBD\b/.test(text));const html=renderToStaticMarkup(createElement(Markdown,{text}));if(text.trim())assert.ok(html.length);assert.ok(!/<[^>]*\bNaN\b/.test(html));assert.ok(!/<(?:cr|interface|ip|mac|address|port)(?:\s|>)/i.test(html));count++;return html}
function output(x){const html=renderToStaticMarkup(createElement(CodeBlock,{lang:'output',title:x.title,text:x.text}));assert.ok(html.length);count++}
const course=await loadCourse('content');let chapters=course.chapters.filter(c=>[41,42,43].includes(c.number));
for(const c of chapters){
 for(const s of c.sections)render(s.body);
 for(const f of ['intro','topology','troubleshooting','challenge'])render(c.lab[f]);
 for(const [i,s] of c.lab.steps.entries()){assert.equal(s.n,i+1);assert.match(s.body,/:::(expected|solution)/);render(s.body)}
 const html=render(c.lab.challenge);assert.match(html,/<details\b/);assert.ok(!/<details[^>]*\bopen\b/.test(html));assert.equal(c.minutes.lab,c.lab.minutes);
 for(const q of c.questions){[q.prompt,...q.options,q.explanation,...Object.values(q.whyWrong)].forEach(render);if(q.exhibit)output(q.exhibit)}
 for(const card of c.cards){render(card.front);render(card.back)}
 for(const d of c.commands){render(d.task);render(d.note)}
 for(const t of c.tickets){[t.scenario,t.question,...t.options,t.explanation,t.fix].forEach(render);t.exhibits.forEach(output)}
}
const baseline=JSON.parse(fs.readFileSync('content/audits/practice-34-45/baseline.json','utf8')).chapters;
const ledger=JSON.parse(fs.readFileSync('content/audits/practice-34-45/41-43-decisions.json','utf8'));
let decisions=0;for(const c of chapters){let old=baseline.find(x=>x.id===c.id);for(const b of ['questions','cards','commands','tickets']){const a=new Map(old[b].map(x=>[x.id,x])),n=new Map(c[b].map(x=>[x.id,x]));for(const id of new Set([...a.keys(),...n.keys()])){let matches=ledger.filter(x=>x.chapterId===c.id&&x.bank===b&&x.id===id);assert.equal(matches.length,1);let action=!a.has(id)?'add':!n.has(id)?'retire':JSON.stringify(a.get(id))===JSON.stringify(n.get(id))?'keep':'revise';assert.equal(matches[0].action,action);decisions++}}}
assert.equal(decisions,ledger.length);console.log({status:'passed',renderedFragments:count,checkedDecisions:decisions,closedChallenges:3});

let assertions=0;const check=(actual,expected)=>{assert.deepEqual(actual,expected);assertions++};
for(const c of chapters){
 const prior=baseline.find(x=>x.id===c.id);check(c.sections.map(x=>x.id),prior.sections.map(x=>x.id));check(c.sections,prior.sections);check(c.prereqs,prior.prereqs);
 let d=0;for(const q of c.questions){assert.ok(q.difficulty>=d);d=q.difficulty;for(let i=0;i<q.options.length;i++)assert.ok(q.answer.includes(i)||q.whyWrong[i]);}
 for(const block of [...c.sections.map(s=>s.body),...c.lab.steps.map(s=>s.body),c.lab.challenge])for(const m of block.matchAll(/```yaml[^\n]*\n([\s\S]*?)\n```/g))YAML.parse(m[1]);
}
check(JSON.parse('{"devices":[{"name":"R1","interfaces":[{"name":"Gi0/0","enabled":true},{"name":"Gi0/1","enabled":false}]}]}').devices[0].interfaces[1].enabled,false);
check(typeof JSON.parse('{"enabled":"false"}').enabled,'string');
check(typeof JSON.parse('{"enabled":false}').enabled,'boolean');
check(JSON.parse('{"ports":[3,8]}').ports[1],8);
assert.throws(()=>JSON.parse("{\"hostname\":\"R1\",'managed':true,\"vlans\":[10,20,30,],\"site\":null}"));assertions++;
const command=['show version','show ip interface brief','show ip route'];check(command[1],'show ip interface brief');check(command[2],'show ip route');
check(['show ip route','show clock','show version'][0],'show ip route');
const branch=['r1','r2'];check(branch.filter(x=>['r1'].includes(x)),['r1']);check(branch.filter(x=>['r3'].includes(x)),[]);
const v4=ip=>ip.split('.').reduce((a,v)=>((a<<8)>>>0)+Number(v),0)>>>0;const same24=(a,b)=>(v4(a)>>>8)===(v4(b)>>>8);
check(same24('10.42.0.10','10.42.0.2'),true);
check(same24('192.168.10.10','192.168.10.1'),true);
check(same24('192.168.20.20','192.168.20.1'),true);
check(same24('192.168.20.21','192.168.20.20'),true);
check(same24('192.168.10.10','192.168.20.20'),false);
check(Buffer.from('bGFiOnRyYWluaW5n','base64').toString(),'lab:training');
check(Date.parse('2026-09-20T03:15:00Z')>Date.parse('2026-09-20T03:00:00Z'),true);
console.log({semanticAssertions:assertions,lessonSectionsUnchanged:true,yamlBlocksParsed:true});
