/* RapidEx Attendance Portal - browser app. Rules in dayRow() must match engine.py */
// ================================================================ icons
const I={
 home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
 grid:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 4v17M3 14h18"/>',
 day:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/><circle cx="12" cy="15" r="2"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 flag:'<path d="M5 21V4h11l-1.5 4L16 12H5"/>',
 team:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.6-5.5 6.5-5.5s5.5 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .8 3.2 2.6 3.7 5.5"/>',
 finger:'<path d="M12 11v3a6 6 0 0 1-1.5 4M8 6.5A6 6 0 0 1 18 11v2M6 10a6 6 0 0 0 0 1v2a10 10 0 0 0 1 4M15 12v2c0 2-.5 4-1.5 6M9 11a3 3 0 0 1 6 0"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
 list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
 sync:'<path d="M21 12a9 9 0 0 1-15.5 6.3L3 16M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>',
 dl:'<path d="M12 3v12m0 0-5-5m5 5 5-5M4 21h16"/>',
 left:'<path d="m15 18-6-6 6-6"/>',right:'<path d="m9 18 6-6-6-6"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',
 pdf:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 15h6M9 11h2"/>'
};
const ic=(n,extra='')=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" ${extra}>${I[n]}</svg>`;

// ================================================================ helpers
let TODAY=new Date();TODAY.setHours(0,0,0,0);
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const parse=s=>new Date(s+'T00:00:00');
const WD=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const wday=s=>(parse(s).getDay()+6)%7;
const nice=s=>parse(s).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
const short=s=>parse(s).toLocaleDateString('en-GB',{day:'2-digit',month:'short'});
const monLabel=m=>parse(m+'-01').toLocaleDateString('en-GB',{month:'long',year:'numeric'});
const hmToM=t=>t?(+t.slice(0,2))*60+(+t.slice(3,5)):null;
const mToHm=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const fmt=m=>(m==null||m==='')?'':Math.floor(m/60)+'h '+String(m%60).padStart(2,'0')+'m';
const fmtS=m=>(m==null||m==='')?'':Math.floor(m/60)+':'+String(m%60).padStart(2,'0');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s);
const initials=n=>n.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();
const key=(m,u,d)=>m+'|'+u+'|'+d;

// ================================================================ live data
const S={settings:{},machines:[],staff:[],punches:{},notes:{},loaded:new Set(),raw:{},lastSync:null,nextSync:null,user:PORTAL.user};
async function api(path,body,opts={}){
  const r=await fetch(path,body!==undefined?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),...opts}:opts);
  if(r.status===401){location.href='/login';throw new Error('signed out')}
  const j=await r.json().catch(()=>({}));
  if(!r.ok){toast(j.error||'Something went wrong. Please try again.');throw new Error(j.error||r.status)}
  return j}
async function boot(){const b=await api('/api/bootstrap');Object.assign(S,{settings:b.settings,machines:b.machines,staff:b.staff,
  lastSync:b.lastSync?new Date(b.lastSync.replace(' ','T')):null,nextSync:b.nextSync?new Date(b.nextSync.replace(' ','T')):null});
  TODAY=parse(b.today)}
async function ensure(from,to){const need=range(from,to).filter(d=>!S.loaded.has(d));if(!need.length)return;
  const j=await api(`/api/range?from=${need[0]}&to=${need[need.length-1]}`);
  for(const d of range(need[0],need[need.length-1])){S.loaded.add(d);for(const k of Object.keys(S.punches))if(k.endsWith('|'+d))delete S.punches[k];for(const k of Object.keys(S.notes))if(k.endsWith('|'+d))delete S.notes[k]}
  Object.assign(S.punches,j.punches);Object.assign(S.notes,j.notes)}
function resetCache(){S.punches={};S.notes={};S.loaded=new Set();S.raw={}}
const shiftOf=s=>({in:s.sin||S.settings.d_in,out:s.sout||S.settings.d_out,grace:s.grace??S.settings.grace});
const isOff=ds=>S.settings.off.includes(wday(ds))||S.settings.holidays.includes(ds);
const mName=id=>S.machines.find(m=>m.id==id)?.name||'';
const hhmm=d=>d?d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'—';

// ================================================================ engine
const CODES={P:'Present',L:'Late',A:'Absent',H:'Half day',E:'Excused',S:'Sick leave',WH:'Work from home',WO:'Weekly off / holiday'};
const code=c=>c?`<span class="code c-${c}" title="${CODES[c]}">${c}</span>`:'<span class="code" style="color:var(--mute)">·</span>';
const legend=()=>`<div class="legend">${Object.entries(CODES).map(([c,l])=>`<span>${code(c)}${l}</span>`).join('')}</div>`;
const tracked=()=>S.staff.filter(s=>s.active&&s.track);
function dayRow(s,ds){
  const tod=iso(TODAY);if(ds>tod)return null;
  const k=key(s.m,s.u,ds),t=(S.punches[k]||[]).map(x=>x.slice(0,5)).sort(),n=S.notes[k]||{},sh=shiftOf(s);
  const cin=n.fin||t[0]||'',cout=n.fout||(t.length>1?t[t.length-1]:'');const off=isOff(ds);
  let worked=null,late=null,early=null,ot=null;
  if(cin&&cout&&hmToM(cout)>hmToM(cin))worked=hmToM(cout)-hmToM(cin);
  if(s.late&&cin&&!off){const l=hmToM(cin)-hmToM(sh.in);late=l>sh.grace?l:0;if(cout){const e=hmToM(sh.out)-hmToM(cout);early=e>0?e:0}}
  let auto=off?'WO':(cin?(late?'L':'P'):(ds===tod?'':'A'));
  if(S.settings.short_h&&!off&&worked!=null&&worked<(hmToM(sh.out)-hmToM(sh.in))/2)auto='H';
  const st=n.status||auto;
  if(['A','S','E','WH'].includes(st)){late=null;early=null}
  if(s.ot&&cout){const o=(off||st==='WO')?(worked||0):hmToM(cout)-hmToM(sh.out);ot=o>=S.settings.ot_min?o:0}
  return {s,ds,cin,cout,punches:t,worked,hours:s.hours?worked:null,late,early,ot,st,manual:!!n.status,fixed:!!(n.fin||n.fout),comment:n.comment||'',shift:sh,
          missingOut:!!cin&&!cout&&ds!==tod,atWork:!!cin&&!cout&&ds===tod};
}
function range(a,b){const o=[];for(let d=parse(a);iso(d)<=b;d=addDays(d,1))o.push(iso(d));return o}
function monthDays(m){const [y,mo]=m.split('-').map(Number);const o=[];for(let d=new Date(y,mo-1,1);d.getMonth()===mo-1;d=addDays(d,1))o.push(iso(d));return o}
function tally(rows){const t={P:0,L:0,A:0,H:0,E:0,S:0,WH:0,WO:0,late:0,hours:0,ot:0,otDays:0,missing:0,work:0};
  for(const r of rows){if(!r)continue;if(t[r.st]!=null)t[r.st]++;t.late+=r.late||0;t.hours+=r.worked||0;if(r.ot){t.ot+=r.ot;t.otDays++}if(r.missingOut)t.missing++;if(r.st&&r.st!=='WO')t.work++}
  t.pct=t.work?Math.round((t.P+t.L+t.WH+t.E+t.H*0.5)/t.work*100):0;return t}
function attention(){const out=[];const days=range(iso(addDays(TODAY,-7)),iso(addDays(TODAY,-1)));
  for(const s of tracked())for(const ds of days){const r=dayRow(s,ds);if(!r)continue;
    if(r.missingOut&&!r.comment)out.push({r,kind:'out',label:'No clock-out punch'});
    else if(r.st==='A'&&!r.manual&&!r.comment)out.push({r,kind:'abs',label:'Absent, no reason recorded'});
    else if(r.late>=60&&!r.comment)out.push({r,kind:'late',label:`Late by ${fmt(r.late)}`})}
  return out.sort((a,b)=>b.r.ds.localeCompare(a.r.ds))}

// ================================================================ state + shell
let route='dashboard',DAY=iso(TODAY),MON=iso(TODAY).slice(0,7),RMON=MON,REP=null,F={m:'',dep:'',q:'',st:''},EMPF={m:'',q:'',show:'tracked'},SEL=new Set();
const NAV=[
  ['Overview',[['dashboard','Dashboard','home']]],
  ['Attendance',[['month','Monthly sheet','grid'],['daily','Daily view','day'],['report','Employee report','user'],['ot','Overtime','clock'],['attention','Needs attention','flag']]],
  ['Setup',[['employees','Employees','team'],['machines','Machines','finger'],['punches','Raw punches','list'],['settings','Settings','gear']]]];
