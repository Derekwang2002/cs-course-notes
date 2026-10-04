import fs from 'node:fs/promises';
import {marked} from 'marked';
const errors=[],stats={chapters:0,pages:0,problems:0,diagrams:0,javaBlocks:0,characters:0};
const exists=async p=>{try{await fs.access(p);return true}catch{return false}};
for(const file of (await fs.readdir('content')).filter(f=>f.endsWith('.json')).sort()){
 const m=JSON.parse(await fs.readFile('content/'+file,'utf8'));const name='content/'+m.id+'.md';if(!await exists(name)){errors.push(`${m.id}: missing markdown`);continue}const body=await fs.readFile(name,'utf8');const tokens=marked.lexer(body);const headings=tokens.filter(t=>t.type==='heading').map(t=>t.text.replace(/[`*_]/g,''));const anchors=[...body.matchAll(/<a\s+id="([^"]+)"/g)].map(x=>x[1]);stats.chapters++;stats.pages+=m.sourcePages;stats.problems+=m.problems.length;stats.characters+=body.length;stats.diagrams+=tokens.filter(t=>t.type==='code'&&t.lang==='mermaid').length;stats.javaBlocks+=tokens.filter(t=>t.type==='code'&&t.lang==='java').length;
 if(new Set(anchors).size!==anchors.length)errors.push(`${m.id}: duplicate anchors`);
 for(const p of m.problems)if(!anchors.includes(p.anchor))errors.push(`${m.id}: problem ${p.id} missing anchor ${p.anchor}`);
 const covered=new Set(m.coverage.flatMap(c=>c.pages));for(let i=1;i<=m.sourcePages;i++){if(!covered.has(i))errors.push(`${m.id}: page ${i} unmapped`);if(!await exists(`assets/slides/${m.id}/${String(i).padStart(3,'0')}.jpg`))errors.push(`${m.id}: page ${i} image missing`)}
 for(const c of m.coverage){if(c.pages.some(p=>p<1||p>m.sourcePages))errors.push(`${m.id}: invalid coverage page`);if(c.anchor&&!anchors.includes(c.anchor))errors.push(`${m.id}: coverage invalid anchor ${c.anchor}`);else if(!c.anchor&&!headings.includes(c.section.replace(/[`*_]/g,'')))errors.push(`${m.id}: coverage title absent: ${c.section}`)}
 for(const a of [...body.matchAll(/\]\(#\/lesson\/([^)?]+)(?:\?section=([^)]*))?\)/g)]){const targetFile='content/'+a[1]+'.md';if(!await exists(targetFile)){errors.push(`${m.id}: broken chapter ${a[1]}`);continue}if(a[2]){const target=await fs.readFile(targetFile,'utf8');if(!target.includes(`id="${decodeURIComponent(a[2])}"`)&&!a[2].startsWith('section-'))errors.push(`${m.id}: broken target ${a[1]} ${a[2]}`)}}
}
console.log(JSON.stringify(stats,null,2));if(errors.length){console.error(errors.join('\n'));process.exitCode=1}else console.log('All coverage, slide assets, anchors and cross-chapter links valid.');
