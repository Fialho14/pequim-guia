(() => {
 'use strict';
 const pages=window.BEIJING_GUIDE||[],bySlug=Object.fromEntries(pages.map(p=>[p.slug,p]));
 const key='pequim-semestre-2027-v1';
 const defaults={days:150,rate:7.6,housing:900,food:1500,transport:300,phone:120,leisure:600,travel:900,other:300,flight:900,documents:1200,setup:1500,reserve:10000};
 const limits={days:[1,366],rate:[0.01,100],housing:[0,100000],food:[0,50000],transport:[0,50000],phone:[0,50000],leisure:[0,50000],travel:[0,100000],other:[0,50000],flight:[0,50000],documents:[0,100000],setup:[0,100000],reserve:[0,1000000]};
 const blank=()=>({version:1,favorites:[],read:[],checks:{},notes:'',budget:{...defaults}});
 let state=blank(),storageOK=true;
 try{const raw=localStorage.getItem(key);if(raw)state=sanitize(JSON.parse(raw));}catch{storageOK=false;}
 function sanitize(raw){
  if(!raw||raw.version!==1)throw new Error('Formato de plano incompatível.');
  const result=blank();
  result.favorites=[...new Set((Array.isArray(raw.favorites)?raw.favorites:[]).filter(x=>bySlug[x]))];
  result.read=[...new Set((Array.isArray(raw.read)?raw.read:[]).filter(x=>bySlug[x]))];
  result.notes=typeof raw.notes==='string'?raw.notes.slice(0,15000):'';
  for(let g=0;g<5;g++)for(let i=0;i<8;i++)if(raw.checks?.[g+'-'+i]===true)result.checks[g+'-'+i]=true;
  for(const name in defaults){const value=Number(raw.budget?.[name]),[min,max]=limits[name];if(raw.budget?.[name]!==null&&raw.budget?.[name]!==''&&Number.isFinite(value)&&value>=min&&value<=max&&(name==='rate'?Math.abs(value*100-Math.round(value*100))<0.000001:Number.isInteger(value)))result.budget[name]=value;}
  return result;
 }
 const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
 const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function save(){try{localStorage.setItem(key,JSON.stringify(state));}catch{storageOK=false;toast('Não foi possível guardar. Exporta o plano para conservar os dados.');}}
 let toastTimer;
 function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3200);}
 function openDialog(id){const d=$(id);if(!d.open)d.showModal();}
 all('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
 all('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
 all('[data-open-search]').forEach(b=>b.addEventListener('click',()=>{openDialog('#search-dialog');$('#global-search').focus();search($('#global-search').value);}));
 all('[data-open-plan]').forEach(b=>b.addEventListener('click',()=>{renderPlan();openDialog('#plan-dialog');}));
 all('[data-open-menu]').forEach(b=>b.addEventListener('click',()=>openDialog('#menu-dialog')));
 document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openDialog('#search-dialog');$('#global-search').focus();search($('#global-search').value);}});
 function updateButtons(){
  all('[data-save]').forEach(b=>{const active=state.favorites.includes(b.dataset.save);b.setAttribute('aria-pressed',String(active));b.setAttribute('title',active?'Remover dos favoritos':'Guardar nos favoritos');const s=b.querySelector('span');if(s)s.textContent=active?'Página guardada':'Guardar página';});
  all('[data-mark-read]').forEach(b=>{const active=state.read.includes(b.dataset.markRead);b.setAttribute('aria-pressed',String(active));b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg> '+(active?'Lida · desmarcar':'Marcar como lida');});
 }
 all('[data-save]').forEach(b=>b.addEventListener('click',()=>{const slug=b.dataset.save;if(state.favorites.includes(slug)){state.favorites=state.favorites.filter(x=>x!==slug);toast('Página removida dos favoritos.');}else{state.favorites.push(slug);toast('Página guardada no teu plano.');}save();updateButtons();}));
 all('[data-mark-read]').forEach(b=>b.addEventListener('click',()=>{const slug=b.dataset.markRead;state.read=state.read.includes(slug)?state.read.filter(x=>x!==slug):[...state.read,slug];save();updateButtons();toast(state.read.includes(slug)?'Leitura marcada.':'Leitura desmarcada.');}));
 all('[data-print]').forEach(b=>b.addEventListener('click',()=>window.print()));
 function renderPlan(){
  $('#saved-count').textContent=state.favorites.length;$('#read-count').textContent=state.read.length;$('#check-count').textContent=Object.values(state.checks).filter(Boolean).length;
  $('#saved-pages').innerHTML=state.favorites.length?state.favorites.map(slug=>'<div class="saved-entry"><a href="'+slug+'.html">'+escape(bySlug[slug].title)+'</a><button class="icon-button" data-remove="'+slug+'" aria-label="Remover '+escape(bySlug[slug].title)+'">Remover</button></div>').join(''):'<p class="muted">Guarda páginas com o ícone de marcador. Aparecem aqui quando quiseres voltar a elas.</p>';
  all('[data-remove]').forEach(b=>b.addEventListener('click',()=>{state.favorites=state.favorites.filter(x=>x!==b.dataset.remove);save();updateButtons();renderPlan();}));
  $('#personal-notes').value=state.notes;
 }
 $('#personal-notes').addEventListener('input',e=>{state.notes=e.target.value;save();});
 $('#export-plan').addEventListener('click',()=>{const data=new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'}),url=URL.createObjectURL(data),a=document.createElement('a');a.href=url;a.download='pequim-o-meu-plano.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Plano exportado para a pasta de downloads.');});
 $('#import-plan').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>500000)throw Error('O ficheiro é demasiado grande.');const incoming=sanitize(JSON.parse(await file.text()));state={...incoming,favorites:[...new Set([...state.favorites,...incoming.favorites])],read:[...new Set([...state.read,...incoming.read])],checks:{...state.checks,...incoming.checks},notes:incoming.notes||state.notes};save();updateButtons();updateChecks();loadBudget();renderPlan();toast('Plano importado. Favoritos e tarefas foram combinados.');}catch(err){toast('Não foi possível importar: '+err.message);}e.target.value='';});
 // Full-text search: title, introduction and individual sections, accent-insensitive.
 function search(query){
  const raw=query.trim(),terms=normalize(raw).split(/\s+/).filter(Boolean),output=$('#search-results');
  if(!terms.length){$('#search-status').textContent='Pesquisa nas 30 páginas e em todas as secções.';output.innerHTML='<div class="search-hints">Experimenta: <b>Compiladores</b>, <b>visto X2</b>, <b>residência</b>, <b>cantinas</b> ou <b>pagamentos</b>.<br>Escreve duas ou mais palavras para afinar a pesquisa.</div>';return;}
  const results=[];
  for(const p of pages){
   const title=normalize(p.title+' '+p.description),sectionMatches=p.sections.map(s=>({...s,combined:normalize(s.title+' '+s.text)}));
   const full=title+' '+sectionMatches.map(s=>s.combined).join(' ');
   if(!terms.every(t=>full.includes(t)))continue;
   const section=sectionMatches.find(s=>terms.every(t=>s.combined.includes(t)))||sectionMatches.find(s=>terms.some(t=>s.combined.includes(t)));
   const score=terms.reduce((sum,t)=>sum+(normalize(p.title).includes(t)?7:0)+(title.includes(t)?3:0),0)+(section&&terms.every(t=>section.combined.includes(t))?2:0);
   const text=section?section.text:p.description,normalized=normalize(text),positions=terms.map(t=>normalized.indexOf(t)).filter(n=>n>=0),position=positions.length?Math.max(0,Math.min(...positions)-55):0,snippet=(position?'…':'')+text.slice(position,position+230)+(text.length>position+230?'…':'');
   results.push({p,section,score,snippet});
  }
  results.sort((a,b)=>b.score-a.score);
  $('#search-status').textContent=results.length?results.length+' página'+(results.length===1?'':'s')+' encontrada'+(results.length===1?'':'s')+'.':'Sem resultados. Experimenta menos palavras ou outro termo.';
  output.innerHTML=results.map(({p,section,snippet})=>'<a class="search-result" href="'+p.slug+'.html'+(section?'#'+section.anchor:'')+'"><span class="eyebrow">'+escape(p.number+' / '+p.group)+(section?' · '+escape(section.title):'')+'</span><h3>'+escape(p.title)+'</h3><p>'+escape(snippet)+'</p></a>').join('');
 }
 $('#global-search').addEventListener('input',e=>search(e.target.value));
 // Main index filters.
 let selectedGroup='all';
 function filterGuide(){const input=$('#guide-filter');if(!input)return;const q=normalize(input.value.trim());let count=0;all('[data-guide]').forEach(el=>{const p=bySlug[el.dataset.guide],match=(selectedGroup==='all'||p.group===groupLabel(selectedGroup))&&normalize(p.title+' '+p.description).includes(q);el.hidden=!match;if(match)count++;});$('#guide-empty').hidden=count>0;$('#filter-status').textContent=count+' páginas apresentadas.';}
 function groupLabel(id){return {'preparar':'Antes de partir','estudar':'Na Tsinghua','viver':'Viver em Pequim','mover':'Ir mais longe','explorar':'Descobrir a cidade','planear':'O teu plano'}[id];}
 function selectFilter(id){selectedGroup=id;all('[data-filter]').forEach(b=>{const active=b.dataset.filter===id;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});filterGuide();}
 all('[data-filter]').forEach(b=>b.addEventListener('click',()=>selectFilter(b.dataset.filter)));
 $('#guide-filter')?.addEventListener('input',filterGuide);
 function handleGroupHash(){const id=location.hash.replace('#grupo-','');if(location.hash.startsWith('#grupo-')&&groupLabel(id)&&$('#guia')){selectFilter(id);$('#guia').scrollIntoView({behavior:'instant'});}}
 window.addEventListener('hashchange',handleGroupHash);handleGroupHash();
 // Saved checkboxes.
 function updateChecks(){all('[data-check]').forEach(b=>b.checked=!!state.checks[b.dataset.check]);const count=Object.values(state.checks).filter(Boolean).length;if($('#checklist-progress'))$('#checklist-progress').textContent=count+' / 40';if($('.check-progress span'))$('.check-progress span').style.width=(count/40*100)+'%';}
 all('[data-check]').forEach(b=>b.addEventListener('change',()=>{if(b.checked)state.checks[b.dataset.check]=true;else delete state.checks[b.dataset.check];save();updateChecks();}));
 // Budget inputs and calculation. Native constraints are checked before displaying a total.
 const form=$('#budget-form'),eur=v=>new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(v),cny=v=>new Intl.NumberFormat('pt-PT',{maximumFractionDigits:0}).format(v)+' CNY';
 function loadBudget(){if(!form)return;for(const name in defaults)form.elements[name].value=state.budget[name];calculateBudget();}
 function calculateBudget(){if(!form)return;const v={};let valid=true;for(const name in defaults){const input=form.elements[name];v[name]=Number(input.value);if(input.value===''||!input.validity.valid||!Number.isFinite(v[name]))valid=false;}
  if(!valid){$('#budget-total').textContent='Rever valores';$('#budget-cny').textContent='Usa valores válidos nos campos.';$('#budget-breakdown').innerHTML='';return;}
  state.budget=v;const months=v.days/30,monthly=['housing','food','transport','phone','leisure','travel','other'].reduce((sum,k)=>sum+v[k],0),recurring=monthly*months,once=v.flight*v.rate+v.documents+v.setup,spend=recurring+once,total=spend+v.reserve;
  $('#budget-total').textContent=eur(total/v.rate);$('#budget-cny').textContent=cny(total);$('#budget-breakdown').innerHTML=[['Por mês',eur(monthly/v.rate)],['Dias de estadia',v.days],['Despesas recorrentes',eur(recurring/v.rate)],['Custos únicos',eur(once/v.rate)],['Despesas previstas',eur(spend/v.rate)],['Reserva separada',eur(v.reserve/v.rate)]].map(([label,value])=>'<div><span>'+escape(label)+'</span><b>'+escape(value)+'</b></div>').join('');
 }
 form?.addEventListener('input',()=>{calculateBudget();save();});form?.addEventListener('submit',e=>e.preventDefault());
 const presets={economico:{housing:900,food:1500,transport:300,phone:120,leisure:600,travel:900,other:300},confortavel:{housing:1200,food:2100,transport:450,phone:150,leisure:1200,travel:1800,other:600},fora:{housing:4500,food:2100,transport:600,phone:150,leisure:1200,travel:1800,other:650,setup:7000}};
 all('[data-preset]').forEach(b=>b.addEventListener('click',()=>{state.budget={...state.budget,...presets[b.dataset.preset]};loadBudget();save();toast(b.dataset.preset==='fora'?'Renda e caução são hipóteses. Ajusta a uma proposta real.':'Cenário carregado. Confirma tarifa e atribuição do quarto.');}));
 $('#budget-reset')?.addEventListener('click',()=>{state.budget={...defaults};loadBudget();save();toast('Valores iniciais repostos.');});
 // Source directory.
 $('#source-filter')?.addEventListener('input',e=>{const q=normalize(e.target.value);let count=0;all('[data-source-search]').forEach(el=>{el.hidden=!normalize(el.dataset.sourceSearch).includes(q);if(!el.hidden)count++;});$('#source-count').textContent=count+' fontes';$('#source-empty').hidden=count>0;});
 // Clipboard works on localhost; fallback also supports opening index.html directly.
 all('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(b.dataset.copy);else{const t=document.createElement('textarea');t.value=b.dataset.copy;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();const ok=document.execCommand('copy');t.remove();if(!ok)throw Error('copy');}toast('Frase copiada.');}catch{toast('Não foi possível copiar. A frase continua visível para mostrar.');}}));
 const clock=$('#beijing-time');function tick(){if(clock)clock.textContent=new Intl.DateTimeFormat('pt-PT',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date())+' · UTC +8';}tick();if(clock)setInterval(tick,60000);
 let scrollQueued=false;function updateProgress(){const h=document.documentElement,den=h.scrollHeight-h.clientHeight;$('.reading-progress span').style.width=(den>0?Math.min(100,Math.max(0,h.scrollTop/den*100)):0)+'%';scrollQueued=false;}
 window.addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateProgress);}},{passive:true});updateProgress();
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{const active=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];if(active)all('.article-sidebar nav a').forEach(a=>a.classList.toggle('active',a.hash==='#'+active.target.id));},{rootMargin:'-110px 0px -55% 0px'});all('.article-section').forEach(s=>observer.observe(s));}
 updateButtons();updateChecks();loadBudget();filterGuide();
 if(!storageOK)toast('Armazenamento local indisponível. Usa Exportar plano para guardar o progresso.');
})();