function renderSide(){const att=attention().length;const bad=S.machines.filter(m=>m.enabled&&m.ok===false).length;
  $('#side').innerHTML=`<div class="brand">${PORTAL.hasLogo?`<img src="/logo" alt="${esc(S.settings.company||'RapidEx')}">`:`<div class="mark">Rx</div><div><b>Rapid<span>Ex</span></b><small>Attendance</small></div>`}</div>
  ${NAV.map(([g,items])=>`<div class="navg"><h6>${g}</h6><nav class="nav">${items.map(([r,l,i])=>`<a href="#${r}" class="${route===r?'on':''}">${ic(i)}<span class="lbl">${l}</span>${r==='attention'&&att?`<span class="badge">${att}</span>`:''}</a>`).join('')}</nav></div>`).join('')}
  <div class="foot"><div class="t"><span class="dot ${bad?'bad':''}"></span>${!S.machines.length?'No machines added yet':bad?bad+' machine'+(bad>1?'s':'')+' not reachable':'All machines online'}</div>
  <div class="s">${S.lastSync?`Synced ${hhmm(S.lastSync)}${S.settings.auto&&S.nextSync?' · next '+hhmm(S.nextSync):''}`:'Not synced yet'}</div>
  <button class="btn" id="syncBtn" onclick="syncNow()">${ic('sync')}Sync now</button>
  <div class="userchip">${ic('user','style="width:15px;height:15px"')}${esc(S.user)}<a href="/logout">Log out</a></div></div>`}
function setTop(title,sub,acts=''){$('#top').innerHTML=`<div><h1>${title}</h1><p>${sub}</p></div><div class="acts">${acts}</div>`}
function toast(t){const el=$('#toast');el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,3400)}
const exportBtn=url=>`<a class="btn or" href="${url}">${ic('dl')}Export Excel</a>`;
const qs=o=>Object.entries(o).filter(([k,v])=>v!==''&&v!=null).map(([k,v])=>k+'='+encodeURIComponent(v)).join('&');
const officeSel=(id,val,all='All offices')=>`<select id="${id}"><option value="">${all}</option>${S.machines.map(m=>`<option value="${m.id}" ${val==m.id?'selected':''}>${m.name}</option>`).join('')}</select>`;
const depSel=(id,val)=>`<select id="${id}"><option value="">All departments</option>${[...new Set(tracked().map(s=>s.dep))].sort().map(d=>`<option ${val===d?'selected':''}>${esc(d)}</option>`).join('')}</select>`;
const nameCell=(s,sub)=>`<div class="who"><span class="av">${initials(s.name)}</span><div><button class="namebtn" onclick="openReport(${s.sid})">${esc(s.name)}</button><span class="sub">${sub??esc(s.des||'—')}</span></div></div>`;
function openReport(sid){REP=sid;RMON=route==='month'?MON:RMON;closeD();location.hash='report';if(route==='report')render()}

