import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

async function files(dir){let result=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isSymbolicLink())throw Error('Não são permitidos symlinks na versão pública.');result.push(...(e.isDirectory()?await files(p):[p]));}return result;}
export async function checkPublicSource(root){
 const source=path.join(root,'src'),list=await files(source);
 const pages=list.filter(p=>p.endsWith('.html')&&!p.endsWith('so-no-computador.html'));
 assert.equal(pages.length,30,'Devem existir 30 páginas do guia.');
 const banned=/\/Users\/|[a-z0-9._%+-]+@(?:gmail|icloud|outlook|hotmail)\.com|confirmaste em 4 de outubro|Ainda não recebeste confirmação|tua conversa|deep-research-report|Detailed-map-of|AB1647BD|Screenshot 2026|gh[oprs]_[a-zA-Z0-9]{20,}|-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY|(?:api[_-]?key|password|secret)\s*[:=]\s*["'][a-zA-Z0-9_-]{20,}/i;
 for(const file of [...list,...await files(path.join(root,'content'))]){
  if(!/\.(html|js|json|css|md|svg)$/.test(file)){
   assert.ok(/^assets\/(pequim|templo|tsinghua)\.jpg$/.test(path.relative(source,file)),'Ficheiro binário não aprovado: '+file);continue;
  }
  const text=await readFile(file,'utf8');assert.ok(!banned.test(text),'Possível informação privada em '+path.relative(root,file));
 }
 const ids=new Map();for(const file of pages){const text=await readFile(file,'utf8');ids.set(path.basename(file),new Set([...text.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1])));assert.equal((text.match(/<h1[ >]/g)||[]).length,1,file);}
 for(const file of pages){const text=await readFile(file,'utf8');for(const [,raw] of text.matchAll(/(?:href|src)="([^"]+)"/g)){
  const ref=raw.replaceAll('&amp;','&');if(/^(https?:|mailto:|data:)/.test(ref))continue;
  const u=new URL(ref,'http://local/'+path.basename(file));const target=path.join(source,decodeURIComponent(u.pathname));assert.ok((await stat(target)).isFile(),'Ligação ausente: '+ref);
  if(u.hash&&ids.has(path.basename(target)))assert.ok(ids.get(path.basename(target)).has(decodeURIComponent(u.hash.slice(1))),'Âncora ausente: '+ref);
 }}
 const data=JSON.parse((await readFile(path.join(source,'assets/search-data.js'),'utf8')).replace(/^window.BEIJING_GUIDE=/,'').replace(/;\s*$/,''));
 assert.equal(data.length,30);for(const page of data)for(const section of page.sections)assert.ok(ids.get(page.slug+'.html').has(section.anchor),'Âncora de pesquisa ausente.');
 console.log('Validação pública: 30 páginas, ligações, pesquisa e exclusão de informação privada OK.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await checkPublicSource(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
