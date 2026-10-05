import http from 'node:http';
import {readFile,stat,access} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import QRCode from 'qrcode';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),lan=args.includes('--lan'),preview=args.includes('--preview');
const portIndex=args.indexOf('--port'),port=portIndex>=0?Number(args[portIndex+1]):8717;
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Porta inválida.');
let personal=false;try{await access(path.join(root,'local/index.html'));personal=true;}catch{}
const folder=path.join(root,preview?'.vercel/output/static':personal?'local':'src');
await access(path.join(folder,'index.html'));
const policy=JSON.parse(await readFile(path.join(root,'access.config.json'),'utf8'));
const networks=os.networkInterfaces();
const addresses=Object.entries(networks).sort(([a],[b])=>(a==='en0'?-1:b==='en0'?1:0)).flatMap(([name,entries])=>entries.filter(e=>e.family==='IPv4'&&!e.internal&&!name.startsWith('utun')).map(e=>e.address));
const links=lan?[...new Set(addresses)].map(ip=>`http://${ip}:${port}/index.html`):[];
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.pdf':'application/pdf','.ico':'image/x-icon'};
let phonePage='';
if(lan){const cards=await Promise.all(links.map(async url=>`<section>${await QRCode.toString(url,{type:'svg',margin:1,width:240})}<a href="${url}">${url}</a></section>`));phonePage=`<!doctype html><html lang="pt-PT"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Abrir no telemóvel · Pequim</title><style>body{background:#f6f3eb;color:#293126;margin:0;padding:50px 24px;font:15px/1.8 Arial;text-align:center}h1{font:46px Georgia;margin:20px}em{color:#99402f}p{color:#6d7765;max-width:540px;margin:20px auto}section{background:#fff;width:min(360px,90%);margin:24px auto;padding:25px;border:1px solid #d9dccc}svg{display:block;max-width:240px;margin:0 auto 15px}a{color:#99402f;overflow-wrap:anywhere;font-size:13px}.button{display:inline-block;padding:12px 22px;background:#99402f;color:white;text-decoration:none}</style><span>PEQUIM · O TEU GUIA LOCAL</span><h1>Leva o guia<br><em>contigo.</em></h1><p>Liga o telemóvel à mesma rede Wi-Fi do Mac e aponta a câmara para este código. Mantém esta janela do Terminal aberta enquanto usas o guia.</p>${cards.join('')||'<p>Não foi encontrada uma ligação de rede. Liga o Mac ao Wi-Fi e volta a abrir.</p>'}<a class="button" href="/index.html">Abrir o guia neste Mac ↗</a><p>Usa uma rede de confiança. Esta ligação serve a edição pessoal guardada no Mac. Favoritos e notas são próprios de cada navegador; usa Exportar/Importar plano para os transferir.</p></html>`;}
const server=http.createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
  let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/_pequim-health'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify({site:'pequim-guia',folder:path.basename(folder),lan,preview}));}
  if(lan&&pathname==='/telemovel'){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'});return res.end(req.method==='HEAD'?'':phonePage);}
  if(preview&&policy.desktopOnly&&(/Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini|BlackBerry|Kindle|Silk/i.test(req.headers['user-agent']||'')||req.headers['sec-ch-ua-mobile']==='?1'))pathname='/so-no-computador.html';
  if(pathname==='/')pathname='/index.html';
  const file=path.resolve(folder,'.'+pathname),ext=path.extname(file).toLowerCase();
  if(!file.startsWith(folder+path.sep)||pathname.split('/').some(s=>s.startsWith('.'))||!types[ext]){res.writeHead(404);return res.end('Não encontrado.');}
  const info=await stat(file);if(!info.isFile())throw Error('not file');
  res.writeHead(200,{'Content-Type':types[ext],'Content-Length':info.size,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  if(req.method==='HEAD')res.end();else createReadStream(file).pipe(res);
 }catch{res.writeHead(404);res.end('Página não encontrada.');}
});
const open=url=>{if(process.platform==='darwin')spawn('open',['-a','Google Chrome',url],{stdio:'ignore'});else if(process.platform==='win32')spawn('cmd',['/c','start','',url],{stdio:'ignore'});else spawn('xdg-open',[url],{stdio:'ignore'});};
const localUrl=`http://127.0.0.1:${port}/${lan?'telemovel':'index.html'}`;
server.on('error',async e=>{
 if(e.code==='EADDRINUSE'){
  try{const response=await fetch(`http://127.0.0.1:${port}/_pequim-health`);const active=await response.json();if(active.site==='pequim-guia'&&active.lan===lan&&active.preview===preview){console.log('O guia já está a funcionar nesta porta.');if(args.includes('--open'))open(localUrl);return;}}catch{}
  console.error('A porta está ocupada. Fecha o servidor anterior com Ctrl+C e abre novamente, ou usa --port 8719.');process.exitCode=1;
 }else{console.error(e.message);process.exitCode=1;}
});
server.listen(port,lan?'0.0.0.0':'127.0.0.1',async()=>{
 console.log(`Pequim · ${preview?'pré-visualização pública':personal?'edição pessoal':'guia público local'}\n${localUrl}\nCtrl+C para parar.`);
 for(const url of links){console.log(`\nNo telemóvel: ${url}\n`);console.log(await QRCode.toString(url,{type:'terminal',small:true}));}
 if(args.includes('--open'))open(localUrl);
});
process.on('SIGINT',()=>server.close(()=>process.exit(0)));
