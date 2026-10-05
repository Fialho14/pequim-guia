import {cp, mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {checkPublicSource} from './check.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
await checkPublicSource(root);
const access=JSON.parse(await readFile(path.join(root,'access.config.json'),'utf8'));
if(typeof access.desktopOnly!=='boolean'||!Number.isInteger(access.minimumDesktopWidth)||access.minimumDesktopWidth<600||access.minimumDesktopWidth>1600)throw Error('Configuração de acesso inválida.');
const output=path.join(root,'.vercel/output'), target=path.join(output,'static');
await rm(output,{recursive:true,force:true});
await mkdir(target,{recursive:true});
await cp(path.join(root,'src'),target,{recursive:true});
await writeFile(path.join(target,'assets/access-policy.js'),`window.BEIJING_ACCESS=${JSON.stringify(access)};`);
for(const name of await readdir(target)){
 if(name.endsWith('.html')&&name!=='so-no-computador.html'){
  const file=path.join(target,name),html=await readFile(file,'utf8');
  await writeFile(file,html.replace('<head>','<head><script src="assets/access-policy.js"></script><script src="assets/device-guard.js"></script>'));
 }
}
const routes=[{src:'/(.*)',headers:{'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY'},continue:true}];
if(access.desktopOnly){
 routes.push({src:'/(.*)',has:[{type:'header',key:'user-agent',value:'.*(Android|android|iPhone|iPad|iPod|Mobile|mobile|IEMobile|Opera Mini|BlackBerry|Kindle|Silk).*'}],dest:'/so-no-computador.html',headers:{'Cache-Control':'private, no-store','Vary':'User-Agent'}});
 routes.push({src:'/(.*)',has:[{type:'header',key:'sec-ch-ua-mobile',value:'\\?1'}],dest:'/so-no-computador.html',headers:{'Cache-Control':'private, no-store','Vary':'User-Agent, Sec-CH-UA-Mobile'}});
}
routes.push({src:'/',dest:'/index.html'},{handle:'filesystem'});
await writeFile(path.join(output,'config.json'),JSON.stringify({version:3,routes},null,2));
console.log(`Versão pública criada: ${access.desktopOnly?'apenas computador':'computador e telemóvel'}. Nenhum ficheiro de local/ foi incluído.`);