// ================================================================ views
const V={};
V.dashboard=()=>{
  const t=iso(TODAY),st=tracked(),rows=st.map(s=>dayRow(s,t));
  const pres=rows.filter(r=>r.cin).length,late=rows.filter(r=>r.st==='L'),leave=rows.filter(r=>['S','E','WH','H'].includes(r.st)),notIn=rows.filter(r=>!r.cin&&!['WO','S','E','WH','H'].includes(r.st));
  const expected=rows.filter(r=>r.st!=='WO').length;
  const att=attention();
  setTop(`Good ${new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'}`,`${nice(t)} · ${st.length} employees tracked across ${S.machines.length} offices`,`<a class="btn ghost" href="#daily">${ic('day')}Open today</a>`);
  const k=(lab,col,val,of,foot,bar)=>`<div class="card kpi"><div class="lab"><i style="background:${col}"></i>${lab}</div><div class="val">${val}${of!=null?` <small>/ ${of}</small>`:''}</div>${bar!=null?`<div class="bar"><i style="width:${bar}%;background:${col}"></i></div>`:''}<div class="foot">${foot}</div></div>`;
  const byOffice=S.machines.map(m=>{const rs=rows.filter(r=>r.s.m===m.id);const c=x=>rs.filter(x).length;return {m,n:rs.length,p:c(r=>r.st==='P'),l:c(r=>r.st==='L'),o:c(r=>['S','E','WH','H'].includes(r.st)),a:c(r=>!r.cin&&!['WO','S','E','WH','H'].includes(r.st))}});
  return `<div class="grid g4">
${k('Clocked in','var(--ok)',pres,expected,`${expected?Math.round(pres/expected*100):0}% of today's team`,expected?pres/expected*100:0)}
${k('Late','#7a45b8',late.length,null,late.length?`Most late: ${esc(late.sort((a,b)=>b.late-a.late)[0].s.name)} (${fmt(late[0].late)})`:'Nobody late so far')}
${k('Not in yet','var(--bad)',notIn.length,null,notIn.length?'Shift has started for most offices':'Everyone expected is in')}
${k('Leave & WFH','var(--blue)',leave.length,null,'Sick, excused, half day or work from home')}
</div>
<div class="grid g-main">
 <div class="card"><div class="card-h"><h3>Today by office</h3><span class="sub">Tracked employees only</span>
  <div class="legend" style="margin-left:auto"><span><i class="code c-P" style="min-width:12px;height:12px"></i>On time</span><span><i class="code c-L" style="min-width:12px;height:12px"></i>Late</span><span><i class="code c-H" style="min-width:12px;height:12px"></i>Leave/WFH</span><span><i class="code c-A" style="min-width:12px;height:12px"></i>Not in</span></div></div>
  <div class="card-b">${byOffice.map(o=>`<div class="ofc"><b>${o.m.name}</b><div class="stack" title="${o.p} on time, ${o.l} late, ${o.o} leave/WFH, ${o.a} not in">${o.n?[['#5cc06f',o.p],['#a57de0',o.l],['#6d93ec',o.o],['#ef7a7a',o.a]].map(([c,v])=>`<i style="width:${v/o.n*100}%;background:${c}"></i>`).join(''):''}</div><span class="mute">${o.p+o.l}/${o.n} in</span></div>`).join('')}</div></div>
 <div class="card"><div class="card-h"><h3>Needs attention</h3><span class="sub">last 7 days</span><a class="btn link sm" style="margin-left:auto" href="#attention">See all ${att.length}</a></div>
  ${att.slice(0,5).map(a=>`<div class="list-item"><span class="av">${initials(a.r.s.name)}</span><div class="grow"><b>${esc(a.r.s.name)}</b><span>${a.label} · ${short(a.r.ds)} · ${mName(a.r.s.m)}</span></div><button class="btn sm ghost" onclick="editDay(${a.r.s.sid},'${a.r.ds}')">Resolve</button></div>`).join('')||'<div class="empty">Nothing to fix. All recent days are complete.</div>'}</div>
</div>
<div class="grid g2">
 <div class="card"><div class="card-h"><h3>Late today</h3><span class="sub">${late.length} people</span></div>
 ${late.length?`<div class="tw"><table><thead><tr><th>Employee</th><th>Office</th><th>Shift</th><th>In</th><th>Late by</th></tr></thead><tbody>${late.map(r=>`<tr><td>${nameCell(r.s)}</td><td>${mName(r.s.m)}</td><td>${r.shift.in}</td><td>${r.cin}</td><td><span class="tag t-warn">${fmt(r.late)}</span></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Nobody is late today.</div>'}</div>
 <div class="card"><div class="card-h"><h3>Not clocked in</h3><span class="sub">${notIn.length} people</span></div>
 ${notIn.length?`<div class="tw"><table><thead><tr><th>Employee</th><th>Office</th><th>Shift starts</th><th></th></tr></thead><tbody>${notIn.map(r=>`<tr><td>${nameCell(r.s)}</td><td>${mName(r.s.m)}</td><td>${r.shift.in}</td><td><button class="btn sm ghost" onclick="editDay(${r.s.sid},'${r.ds}')">Mark leave</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Everyone expected today has clocked in.</div>'}</div>
</div>
<div class="card"><div class="card-h"><h3>Machines</h3><span class="sub">Auto-sync every ${S.settings.sync_hours} hours</span><a class="btn link sm" style="margin-left:auto" href="#machines">Manage</a></div>
<div class="card-b"><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">${S.machines.filter(m=>m.enabled).map(m=>`<div style="display:flex;gap:10px;align-items:center"><span class="dot ${m.ok===false?'bad':''}" style="${m.ok==null?'background:#c9b4cc':''}"></span><div><b>${esc(m.name)}</b><span class="sub" style="display:block;font-size:12px;color:${m.ok===false?'var(--bad)':'var(--mute)'}">${m.ok==null?'Not synced yet':m.ok?'Synced '+hhmm(new Date(m.lastSync.replace(' ','T')))+' · '+esc(m.msg):'Not reachable'}</span></div></div>`).join('')||'<span class="mute">No machines yet. <a href="#machines">Add your first machine</a>.</span>'}</div></div></div>`};

V.month=()=>{
  const days=monthDays(MON),tod=iso(TODAY);
  const staff=tracked().filter(s=>(!F.m||s.m==F.m)&&(!F.dep||s.dep===F.dep)&&(!F.q||(s.name+' '+s.u).toLowerCase().includes(F.q.toLowerCase()))).sort((a,b)=>a.m-b.m||a.u-b.u);
  setTop('Monthly sheet',`${monLabel(MON)} · same layout and codes as the HR sheet`,exportBtn('/export/month?'+qs({m:MON,office:F.m,dep:F.dep,q:F.q})));
  const L=[0,40,210,312],W=[40,170,102,64];const st=(i,c='',x='')=>`class="st ${c}" style="left:${L[i]}px;min-width:${W[i]}px;max-width:${W[i]}px;${x}"`;
  const body=staff.map((s,i)=>{const rs=days.map(d=>dayRow(s,d)),t=tally(rs);
    return `<tr><td ${st(0,'','text-align:center;color:var(--mute)')}>${i+1}</td>
<td ${st(1)}><button class="namebtn" style="font-size:13px" onclick="openReport(${s.sid})">${esc(s.name)}</button><span class="sub" style="display:block;font-size:11px;color:var(--mute);overflow:hidden;text-overflow:ellipsis">${esc(s.dep)}</span></td>
<td ${st(2,'','font-size:12px;color:var(--ink-2)')}>${mName(s.m)}</td>
<td ${st(3,'abs','text-align:center;box-shadow:inset -1px 0 var(--line-2);'+(t.A>=5?'background:#fff6c7':''))}>${t.A||'–'}</td>
${rs.map((r,j)=>{const ds=days[j];if(!r)return `<td class="${isOff(ds)?'we':''}"></td>`;
  const tip=[CODES[r.st]||'',r.cin&&'In '+r.cin,r.cout&&'Out '+r.cout,r.comment].filter(Boolean).join(' · ');
  return `<td class="cell ${isOff(ds)?'we':''} ${r.comment||r.fixed?'note':''}" title="${esc(tip)}" onclick="editDay(${s.sid},'${ds}')">${code(r.st)}</td>`}).join('')}
${['P','L','H','S','E','WH'].map(c=>`<td class="tot">${t[c]||''}</td>`).join('')}</tr>`}).join('');
  return `<div class="card"><div class="card-b bar-f">
<div class="field"><label for="mMon">Month</label><div class="datenav"><button class="iconbtn" aria-label="Previous month" onclick="shiftMon(-1)">${ic('left')}</button><input id="mMon" type="month" value="${MON}" onchange="MON=this.value;render()"><button class="iconbtn" aria-label="Next month" onclick="shiftMon(1)">${ic('right')}</button></div></div>
<div class="field"><label for="fM">Office</label>${officeSel('fM',F.m)}</div>
<div class="field"><label for="fD">Department</label>${depSel('fD',F.dep)}</div>
<div class="field"><label for="fQ">Search</label><div class="search">${ic('search')}<input id="fQ" value="${esc(F.q)}" placeholder="Name or ID"></div></div>
<button class="btn" onclick="F.m=$('#fM').value;F.dep=$('#fD').value;F.q=$('#fQ').value.trim();render()">Apply</button></div></div>
<div class="card"><div class="mhead"><h3>RapidEx Attendance Sheet · <span>${monLabel(MON)}</span></h3><span style="opacity:.8;font-size:13px">${staff.length} employees</span></div>
<div class="tw" style="max-height:70vh"><table class="mg"><thead>
<tr class="d1"><th ${st(0)}></th><th ${st(1)}></th><th ${st(2)}></th><th ${st(3)}></th>${days.map(d=>`<th class="${isOff(d)?'we':''} ${d===tod?'today':''}">${WD[wday(d)]}</th>`).join('')}<th colspan="6" style="background:var(--plum-soft);color:var(--plum)">Month totals</th></tr>
<tr class="d2"><th ${st(0,'','text-align:center')}>No.</th><th ${st(1)}>Employee</th><th ${st(2)}>Office</th><th ${st(3,'','text-align:center;box-shadow:inset -1px 0 var(--line-2)')}>Absent</th>${days.map(d=>`<th class="${isOff(d)?'we':''} ${d===tod?'today':''}">${+d.slice(8)}</th>`).join('')}${['P','L','H','S','E','WH'].map(c=>`<th>${c}</th>`).join('')}</tr></thead>
<tbody>${body||'<tr><td colspan="40" class="empty">No employees match these filters.</td></tr>'}</tbody></table></div>
<div class="card-b" style="border-top:1px solid var(--line);display:flex;flex-direction:column;gap:8px">${legend()}<span class="mute" style="font-size:12.5px">P, L, A and WO fill in from the machines. Click a cell to set H, E, S or WH, fix a punch or add a comment (orange dot). Click a name for that person's report.</span></div></div>`};
function shiftMon(n){const d=parse(MON+'-01');d.setMonth(d.getMonth()+n);MON=iso(d).slice(0,7);render()}

V.daily=()=>{
  const all=tracked().filter(s=>(!F.m||s.m==F.m)&&(!F.q||(s.name+' '+s.u+' '+s.dep).toLowerCase().includes(F.q.toLowerCase()))).map(s=>dayRow(s,DAY)).filter(Boolean);
  const groups={all:['All',()=>true],in:['Clocked in',r=>r.cin],L:['Late',r=>r.st==='L'],A:['Absent / not in',r=>!r.cin&&!['WO','S','E','WH','H'].includes(r.st)],lv:['Leave & WFH',r=>['S','E','WH','H'].includes(r.st)],mo:['Missing out',r=>r.missingOut],ot:['Overtime',r=>r.ot]};
  const cur=groups[F.st]?F.st:'all';const rows=all.filter(groups[cur][1]).sort((a,b)=>(a.cin||'99').localeCompare(b.cin||'99'));
  setTop('Daily view',nice(DAY),exportBtn('/export/day?'+qs({d:DAY,office:F.m})));
  return `<div class="card"><div class="card-b bar-f">
<div class="datenav"><button class="iconbtn" aria-label="Previous day" onclick="DAY=iso(addDays(parse(DAY),-1));render()">${ic('left')}</button><input type="date" id="dDay" value="${DAY}" max="${iso(TODAY)}" onchange="DAY=this.value;render()"><button class="iconbtn" aria-label="Next day" onclick="if(DAY<iso(TODAY)){DAY=iso(addDays(parse(DAY),1));render()}">${ic('right')}</button>${DAY!==iso(TODAY)?`<button class="btn sm ghost" onclick="DAY=iso(TODAY);render()">Today</button>`:''}</div>
<div class="field"><label for="fM">Office</label>${officeSel('fM',F.m)}</div>
<div class="field"><label for="fQ">Search</label><div class="search">${ic('search')}<input id="fQ" value="${esc(F.q)}" placeholder="Name, ID or department"></div></div>
<button class="btn" onclick="F.m=$('#fM').value;F.q=$('#fQ').value.trim();render()">Apply</button></div>
<div class="card-b" style="padding-top:0"><div class="seg">${Object.entries(groups).map(([k,[l,f]])=>`<button class="${cur===k?'on':''}" onclick="F.st='${k}';render()">${l}<span class="n">${all.filter(f).length}</span></button>`).join('')}</div></div></div>
<div class="card"><div class="tw"><table><thead><tr><th>Employee</th><th>Office</th><th>Shift</th><th>Clock in</th><th>Clock out</th><th>Worked</th><th>Late</th><th>Overtime</th><th>Status</th><th>Comment</th><th></th></tr></thead><tbody>
${rows.map(r=>`<tr><td>${nameCell(r.s,esc(r.s.des)+' · ID '+r.s.u)}</td><td>${mName(r.s.m)}</td><td class="mute">${r.shift.in}–${r.shift.out}</td>
<td><b>${r.cin||'—'}</b></td><td>${r.cout?`<b>${r.cout}</b>`:r.atWork?'<span class="tag t-blue">At work</span>':r.missingOut?'<span class="tag t-bad">Missing</span>':'—'}${r.fixed?' <span class="tag t-plum" title="Corrected by HR">Fixed</span>':''}</td>
<td>${r.hours!=null?fmt(r.hours):''}</td><td>${r.late?`<span class="tag t-warn">${fmt(r.late)}</span>`:''}</td><td>${r.ot?`<span class="tag t-ok">${fmt(r.ot)}</span>`:''}</td>
<td>${code(r.st)} <span class="mute" style="font-size:12px">${CODES[r.st]||'Not in yet'}</span></td><td style="white-space:normal;max-width:220px;color:var(--ink-2);font-size:13px">${esc(r.comment)}</td>
<td><button class="btn sm ghost" onclick="editDay(${r.s.sid},'${r.ds}')">Edit</button></td></tr>`).join('')||`<tr><td colspan="11" class="empty">No one in "${groups[cur][0]}" for this day.</td></tr>`}
</tbody></table></div></div>`};

V.report=()=>{
  const list=tracked().sort((a,b)=>a.name.localeCompare(b.name));
  if(!list.length){setTop('Employee report','');return `<div class="card empty">No tracked employees yet. Add a machine, sync it, then choose who to track.</div>`}
  if(!REP||!list.find(s=>s.sid===REP))REP=list[0].sid;
  const s=S.staff.find(x=>x.sid===REP),sh=shiftOf(s),days=monthDays(RMON),rs=days.map(d=>dayRow(s,d)),t=tally(rs);
  setTop('Employee report',`${monLabel(RMON)} attendance for one person`,`<button class="btn ghost" onclick="window.print()" title="Choose 'Save as PDF' in the print window">${ic('pdf')}Download PDF</button>${exportBtn('/export/report?'+qs({sid:s.sid,m:RMON}))}`);
  const first=parse(days[0]);const pad=(first.getDay()+6)%7;
  const tile=(lab,val,sub,col='')=>`<div class="card kpi"><div class="lab">${lab}</div><div class="val" style="${col?'color:'+col:''}">${val}</div><div class="foot">${sub}</div></div>`;
  return `<div class="card"><div class="card-b bar-f">
<div class="field" style="flex:1;min-width:220px"><label for="rEmp">Employee</label><select id="rEmp" onchange="REP=+this.value;render()">${S.machines.map(m=>`<optgroup label="${m.name}">${list.filter(x=>x.m===m.id).map(x=>`<option value="${x.sid}" ${x.sid===REP?'selected':''}>${esc(x.name)} · ID ${x.u}</option>`).join('')}</optgroup>`).join('')}</select></div>
<div class="field"><label for="rMon">Month</label><div class="datenav"><button class="iconbtn" aria-label="Previous month" onclick="const d=parse(RMON+'-01');d.setMonth(d.getMonth()-1);RMON=iso(d).slice(0,7);render()">${ic('left')}</button><input id="rMon" type="month" value="${RMON}" onchange="RMON=this.value;render()"><button class="iconbtn" aria-label="Next month" onclick="const d=parse(RMON+'-01');d.setMonth(d.getMonth()+1);RMON=iso(d).slice(0,7);render()">${ic('right')}</button></div></div></div></div>
<div class="card"><div class="prof"><span class="av lg">${initials(s.name)}</span><div style="min-width:0"><h2>${esc(s.name)}</h2>
<div style="color:var(--ink-2);font-weight:600">${esc(s.des)} · ${esc(s.dep)}</div>
<div class="meta"><span><b>Office</b>${mName(s.m)}</span><span><b>Machine ID</b>${s.u}</span><span><b>Timing</b>${sh.in}–${sh.out}${s.sin?'':' (default)'}</span><span><b>Grace</b>${sh.grace} min</span><span><b>Overtime</b>${s.ot?'Eligible':'Not eligible'}</span></div></div>
<div class="ring" style="--p:${t.pct}"><div><div><b>${t.pct}%</b><br><span>attendance</span></div></div></div>
<button class="btn sm ghost" onclick="editEmp(${s.sid})">Edit employee</button></div></div>
<div class="grid g4">
${tile('Days present',t.P+t.L,`${t.P} on time · ${t.L} late`)}
${tile('Absent',t.A,t.A?'Days with no punch and no reason':'No absences',t.A?'var(--bad)':'')}
${tile('Late total',fmt(t.late)||'0h 00m',`across ${t.L} day${t.L===1?'':'s'}`)}
${tile(s.ot?'Overtime':'Hours worked',s.ot?(fmt(t.ot)||'0h 00m'):fmt(t.hours),s.ot?`${t.otDays} OT day${t.otDays===1?'':'s'} · ${fmt(t.hours)} worked`:`average ${t.P+t.L?fmt(Math.round(t.hours/Math.max(1,(t.P+t.L)))):'—'} a day`)}
</div>
<div class="card"><div class="card-h"><h3>${monLabel(RMON)}</h3><div class="legend" style="margin-left:auto">${['P','L','A','H','S','E','WH','WO'].map(c=>`<span>${code(c)} ${t[c]}</span>`).join('')}</div></div>
<div class="card-b"><div class="cal">${WD.map(d=>`<div class="wd">${d}</div>`).join('')}${'<div class="day blank"></div>'.repeat(pad)}
${days.map((d,i)=>{const r=rs[i];if(!r)return `<div class="day future"><div class="dn">${+d.slice(8)}</div></div>`;
 return `<button class="day ${r.st==='WO'?'wo':''}" onclick="editDay(${s.sid},'${d}')" aria-label="${nice(d)}: ${CODES[r.st]||'no status'}"><div class="dn">${+d.slice(8)} ${code(r.st)}</div>
 <div class="tm">${r.cin?`${r.cin} <em>→</em> ${r.cout||(r.atWork?'now':'<span style="color:var(--bad)">?</span>')}`:'&nbsp;'}${r.late?`<br><span style="color:var(--warn)">late ${fmtS(r.late)}</span>`:''}${r.ot?`<br><span style="color:var(--ok)">OT ${fmtS(r.ot)}</span>`:''}</div>
 ${r.comment?`<div class="cm" title="${esc(r.comment)}">● ${esc(r.comment)}</div>`:''}</button>`}).join('')}</div></div></div>
<div class="card"><div class="card-h"><h3>Daily log</h3><span class="sub">every day this month</span></div><div class="tw" style="max-height:none"><table><thead><tr><th>Date</th><th>Status</th><th>In</th><th>Out</th><th>Worked</th><th>Late</th><th>Left early</th><th>OT</th><th>Comment</th></tr></thead><tbody>
${rs.filter(Boolean).map(r=>`<tr><td><b>${short(r.ds)}</b> <span class="mute">${WD[wday(r.ds)]}</span></td><td>${code(r.st)} <span class="mute" style="font-size:12px">${CODES[r.st]||''}</span></td><td>${r.cin||'—'}</td><td>${r.cout||(r.missingOut?'<span class="tag t-bad">Missing</span>':r.atWork?'<span class="tag t-blue">At work</span>':'—')}</td><td>${fmt(r.worked)}</td><td>${r.late?`<span class="tag t-warn">${fmt(r.late)}</span>`:''}</td><td>${r.early?`<span class="tag t-warn">${fmt(r.early)}</span>`:''}</td><td>${r.ot?`<span class="tag t-ok">${fmt(r.ot)}</span>`:''}</td><td style="white-space:normal;color:var(--ink-2)">${esc(r.comment)}</td></tr>`).join('')}
</tbody></table></div></div>`};

V.ot=()=>{
  const days=monthDays(MON);const st=tracked().filter(s=>s.ot&&(!F.m||s.m==F.m));
  const per=st.map(s=>{const rs=days.map(d=>dayRow(s,d)).filter(r=>r&&r.ot);return {s,rs,t:rs.reduce((a,r)=>a+r.ot,0)}}).sort((a,b)=>b.t-a.t);
  const total=per.reduce((a,p)=>a+p.t,0),max=Math.max(1,...per.map(p=>p.t));
  setTop('Overtime',`${monLabel(MON)} · ${st.length} OT-eligible employees`,exportBtn('/export/ot?'+qs({m:MON,office:F.m})));
  return `<div class="card"><div class="card-b bar-f">
<div class="field"><label for="oMon">Month</label><div class="datenav"><button class="iconbtn" aria-label="Previous month" onclick="shiftMon(-1)">${ic('left')}</button><input id="oMon" type="month" value="${MON}" onchange="MON=this.value;render()"><button class="iconbtn" aria-label="Next month" onclick="shiftMon(1)">${ic('right')}</button></div></div>
<div class="field"><label for="fM">Office</label>${officeSel('fM',F.m)}</div><button class="btn" onclick="F.m=$('#fM').value;render()">Apply</button>
<span class="mute" style="margin-left:auto;max-width:420px;font-size:12.5px">OT is time after the person's office-out time, counted from ${S.settings.ot_min} minutes. On WO days all worked time is OT.</span></div></div>
<div class="grid g3">
<div class="card kpi"><div class="lab">Total overtime</div><div class="val">${fmt(total)||'0h'}</div><div class="foot">${(total/60).toFixed(1)} hours for payroll</div></div>
<div class="card kpi"><div class="lab">People with OT</div><div class="val">${per.filter(p=>p.t).length} <small>/ ${st.length}</small></div><div class="foot">OT-eligible staff</div></div>
<div class="card kpi"><div class="lab">Highest</div><div class="val" style="font-size:22px">${per[0]&&per[0].t?esc(per[0].s.name):'—'}</div><div class="foot">${per[0]&&per[0].t?fmt(per[0].t):''}</div></div></div>
<div class="card"><div class="card-h"><h3>OT per employee</h3></div><div class="tw"><table><thead><tr><th>Employee</th><th>Office</th><th>OT days</th><th style="width:34%">Total OT</th><th>Hours (decimal)</th></tr></thead><tbody>
${per.map(p=>`<tr><td>${nameCell(p.s)}</td><td>${mName(p.s.m)}</td><td>${p.rs.length}</td><td><div style="display:flex;gap:10px;align-items:center"><div class="bar" style="flex:1"><i style="width:${p.t/max*100}%;background:var(--orange)"></i></div><b style="min-width:70px">${fmt(p.t)||'0h 00m'}</b></div></td><td>${(p.t/60).toFixed(2)}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">No OT-eligible employees. Switch on Overtime for someone on the Employees page.</td></tr>'}
</tbody></table></div></div>
<div class="card"><div class="card-h"><h3>OT by day</h3></div><div class="tw"><table><thead><tr><th>Date</th><th>Employee</th><th>In</th><th>Out</th><th>Office out</th><th>OT</th><th>Comment</th></tr></thead><tbody>
${per.flatMap(p=>p.rs).sort((a,b)=>b.ds.localeCompare(a.ds)).map(r=>`<tr><td><b>${short(r.ds)}</b> <span class="mute">${WD[wday(r.ds)]}</span></td><td>${esc(r.s.name)}</td><td>${r.cin}</td><td>${r.cout}</td><td class="mute">${isOff(r.ds)?'Off day':r.shift.out}</td><td><span class="tag t-ok">${fmt(r.ot)}</span></td><td style="white-space:normal;color:var(--ink-2)">${esc(r.comment)}</td></tr>`).join('')||'<tr><td colspan="7" class="empty">No overtime this month.</td></tr>'}
</tbody></table></div></div>`};

V.attention=()=>{const a=attention();
  setTop('Needs attention','Recent days HR should check: missing clock-outs, unexplained absences and very late arrivals');
  const grp={out:'No clock-out punch',abs:'Absent, no reason recorded',late:'Late by an hour or more'};
  return Object.entries(grp).map(([k,l])=>{const items=a.filter(x=>x.kind===k);return `<div class="card"><div class="card-h"><h3>${l}</h3><span class="tag ${items.length?'t-warn':'t-ok'}">${items.length}</span></div>
${items.map(x=>`<div class="list-item"><span class="av">${initials(x.r.s.name)}</span><div class="grow"><b>${esc(x.r.s.name)}</b><span>${nice(x.r.ds)} · ${mName(x.r.s.m)}${x.r.cin?' · in '+x.r.cin:''}</span></div>
${k==='abs'?['S','E','H','WH'].map(c=>`<button class="btn sm ghost" title="Mark ${CODES[c]}" onclick="quickSet(${x.r.s.sid},'${x.r.ds}','${c}')">${code(c)}</button>`).join(''):''}
<button class="btn sm ghost" onclick="editDay(${x.r.s.sid},'${x.r.ds}')">${k==='out'?'Add clock-out':'Open'}</button></div>`).join('')||'<div class="empty">All clear.</div>'}</div>`}).join('')};
async function quickSet(sid,ds,c){const s=S.staff.find(x=>x.sid===sid),k=key(s.m,s.u,ds),n={...(S.notes[k]||{fin:'',fout:'',comment:''}),status:c};
  await api('/api/note',{m:s.m,u:s.u,day:ds,...n});S.notes[k]=n;toast(`${s.name}: ${short(ds)} marked ${CODES[c]}.`);render()}

V.employees=()=>{
  const list=S.staff.filter(s=>(!EMPF.m||s.m==EMPF.m)&&(EMPF.show==='all'||(EMPF.show==='tracked'?s.track&&s.active:!s.track||!s.active))&&(!EMPF.q||[s.u,s.name,s.des,s.dep].join(' ').toLowerCase().includes(EMPF.q.toLowerCase()))).sort((a,b)=>a.m-b.m||a.u-b.u);
  const cnt=f=>S.staff.filter(s=>(!EMPF.m||s.m==EMPF.m)&&f(s)).length;
  setTop('Employees',`Each employee is an office + machine ID. Company default timing ${S.settings.d_in}–${S.settings.d_out}, ${S.settings.grace} min grace.`);
  return `<div class="card"><div class="card-b bar-f">
<div class="seg">${[['tracked','Tracked',s=>s.track&&s.active],['hidden','Not tracked',s=>!s.track||!s.active],['all','Everyone on machines',()=>true]].map(([k,l,f])=>`<button class="${EMPF.show===k?'on':''}" onclick="EMPF.show='${k}';SEL.clear();render()">${l}<span class="n">${cnt(f)}</span></button>`).join('')}</div>
<div class="field"><label for="eM">Office</label>${officeSel('eM',EMPF.m)}</div>
<div class="field"><label for="eQ">Search</label><div class="search">${ic('search')}<input id="eQ" value="${esc(EMPF.q)}" placeholder="Name, ID, designation"></div></div>
<button class="btn" onclick="EMPF.m=$('#eM').value;EMPF.q=$('#eQ').value.trim();render()">Apply</button></div></div>
<div class="card"><div class="tw" style="max-height:none"><table><thead><tr><th style="width:36px"><input type="checkbox" aria-label="Select all" ${list.length&&list.every(s=>SEL.has(s.sid))?'checked':''} onchange="list_toggle(this.checked)"></th><th>Employee</th><th>Office · ID</th><th>Department</th><th>Timing</th><th>Rules</th><th>Tracked</th><th></th></tr></thead><tbody>
${list.map(s=>`<tr style="${s.track&&s.active?'':'opacity:.62'}"><td><input type="checkbox" aria-label="Select ${esc(s.name)}" ${SEL.has(s.sid)?'checked':''} onchange="this.checked?SEL.add(${s.sid}):SEL.delete(${s.sid});render()"></td>
<td>${s.track?nameCell(s):`<div class="who"><span class="av">${initials(s.name)}</span><div><b style="font-weight:600">${esc(s.name)}</b><span class="sub">On machine, not tracked</span></div></div>`}</td>
<td>${mName(s.m)} <span class="tag t-mute">ID ${s.u}</span></td><td>${esc(s.dep)||'<span class="mute">—</span>'}</td>
<td>${s.sin?`<span class="tag t-plum">${s.sin}–${s.sout}${s.grace!=null?' · '+s.grace+'m':''}</span>`:'<span class="mute">Default</span>'}</td>
<td>${s.track?`${s.late?'<span class="tag t-warn">Late</span> ':''}${s.hours?'<span class="tag t-blue">Hours</span> ':''}${s.ot?'<span class="tag t-ok">OT</span>':''}`:''}</td>
<td><input type="checkbox" class="switch" aria-label="Track ${esc(s.name)}" ${s.track?'checked':''} onchange="setTrack(${s.sid},this.checked)"></td>
<td><button class="btn sm ghost" onclick="editEmp(${s.sid})">Edit</button></td></tr>`).join('')||'<tr><td colspan="8" class="empty">No employees here.</td></tr>'}
</tbody></table></div></div>
${SEL.size?`<div class="bulk"><b>${SEL.size} selected</b>
<select id="bA" aria-label="Bulk action"><option value="">Choose an action…</option><option value="track1">Track attendance</option><option value="track0">Stop tracking</option><option value="ot1">Overtime on</option><option value="ot0">Overtime off</option><option value="late1">Late tracking on</option><option value="late0">Late tracking off</option><option value="time">Set custom timing…</option><option value="def">Use company default timing</option></select>
<button class="btn or sm" onclick="bulkDo()">Apply</button><button class="btn sm" style="background:var(--plum-2)" onclick="SEL.clear();render()">Clear</button></div>`:''}`};
function list_toggle(on){document.querySelectorAll('tbody input[type=checkbox]:not(.switch)').forEach(()=>{});const vis=S.staff.filter(s=>(!EMPF.m||s.m==EMPF.m)&&(EMPF.show==='all'||(EMPF.show==='tracked'?s.track&&s.active:!s.track||!s.active)));vis.forEach(s=>on?SEL.add(s.sid):SEL.delete(s.sid));render()}
async function setTrack(sid,on){const s=S.staff.find(x=>x.sid===sid);await api('/api/staff/'+sid,{track:on?1:0});s.track=on?1:0;toast(on?`${s.name} is now tracked.`:`${s.name} hidden from sheets. History is kept.`);render()}
async function bulkSet(ids,set){await api('/api/staff/bulk',{ids,set});S.staff.filter(s=>ids.includes(s.sid)).forEach(s=>Object.assign(s,set))}
async function bulkDo(){const a=$('#bA').value;if(!a)return toast('Choose an action first.');const ids=[...SEL];
  if(a==='time'){openDrawer('Set timing',`${ids.length} employees`,`<div class="grid g3"><div class="field"><label for="tI">Office in</label><input id="tI" type="time" value="${S.settings.d_in}"></div><div class="field"><label for="tO">Office out</label><input id="tO" type="time" value="${S.settings.d_out}"></div><div class="field"><label for="tG">Grace (min)</label><input id="tG" type="number" min="0" value="${S.settings.grace}"></div></div>`,
    async()=>{await bulkSet(ids,{sin:$('#tI').value,sout:$('#tO').value,grace:+$('#tG').value});toast(`Timing set for ${ids.length} employees.`);SEL.clear()});return}
  const set=a==='def'?{sin:'',sout:'',grace:null}:{[{track:'track',ot:'ot',late:'late'}[a.slice(0,-1)]]:+a.slice(-1)};
  await bulkSet(ids,set);toast(`Updated ${ids.length} employees.`);SEL.clear();render()}

V.machines=()=>{setTop('Machines','Every ZKTeco MB20 the portal reads from. Choose which enrolled people count for attendance.',`<button class="btn or" onclick="editMachine()">+ Add machine</button>`);
  if(!S.machines.length)return `<div class="card empty" style="padding:48px">No machines yet. Click <b>Add machine</b> and enter the office's public IP, port 4370 and Comm Key.</div>`;
  return `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr))">${S.machines.map(m=>{const all=S.staff.filter(s=>s.m===m.id),tr=all.filter(s=>s.track&&s.active);
  const state=!m.enabled?['t-mute','Disabled']:m.ok==null?['t-mute','Not synced yet']:m.ok?['t-ok','Online']:['t-bad','Not reachable'];
  return `<div class="card mc" style="${m.enabled?'':'opacity:.65'}"><div class="row1"><span class="dot ${m.ok===false?'bad':''}" style="${m.ok==null||!m.enabled?'background:#c9b4cc':''}"></span><b>${esc(m.name)}</b><span class="tag ${state[0]}" style="margin-left:auto">${state[1]}</span></div>
<div class="mono">${esc(m.ip)}:${m.port}${m.udp?' (UDP)':''} · Comm Key ${m.key?'set':'not set'}${m.serial?' · '+esc(m.serial):''}</div>
<div class="nums"><div><b>${all.length}</b><span>On machine</span></div><div><b style="color:var(--ok)">${tr.length}</b><span>Tracked</span></div><div><b style="color:var(--mute)">${all.length-tr.length}</b><span>Ignored</span></div></div>
<div style="font-size:12.5px;color:${m.ok===false?'var(--bad)':'var(--mute)'}">${m.lastSync?(m.ok?'Last sync '+parse(m.lastSync.slice(0,10)).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})+' '+m.lastSync.slice(11,16)+' · ':'')+esc(m.msg):'Click Sync to load people and punches.'}</div>
<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" onclick="manage(${m.id})" ${all.length?'':'disabled title="Sync first"'}>Choose tracked people</button><button class="btn sm ghost" onclick="syncNow(${m.id},this)">${ic('sync')}Sync</button><button class="btn sm ghost" onclick="testMachine(${m.id},this)">Test</button><button class="btn sm ghost" onclick="editMachine(${m.id})">Edit</button></div></div>`}).join('')}</div>`};
async function testMachine(id,b){b.disabled=true;b.innerHTML='<span class="spin"></span>Testing';try{const r=await api(`/api/machines/${id}/test`,{});toast(r.msg)}finally{b.disabled=false;b.textContent='Test'}}
function manage(mid){const m=S.machines.find(x=>x.id===mid),all=S.staff.filter(s=>s.m===mid).sort((a,b)=>a.u-b.u);
  openDrawer(`${esc(m.name)}: who to track`,`${all.length} people enrolled on this machine. Only tracked people appear on sheets, reports and absence counts.`,
  `<div class="optrow" style="background:var(--plum-soft);border-radius:10px;padding:10px 12px;border:0"><div class="grow"><b>New people found on this machine</b><span>When someone new is enrolled, should they be tracked straight away?</span></div><select id="nT"><option value="0" ${m.newTrack?'':'selected'}>Wait until I switch them on</option><option value="1" ${m.newTrack?'selected':''}>Track automatically</option></select></div>
<div style="display:flex;gap:8px"><button class="btn sm ghost" onclick="document.querySelectorAll('.trk').forEach(c=>c.checked=true)">Track all</button><button class="btn sm ghost" onclick="document.querySelectorAll('.trk').forEach(c=>c.checked=false)">Track none</button></div>
<div>${all.map(s=>`<label class="optrow" for="tk${s.sid}"><span class="av">${initials(s.name)}</span><div class="grow"><b>${esc(s.name)}</b><span>ID ${s.u}${s.des?' · '+esc(s.des):''}</span></div><input type="checkbox" class="switch trk" id="tk${s.sid}" data-sid="${s.sid}" ${s.track?'checked':''}></label>`).join('')}</div>`,
  async()=>{const track={};document.querySelectorAll('.trk').forEach(c=>track[c.dataset.sid]=c.checked?1:0);const newTrack=$('#nT').value==='1';
    await api(`/api/machines/${mid}/tracking`,{newTrack,track});m.newTrack=newTrack;S.staff.forEach(s=>{if(track[s.sid]!=null)s.track=track[s.sid]});
    toast(`${m.name}: ${Object.values(track).filter(Boolean).length} people tracked.`)})}
function editMachine(id){const m=S.machines.find(x=>x.id===id)||{port:4370,key:0,udp:0,newTrack:0,enabled:1};
  openDrawer(id?'Edit machine':'Add machine',id?esc(m.name):'Connect a ZKTeco MB20 at one of your offices',`<div class="field"><label for="aN">Office name</label><input id="aN" value="${esc(m.name||'')}" placeholder="e.g. Head Office"></div>
<div class="field"><label for="aI">Public IP address</label><input id="aI" value="${esc(m.ip||'')}" placeholder="203.0.113.10"></div><div class="grid g2"><div class="field"><label for="aP">Port</label><input id="aP" type="number" value="${m.port}"></div><div class="field"><label for="aK">Comm Key</label><input id="aK" type="number" value="${m.key}"></div></div>
<label class="optrow" for="aU"><div class="grow"><b>Use UDP</b><span>Only if the normal connection fails</span></div><input id="aU" type="checkbox" class="switch" ${m.udp?'checked':''}></label>
<label class="optrow" for="aT"><div class="grow"><b>Track new people automatically</b><span>Off: you choose who counts after the first sync</span></div><input id="aT" type="checkbox" class="switch" ${m.newTrack?'checked':''}></label>
${id?`<label class="optrow" for="aE"><div class="grow"><b>Enabled</b><span>Off: stop syncing this machine. History is kept.</span></div><input id="aE" type="checkbox" class="switch" ${m.enabled?'checked':''}></label>`:''}
<p class="mute" style="font-size:12.5px;margin:0">The branch router must forward port ${m.port} to the machine's local IP. On the MB20: Menu → Comm. → Ethernet shows the local IP.</p>`,
async()=>{const n=$('#aN').value.trim(),ip=$('#aI').value.trim();if(!n||!ip){toast('Enter an office name and IP address.');return false}
  await api('/api/machines',{id,name:n,ip,port:+$('#aP').value||4370,key:+$('#aK').value||0,udp:$('#aU').checked,newTrack:$('#aT').checked,enabled:id?($('#aE').checked?1:0):1});
  await boot();toast(id?'Machine saved.':`${n} added. Click Test, then Sync to load its people.`)})}

V.punches=()=>{const list=(S.raw[DAY]||[]).filter(p=>!F.m||F.m==p.m).map(p=>({...p,s:S.staff.find(x=>x.m==p.m&&x.u===p.u)||{u:p.u,name:'ID '+p.u,track:0}}));
  setTop('Raw punches','Exactly what the machines recorded, including people who are not tracked',exportBtn('/export/punches?'+qs({d:DAY})));
  return `<div class="card"><div class="card-b bar-f"><div class="datenav"><button class="iconbtn" aria-label="Previous day" onclick="DAY=iso(addDays(parse(DAY),-1));render()">${ic('left')}</button><input type="date" value="${DAY}" max="${iso(TODAY)}" onchange="DAY=this.value;render()"><button class="iconbtn" aria-label="Next day" onclick="if(DAY<iso(TODAY)){DAY=iso(addDays(parse(DAY),1));render()}">${ic('right')}</button></div>
<div class="field"><label for="fM">Office</label>${officeSel('fM',F.m)}</div><button class="btn" onclick="F.m=$('#fM').value;render()">Apply</button><span class="mute" style="margin-left:auto">${list.length} punches on ${nice(DAY)}</span></div></div>
<div class="card"><div class="tw"><table><thead><tr><th>Time</th><th>Office</th><th>Machine ID</th><th>Name</th><th>Tracked</th></tr></thead><tbody>
${list.map(p=>`<tr><td><b>${p.t}</b></td><td>${mName(p.m)}</td><td>${p.u}</td><td>${esc(p.s.name)}</td><td>${p.s.track?'<span class="tag t-ok">Yes</span>':'<span class="tag t-mute">No</span>'}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">No punches on this day.</td></tr>'}</tbody></table></div></div>`};

V.settings=()=>{const st=S.settings;setTop('Settings','Company-wide rules. Individual timing is set per employee.');
  return `<div class="grid g2">
<div class="card"><div class="card-h"><h3>Office timing</h3></div><div class="card-b" style="display:flex;flex-direction:column;gap:14px">
<div class="grid g3"><div class="field"><label for="si">Office in</label><input id="si" type="time" value="${st.d_in}"></div><div class="field"><label for="so">Office out</label><input id="so" type="time" value="${st.d_out}"></div><div class="field"><label for="sg">Grace (minutes)</label><input id="sg" type="number" min="0" value="${st.grace}"></div></div>
<label class="optrow" for="sh2"><div class="grow"><b>Short days count as Half day (H)</b><span>When someone works less than half their shift</span></div><input id="sh2" type="checkbox" class="switch" ${st.short_h?'checked':''}></label></div></div>
<div class="card"><div class="card-h"><h3>Sync</h3></div><div class="card-b" style="display:flex;flex-direction:column;gap:14px">
<label class="optrow" for="sa"><div class="grow"><b>Sync automatically</b><span>Pull new punches from every machine</span></div><input id="sa" type="checkbox" class="switch" ${st.auto?'checked':''}></label>
<div class="field"><label for="sh">Every</label><select id="sh">${[1,2,3,4,6,12].map(h=>`<option value="${h}" ${st.sync_hours===h?'selected':''}>${h} hour${h>1?'s':''}</option>`).join('')}</select></div></div></div>
<div class="card"><div class="card-h"><h3>Weekly off & overtime</h3></div><div class="card-b" style="display:flex;flex-direction:column;gap:14px">
<div class="field"><label>Weekly off days</label><div class="chips">${WD.map((d,i)=>`<label class="chip ${st.off.includes(i)?'on':''}"><input type="checkbox" class="woff" value="${i}" ${st.off.includes(i)?'checked':''} onchange="this.parentNode.classList.toggle('on',this.checked)" style="display:none">${d}</label>`).join('')}</div></div>
<div class="field"><label for="som">Count overtime from (minutes after office out)</label><input id="som" type="number" min="0" value="${st.ot_min}" style="max-width:160px"></div></div></div>
<div class="card"><div class="card-h"><h3>Company holidays</h3><span class="sub">marked WO for everyone</span></div><div class="card-b" style="display:flex;flex-direction:column;gap:12px">
<div class="chips">${st.holidays.slice().sort().map(h=>`<span class="chip">${nice(h)}<button class="iconbtn" style="width:22px;height:22px;border:0" aria-label="Remove ${h}" onclick="S.settings.holidays=S.settings.holidays.filter(x=>x!=='${h}');saveSettings(true)">${ic('x')}</button></span>`).join('')||'<span class="mute">No holidays added.</span>'}</div>
<div class="bar-f"><div class="field"><label for="hd">Add a holiday</label><input id="hd" type="date"></div><button class="btn ghost" onclick="const v=$('#hd').value;if(v&&!S.settings.holidays.includes(v)){S.settings.holidays.push(v);saveSettings(true)}">Add</button></div></div></div>
<div class="card"><div class="card-h"><h3>Logo & company name</h3></div><div class="card-b" style="display:flex;flex-direction:column;gap:14px">
<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap"><div style="background:var(--plum);border-radius:10px;padding:12px 16px;min-height:62px;display:grid;place-items:center">${PORTAL.hasLogo?'<img src="/logo?'+Date.now()+'" alt="" style="max-height:40px;max-width:180px">':'<span style="color:#fff;font-weight:800">Rapid<span style="color:var(--orange)">Ex</span></span>'}</div>
<label class="btn ghost" for="lg">Upload logo</label><input id="lg" type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" hidden onchange="uploadLogo(this)">${PORTAL.hasLogo?'<button class="btn link sm" onclick="removeLogo()">Remove</button>':''}</div>
<span class="mute" style="font-size:12.5px">Shown in the sidebar and on the sign-in page. A light or white logo looks best on the plum background.</span>
<div class="field"><label for="sc">Company name (Excel titles)</label><input id="sc" value="${esc(st.company||'RapidEx')}"></div></div></div>
<div class="card"><div class="card-h"><h3>Logins</h3><span class="sub">people who can open this portal</span></div><div class="card-b" style="display:flex;flex-direction:column;gap:12px" id="usersBox"><span class="mute">Loading…</span></div></div>
</div><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn or" onclick="saveSettings()">Save settings</button></div>`};
async function loadUsers(){const box=$('#usersBox');if(!box)return;const j=await api('/api/users');
  box.innerHTML=`${j.users.map(u=>`<div class="optrow"><span class="av">${initials(u)}</span><div class="grow"><b>${esc(u)}</b><span>${u===S.user?'You':'HR login'}</span></div>${u===S.user?`<button class="btn sm ghost" onclick="changePw()">Change password</button>`:`<button class="btn sm ghost" onclick="delUser('${esc(u)}')">Remove</button>`}</div>`).join('')}
  <div class="bar-f"><div class="field"><label for="nu">New username</label><input id="nu" autocomplete="off"></div><div class="field"><label for="np">Password (8+)</label><input id="np" type="password" autocomplete="new-password"></div><button class="btn ghost" onclick="addUser()">Add login</button></div>`}
async function addUser(){await api('/api/users',{username:$('#nu').value.trim(),password:$('#np').value});toast('Login added.');loadUsers()}
async function delUser(u){if($('#del-'+u)){await api('/api/users',{delete:u});toast('Login removed.');loadUsers();return}
  const b=[...document.querySelectorAll('#usersBox .btn')].find(x=>x.getAttribute('onclick')===`delUser('${u}')`);if(b){b.id='del-'+u;b.textContent='Click again to remove';b.classList.add('or')}}
function changePw(){openDrawer('Change password',esc(S.user),`<div class="field"><label for="p1">Current password</label><input id="p1" type="password" autocomplete="current-password"></div><div class="field"><label for="p2">New password (8+ characters)</label><input id="p2" type="password" autocomplete="new-password"></div>`,
  async()=>{await api('/api/password',{current:$('#p1').value,new:$('#p2').value});toast('Password changed.')})}
async function uploadLogo(inp){const f=inp.files[0];if(!f)return;const fd=new FormData();fd.append('file',f);const r=await fetch('/api/logo',{method:'POST',body:fd});const j=await r.json().catch(()=>({}));
  if(!r.ok)return toast(j.error||'Upload failed.');PORTAL.hasLogo=true;toast('Logo updated.');render()}
async function removeLogo(){const fd=new FormData();fd.append('remove','1');await fetch('/api/logo',{method:'POST',body:fd});PORTAL.hasLogo=false;render()}
async function saveSettings(quiet){const g=id=>$(id);const st=S.settings;
  const v={holidays:st.holidays};
  if(g('#si'))Object.assign(v,{d_in:g('#si').value,d_out:g('#so').value,grace:+g('#sg').value||0,short_h:g('#sh2').checked,auto:g('#sa').checked,sync_hours:+g('#sh').value,ot_min:+g('#som').value||0,off:[...document.querySelectorAll('.woff:checked')].map(c=>+c.value),company:g('#sc').value.trim()||'RapidEx'});
  await api('/api/settings',v);Object.assign(st,v);toast(quiet?'Holidays updated.':'Settings saved. Sheets recalculated.');render()}

// ================================================================ drawer + edits
let dSave=null;
function openDrawer(title,sub,body,onSave){dSave=onSave||null;
  $('#drawer').innerHTML=`<div class="scrim" onclick="closeD()"></div><aside class="drawer" role="dialog" aria-label="${esc(title)}"><div class="dh"><div style="flex:1;min-width:0"><h3>${title}</h3><p>${sub}</p></div><button class="iconbtn" aria-label="Close" onclick="closeD()">${ic('x')}</button></div>
<div class="db">${body}</div>${onSave?`<div class="df"><button class="btn ghost" onclick="closeD()">Cancel</button><button class="btn or" id="dSaveBtn" onclick="doSave(this)">Save</button></div>`:''}</aside>`;
  setTimeout(()=>$('.drawer input,.drawer select,.drawer button')?.focus(),0)}
function closeD(){$('#drawer').innerHTML='';dSave=null}
async function doSave(b){b.disabled=true;try{const r=await dSave();if(r!==false){closeD();render()}}catch(e){}finally{if(b.isConnected)b.disabled=false}}
function editDay(sid,ds){const s=S.staff.find(x=>x.sid===sid),r=dayRow(s,ds),k=key(s.m,s.u,ds),n=S.notes[k]||{};
  openDrawer(esc(s.name),`${nice(ds)} · ${mName(s.m)} ID ${s.u}`,
  `<div class="facts"><div><span>Shift</span><b>${r.shift.in}–${r.shift.out}</b></div><div><span>Machine punches</span><b>${r.punches.join(', ')||'None'}</b></div><div><span>Worked</span><b>${r.worked!=null?fmtS(r.worked):'—'}</b></div></div>
<div class="field"><label>Status</label><div class="chips" id="stc"><button type="button" class="chip ${!n.status?'on':''}" data-v="" onclick="pickSt(this)">Automatic <span class="mute" style="font-weight:500">(${r.manual?'from punches':CODES[r.st]||'none yet'})</span></button>
${Object.keys(CODES).map(c=>`<button type="button" class="chip ${n.status===c?'on':''}" data-v="${c}" onclick="pickSt(this)">${code(c)}${CODES[c]}</button>`).join('')}</div></div>
<div class="grid g2"><div class="field"><label for="eIn">Clock in correction</label><input id="eIn" type="time" value="${n.fin||''}"></div><div class="field"><label for="eOut">Clock out correction</label><input id="eOut" type="time" value="${n.fout||''}"></div></div>
<span class="mute" style="font-size:12.5px;margin-top:-8px">Leave empty to use the machine punches.</span>
<div class="field"><label for="eC">Comment</label><textarea id="eC" rows="3" placeholder="e.g. Field visit to airport, approved by manager">${esc(n.comment||'')}</textarea></div>
<button class="btn link sm" style="align-self:flex-start" onclick="openReport(${sid})">Open ${esc(s.name.split(' ')[0])}'s monthly report →</button>`,
  async()=>{const v={status:$('#stc .chip.on').dataset.v,fin:$('#eIn').value,fout:$('#eOut').value,comment:$('#eC').value.trim()};await api('/api/note',{m:s.m,u:s.u,day:ds,...v});if(Object.values(v).some(Boolean))S.notes[k]=v;else delete S.notes[k];toast('Saved.')})}
function pickSt(b){document.querySelectorAll('#stc .chip').forEach(x=>x.classList.remove('on'));b.classList.add('on')}
function editEmp(sid){const s=S.staff.find(x=>x.sid===sid),st=S.settings;
  openDrawer(esc(s.name),`${mName(s.m)} · machine ID ${s.u}`,
  `<div class="field"><label for="xN">Name</label><input id="xN" value="${esc(s.name)}"></div>
<div class="grid g2"><div class="field"><label for="xD">Designation</label><input id="xD" value="${esc(s.des)}"></div><div class="field"><label for="xP">Department</label><input id="xP" list="deps" value="${esc(s.dep)}"><datalist id="deps">${[...new Set(S.staff.map(x=>x.dep).filter(Boolean))].map(d=>`<option>${esc(d)}</option>`).join('')}</datalist></div></div>
<div class="field"><label>Office timing</label><div class="seg" id="tmode"><button type="button" class="${s.sin?'':'on'}" onclick="tm(this,0)">Company default · ${st.d_in}–${st.d_out}</button><button type="button" class="${s.sin?'on':''}" onclick="tm(this,1)">Custom</button></div></div>
<div class="grid g3" id="tcust" ${s.sin?'':'hidden'}><div class="field"><label for="xI">In</label><input id="xI" type="time" value="${s.sin||st.d_in}"></div><div class="field"><label for="xO">Out</label><input id="xO" type="time" value="${s.sout||st.d_out}"></div><div class="field"><label for="xG">Grace</label><input id="xG" type="number" min="0" value="${s.grace??st.grace}"></div></div>
<div>${[['xT','track','Track attendance','Show on sheets, reports and absence counts'],['xL','late','Track late arrival','Marks L when in after office time + grace'],['xH','hours','Count working hours','Show hours worked each day'],['xO2','ot','Eligible for overtime','Appears on the Overtime page'],['xA','active','Active employee','Untick when someone leaves; history is kept']].map(([id,f,l,d])=>`<label class="optrow" for="${id}"><div class="grow"><b>${l}</b><span>${d}</span></div><input type="checkbox" class="switch" id="${id}" ${s[f]?'checked':''}></label>`).join('')}</div>`,
  async()=>{const c=$('#tmode .on')===$('#tmode').lastElementChild;const v={name:$('#xN').value.trim()||s.name,des:$('#xD').value.trim(),dep:$('#xP').value.trim(),sin:c?$('#xI').value:'',sout:c?$('#xO').value:'',grace:c?+$('#xG').value:null,track:+$('#xT').checked,late:+$('#xL').checked,hours:+$('#xH').checked,ot:+$('#xO2').checked,active:+$('#xA').checked};await api('/api/staff/'+sid,v);Object.assign(s,v);toast('Employee saved.')})}
function tm(b,c){b.parentNode.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on');$('#tcust').hidden=!c}
async function syncNow(id,btn){btn=btn||$('#syncBtn');const old=btn?.innerHTML;if(btn){btn.disabled=true;btn.innerHTML='<span class="spin"></span>Syncing…'}
  try{const j=await api('/api/sync',id?{id}:{});resetCache();await boot();
    const bad=j.results.filter(r=>!r.ok),n=j.results.reduce((a,r)=>a+r.new,0);
    toast(!j.results.length?'No machines to sync. Add one on the Machines page.':bad.length?`${j.results.length-bad.length} of ${j.results.length} synced (${n} new punches). Not reachable: ${bad.map(r=>r.name).join(', ')}.`:`Synced ${j.results.length>1?'all machines':j.results[0].name}: ${n} new punches.`)}
  finally{if(btn&&btn.isConnected){btn.disabled=false;btn.innerHTML=old}}render()}

// ================================================================ router
const NEEDS={dashboard:()=>[iso(addDays(TODAY,-7)),iso(TODAY)],month:()=>[MON+'-01',monthDays(MON).slice(-1)[0]],daily:()=>[DAY,DAY],
  report:()=>[RMON+'-01',monthDays(RMON).slice(-1)[0]],ot:()=>[MON+'-01',monthDays(MON).slice(-1)[0]],attention:()=>[iso(addDays(TODAY,-7)),iso(TODAY)]};
let renderId=0;
async function render(){const h=location.hash.slice(1);route=V[h]?h:'dashboard';const id=++renderId;
  try{const need=[NEEDS.attention()];if(NEEDS[route])need.push(NEEDS[route]());
    const missing=need.some(([a,b])=>range(a,b>iso(TODAY)?iso(TODAY):b).some(d=>!S.loaded.has(d)))||(route==='punches'&&!S.raw[DAY]);
    if(missing&&!$('#app .loading'))$('#app').insertAdjacentHTML('afterbegin','<div class="loading" style="padding:10px"><span class="spin"></span>Loading…</div>');
    for(const [a,b] of need)await ensure(a,b>iso(TODAY)?iso(TODAY):b);
    if(route==='punches'&&!S.raw[DAY])S.raw[DAY]=(await api('/api/raw?d='+DAY)).punches;
    if(id!==renderId)return;
    renderSide();$('#app').innerHTML=V[route]();if(route==='settings')loadUsers()}
  catch(e){console.error(e);if(id===renderId)$('#app').innerHTML=`<div class="card empty">Could not load attendance. <button class="btn sm ghost" onclick="render()">Try again</button></div>`}}
addEventListener('hashchange',()=>{closeD();SEL.clear();render();scrollTo(0,0)});
addEventListener('keydown',e=>{if(e.key==='Escape')closeD()});
(async()=>{try{await boot();DAY=iso(TODAY);MON=RMON=DAY.slice(0,7);await render()}catch(e){$('#app').innerHTML='<div class="card empty">Could not reach the portal server. Refresh the page.</div>'}})();
