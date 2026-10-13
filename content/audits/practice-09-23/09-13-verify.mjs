
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
const course=await loadCourse(fileURLToPath(new URL("content/",root))),baseline=JSON.parse(fs.readFileSync(new URL("baseline.json",here))),ledger=JSON.parse(fs.readFileSync(new URL("09-13-decisions.json",here)));
const chapters=course.chapters.filter(c=>c.number>=9&&c.number<=13),banks=["questions","cards","commands","tickets"],seen=new Set(),all=new Set(course.chapters.flatMap(c=>banks.flatMap(k=>c[k].map(x=>x.id))));
assert.equal(chapters.length,5);
for(const ch of chapters){
const old=baseline.chapters.find(x=>x.id===ch.id);
assert.deepEqual(ch.sections,old.sections,ch.id+" lesson text/section identities changed unexpectedly");
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
for(const q of ch.questions){render(q.prompt,q.id);q.options.forEach(x=>render(x,q.id));render(q.explanation,q.id);Object.values(q.whyWrong).forEach(x=>render(x,q.id));if(q.exhibit)render(q.exhibit.kind==="cli"?"~~~output\n"+q.exhibit.text+"\n~~~":q.exhibit.text,q.id);}
for(const c of ch.cards){render(c.front,c.id);render(c.back,c.id);}
for(const d of ch.commands){render(d.task,d.id);render(d.note,d.id);render("~~~ios\n"+d.mode+" "+d.answer+"\n~~~",d.id);}
for(const t of ch.tickets){render(t.scenario,t.id);render(t.question,t.id);t.options.forEach(x=>render(x,t.id));render(t.explanation,t.id);render(t.fix,t.id);t.exhibits.forEach(x=>render("~~~output\n"+x.text+"\n~~~",t.id));}
}
assert.equal(370-6*10.5-10*30,7);
assert.equal(1518+4,1522);
assert.equal(Math.floor(6/4)*4,4);
assert.equal(Math.floor(1/4)*4,0);
assert.equal(3*100,300);
const summary={checkedAt:new Date().toISOString(),scope:"09-13",fragments,closedSolutionDisclosures:solutions,decisions:ledger.length,actions:Object.fromEntries(["keep","revise","retire","add"].map(x=>[x,ledger.filter(d=>d.action===x).length])),chapters:chapters.map(c=>({number:c.number,id:c.id,questions:c.questions.length,cards:c.cards.length,commands:c.commands.length,tickets:c.tickets.length,steps:c.lab.steps.length,difficulty:[1,2,3].map(d=>c.questions.filter(q=>q.difficulty===d).length),singleAnswerPositions:[0,1,2,3].map(i=>c.questions.filter(q=>q.type==="single"&&q.answer[0]===i).length)})),limits:"Static content, React SSR and arithmetic checks only; no Packet Tracer/CML/device execution, browser layout measurement, or psychometric calibration."};
fs.writeFileSync(new URL("09-13-verification.json",here),JSON.stringify(summary,null,2)+"\n");console.log(JSON.stringify(summary,null,2));

