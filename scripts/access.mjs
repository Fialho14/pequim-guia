import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mode=process.argv[2];if(!['allow','block'].includes(mode))throw Error('Usa allow ou block.');
const file=path.join(root,'access.config.json'),config=JSON.parse(await readFile(file,'utf8'));config.desktopOnly=mode==='block';await writeFile(file,JSON.stringify(config,null,2)+'\n');
console.log(mode==='allow'?'Telemóvel permitido na próxima publicação.':'Apenas computador na próxima publicação.');
if(process.argv.includes('--publish')){
 const git=(args,options={})=>execFileSync('git',args,{cwd:root,stdio:'inherit',...options});
 const diff=spawnSync('git',['diff','--exit-code','--quiet','--','access.config.json'],{cwd:root});
 if(diff.status===0)console.log('A configuração já está guardada no Git.');
 else if(diff.status===1){git(['add','--','access.config.json']);git(['commit','--only','-m',mode==='allow'?'Allow mobile access to the hosted guide':'Restrict the hosted guide to desktop','--','access.config.json']);}
 else throw Error('Não foi possível verificar o repositório.');
 git(['push','origin','main']);console.log('Enviado ao GitHub. O Vercel publica automaticamente as alterações.');
}
