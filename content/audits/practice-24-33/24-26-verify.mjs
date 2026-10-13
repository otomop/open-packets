
import assert from "node:assert/strict";
import fs from "node:fs";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import {isDeepStrictEqual} from "node:util";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {loadCourse} from "../../../scripts/load-course.mjs";
import {runtime} from "../../../scripts/tests/runtime.mjs";
const root=new URL("../../../",import.meta.url),here=new URL("./",import.meta.url);
const course=await loadCourse(fileURLToPath(new URL("content/",root))),baseline=JSON.parse(fs.readFileSync(new URL("baseline.json",here))),ledger=JSON.parse(fs.readFileSync(new URL("24-26-decisions.json",here)));
const chapters=course.chapters.filter(c=>c.number>=24&&c.number<=26),banks=["questions","cards","commands","tickets"],seen=new Set(),all=new Set(course.chapters.flatMap(c=>banks.flatMap(k=>c[k].map(x=>x.id))));
assert.equal(chapters.length,3);
for(const ch of chapters){
const old=baseline.chapters.find(x=>x.id===ch.id);
const expectedSections=structuredClone(old.sections);
if(ch.id==="dns"){
 const section=expectedSections.find(s=>s.id==="diagnosing-by-symptom");
 assert.ok(section,"DNS diagnosis section identity");
 const original="| NXDOMAIN | Reply says the queried name does not exist |";
 assert.ok(section.body.includes(original),"documented narrow baseline wording");
 section.body=section.body.replace(original,"| NXDOMAIN | Reply reports the queried name, or final alias target, absent |");
}
assert.deepEqual(ch.sections,expectedSections,ch.id+" unexpected lesson/section change");
assert.equal(ch.lab.minutes,ch.minutes.lab,ch.id+" time mismatch");
assert.match(ch.lab.intro,/Practice revised September 2026/);
assert.match(ch.lab.challenge,/:::solution/);
assert.ok(ch.questions.every((q,i)=>i===0||q.difficulty>=ch.questions[i-1].difficulty),ch.id+" demand order");
for(const k of banks){
const before=new Map(old[k].map(x=>[x.id,x])),after=new Map(ch[k].map(x=>[x.id,x]));
for(const id of new Set([...before.keys(),...after.keys()])){
const ds=ledger.filter(d=>d.chapterId===ch.id&&d.bank===k&&d.id===id);assert.equal(ds.length,1,id+" ledger cardinality");const d=ds[0],p=before.get(id),q=after.get(id);
const action=!p?"add":!q?"retire":isDeepStrictEqual(p,q)?"keep":"revise";assert.equal(d.action,action,id+" decision equality");
assert.ok(d.reason.length>20,id+" rationale");if(d.destination)assert.ok(all.has(d.destination),id+" unknown destination");
seen.add(d);
}
}
for(const q of ch.questions){assert.ok(q.answer.length>=1);assert.equal(new Set(q.options).size,q.options.length,q.id+" repeated options");for(let i=0;i<q.options.length;i++)if(!q.answer.includes(i))assert.ok(q.whyWrong?.[i]?.trim(),q.id+" missing feedback");}
}
assert.equal(seen.size,ledger.length,"extraneous ledger items");
const require=createRequire(import.meta.url),view=runtime({react:require("react"),"react/jsx-runtime":require("react/jsx-runtime"),marked:require("marked"),"@/lib/store":{prefersReducedMotion:()=>false}}).load("src/components/Markdown.tsx");
let fragments=0,solutions=0;
function render(text,label){if(!text)return;const html=renderToStaticMarkup(createElement(view.default,{text}));assert.ok(!html.includes(":::solution")&&!html.includes(":::expected"),label+" unparsed container");assert.ok(!/<details[^>]*\sopen[=\s>]/.test(html),label+" answer already open");fragments++;solutions+=(html.match(/<details\b/g)||[]).length;return html;}
for(const ch of chapters){
for(const sec of ch.sections)render(sec.body,ch.id+"/"+sec.id);
for(const k of ["intro","topology","troubleshooting","challenge"])render(ch.lab[k],ch.id+"/lab/"+k);
for(const st of ch.lab.steps)render(st.body,ch.id+"/"+st.id);
for(const q of ch.questions){render(q.prompt,q.id);q.options.forEach(x=>render(x,q.id));render(q.explanation,q.id);Object.values(q.whyWrong).forEach(x=>render(x,q.id));if(q.exhibit)render(q.exhibit.kind==="cli"?"~~~output\n"+q.exhibit.text+"\n~~~":q.exhibit.kind==="diagram"?"~~~diagram\n"+JSON.stringify(q.exhibit.spec)+"\n~~~":q.exhibit.text,q.id);}
for(const c of ch.cards){render(c.front,c.id);render(c.back,c.id);}
for(const d of ch.commands){render(d.task,d.id);render(d.note,d.id);render("~~~ios\n"+d.mode+" "+d.answer+"\n~~~",d.id);}
for(const t of ch.tickets){render(t.scenario,t.id);render(t.question,t.id);t.options.forEach(x=>render(x,t.id));render(t.explanation,t.id);render(t.fix,t.id);t.exhibits.forEach(x=>render("~~~output\n"+x.text+"\n~~~",t.id));}
}
// Independently enumerate host candidates rather than reusing prose arithmetic.
const hosts=Array.from({length:254},(_,i)=>i+1);
assert.deepEqual(hosts.filter(x=>!(x>=1&&x<=49)&&!(x>=53&&x<=254)),[50,51,52]);
assert.equal(hosts.filter(x=>x>49).length,205);
assert.deepEqual(hosts.filter(x=>!(x>=1&&x<=49)&&!(x>=60&&x<=254)),Array.from({length:10},(_,i)=>50+i));
assert.deepEqual(Array.from({length:30},(_,i)=>i+1).filter(x=>!(x>=1&&x<=9)&&x!==30),Array.from({length:20},(_,i)=>10+i));
assert.equal(12*60*60*0.5/3600,6);
assert.deepEqual([0.5,0.875].map(x=>8*60*60*x/3600),[4,7]);
assert.equal(86400-60*60,82800);
for(const [addr,owner] of [["10.1.1.80","80.1.1.10.in-addr.arpa"],["10.1.1.81","81.1.1.10.in-addr.arpa"]])assert.equal(addr.split(".").reverse().join(".")+".in-addr.arpa",owner);
const ip=x=>x.split(".").reduce((n,v)=>n*256+Number(v),0),inPrefix=(x,n,bits)=>Math.floor(ip(x)/2**(32-bits))===Math.floor(ip(n)/2**(32-bits));
for(const n of [17,20,21,22,23]){assert.ok(inPrefix("198.51.100."+n,"198.51.100.16",28));assert.ok(!inPrefix("198.51.100."+n,"198.51.100.0",30));}
assert.equal(ip("198.51.100.23")-ip("198.51.100.20")+1,4);
const matching=[["198.51.100.0",30],["198.51.100.16",28],["198.51.100.20",32],["0.0.0.0",0]].filter(([n,b])=>inPrefix("198.51.100.20",n,b));
assert.equal(Math.max(...matching.map(x=>x[1])),32);
const summary={checkedAt:new Date().toISOString(),scope:"24-26",fragments,closedSolutionDisclosures:solutions,decisions:ledger.length,actions:Object.fromEntries(["keep","revise","retire","add"].map(x=>[x,ledger.filter(d=>d.action===x).length])),chapters:chapters.map(c=>({number:c.number,id:c.id,questions:c.questions.length,cards:c.cards.length,commands:c.commands.length,tickets:c.tickets.length,steps:c.lab.steps.length,difficulty:[1,2,3].map(d=>c.questions.filter(q=>q.difficulty===d).length),singleAnswerPositions:[0,1,2,3].map(i=>c.questions.filter(q=>q.type==="single"&&q.answer[0]===i).length)})),limits:"Static content, React SSR and arithmetic checks only; no Packet Tracer/CML/device execution, browser layout measurement, or psychometric calibration."};
fs.writeFileSync(new URL("24-26-verification.json",here),JSON.stringify(summary,null,2)+"\n");console.log(JSON.stringify(summary,null,2));

