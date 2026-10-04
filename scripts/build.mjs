import fs from 'node:fs/promises';import path from 'node:path';import {build} from 'esbuild';import {marked} from 'marked';
const root=process.cwd(),out=path.join(root,'dist');await fs.mkdir(out,{recursive:true});await fs.mkdir(path.join(out,'content'),{recursive:true});
const files=(await fs.readdir('content')).filter(f=>f.endsWith('.json')).sort(),index=[],search=[];
for(const file of files){
 const meta=JSON.parse(await fs.readFile(path.join('content',file),'utf8'));const body=await fs.readFile(path.join('content',meta.id+'.md'),'utf8');
 if(meta.id==='00')meta.group='算法基础';meta.problems=meta.problems.map(p=>({...p,id:/^\d+$/.test(p.id)?'LC '+p.id:p.id}));
 const tokens=marked.lexer(body),headingList=tokens.filter(t=>t.type==='heading').map(t=>t.text.replace(/[`*_]/g,''));
 meta.coverage=meta.coverage.map(c=>({...c,anchor:c.anchor||'section-'+Math.max(0,headingList.indexOf(c.section.replace(/[`*_]/g,'')))}));
 index.push({...meta,characters:body.length});await fs.writeFile(path.join(out,'content',meta.id+'.json'),JSON.stringify({...meta,body}));
 let part=null,section=0,lastAnchor='';for(const token of tokens){if(token.type==='html'){const a=token.text.match(/<a\s+id="([^"]+)"/);if(a)lastAnchor=a[1]}if(token.type==='heading'){if(part)search.push(part);const anchor='section-'+section++;part={module:meta.id,chapter:meta.title,title:token.text.replace(/[`*_]/g,''),anchor:lastAnchor||anchor,text:'',problemId:''};const p=meta.problems.find(p=>p.anchor===lastAnchor);if(p)part.problemId=p.id;lastAnchor=''}else if(part){part.text+=' '+(token.raw||'').replace(/[`*#<>]/g,'')}}if(part)search.push(part)
}
await fs.writeFile(path.join(out,'content/index.json'),JSON.stringify(index));await fs.writeFile(path.join(out,'content/search.json'),JSON.stringify(search));
for(const f of ['index.html','style.css','favicon.svg','syntax.md'])await fs.copyFile(f,path.join(out,f));await fs.copyFile('node_modules/highlight.js/styles/github.css',path.join(out,'highlight.css'));await fs.cp('assets',path.join(out,'assets'),{recursive:true});
await build({entryPoints:['app.js'],bundle:true,format:'esm',splitting:true,outdir:out,minify:true,target:['es2022'],chunkNames:'chunks/[name]-[hash]',logLevel:'warning'});await fs.writeFile(path.join(out,'.nojekyll'),'');
console.log(`Built ${index.length} chapters, ${index.reduce((s,m)=>s+m.sourcePages,0)} source pages, ${index.reduce((s,m)=>s+m.problems.length,0)} problem entries, ${search.length} searchable sections.`);
