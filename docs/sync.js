/* =========================================================
   SYNC — keeps Greek and Hebrew progress in a private GitHub gist,
   so the phone and the PC share it. No server: the browser talks to the
   GitHub API with a personal access token that has only the "gist" scope.
   ========================================================= */
const SYNC_KEY="koine-sync",SYNC_FILE="koine-trainer-progress.json",GH="https://api.github.com";
const LANG_KEYS=["koine-trainer-v2","hebrew-trainer-v1"];
let SY=(()=>{try{return JSON.parse(localStorage.getItem(SYNC_KEY))||{};}catch(e){return {};}})();
let syncBusy=false,syncTimer=null,syncMsg="";
const syncSave=()=>{try{localStorage.setItem(SYNC_KEY,JSON.stringify(SY));}catch(e){}};
const syncOn=()=>!!(SY.token&&SY.gist);
async function gh(path,opt={}){
  const r=await fetch(GH+path,Object.assign({},opt,{headers:Object.assign({"Authorization":"Bearer "+SY.token,"Accept":"application/vnd.github+json"},opt.body?{"Content-Type":"application/json"}:{})}));
  if(r.status===401)throw new Error("The key was rejected. It may have been deleted or expired; connect again with a new one.");
  if(r.status===403||r.status===404)throw new Error("GitHub refused access ("+r.status+"). Make sure the key has the 'gist' box ticked.");
  if(!r.ok)throw new Error("GitHub error "+r.status+".");
  return r;
}

/* ---------- merging: nothing is lost when both devices were used ---------- */
function mergeState(a,b){
  if(!a)return b;if(!b)return a;
  const newer=(b.u||0)>(a.u||0)?b:a,out=JSON.parse(JSON.stringify(newer));
  out.cards={};
  for(const k of new Set([...Object.keys(a.cards||{}),...Object.keys(b.cards||{})])){
    const x=(a.cards||{})[k],y=(b.cards||{})[k];
    out.cards[k]=!x?y:!y?x:((y.t||0)>(x.t||0)||((y.t||0)===(x.t||0)&&(y.reps||0)>(x.reps||0)))?y:x;
  }
  out.introduced={};for(const d of new Set([...Object.keys(a.introduced||{}),...Object.keys(b.introduced||{})]))
    out.introduced[d]=Math.max((a.introduced||{})[d]||0,(b.introduced||{})[d]||0);
  out.checks={};for(const d of new Set([...Object.keys(a.checks||{}),...Object.keys(b.checks||{})])){
    const x=(a.checks||{})[d]||{},y=(b.checks||{})[d]||{};out.checks[d]={};
    for(const k of new Set([...Object.keys(x),...Object.keys(y)]))out.checks[d][k]=!!(x[k]||y[k]);}
  out.alpha={};for(const k of new Set([...Object.keys(a.alpha||{}),...Object.keys(b.alpha||{})]))
    out.alpha[k]=Math.max((a.alpha||{})[k]||0,(b.alpha||{})[k]||0);
  const da=a.drill||{total:0},db=b.drill||{total:0};out.drill=(db.total||0)>(da.total||0)?db:da;
  const sa=a.streak||{},sb=b.streak||{};out.streak=((sb.last||0)>(sa.last||0)||((sb.last||0)===(sa.last||0)&&(sb.count||0)>(sa.count||0)))?sb:sa;
  out.u=Math.max(a.u||0,b.u||0);
  return out;
}
const readLocal=k=>{try{return JSON.parse(localStorage.getItem(k));}catch(e){return null;}};
const writeLocal=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};

async function pullRemote(){
  const g=await (await gh("/gists/"+SY.gist)).json(),f=g.files&&g.files[SYNC_FILE];
  if(!f)return {};
  const txt=f.truncated?await (await fetch(f.raw_url)).text():f.content;
  try{return JSON.parse(txt)||{};}catch(e){return {};}
}
/* pull → merge into this device → push the merged copy back */
async function syncNow(){
  if(!syncOn()||syncBusy)return;syncBusy=true;
  try{
    if(typeof S!=="undefined")writeLocal(KEY,S);
    const remote=await pullRemote(),merged={};let changedHere=false;
    for(const k of LANG_KEYS){
      const loc=readLocal(k),m=mergeState(loc,remote[k]);if(!m)continue;merged[k]=m;
      if(JSON.stringify(m)!==JSON.stringify(loc)){writeLocal(k,m);changedHere=true;}
    }
    if(JSON.stringify(merged)!==JSON.stringify(remote))
      await gh("/gists/"+SY.gist,{method:"PATCH",body:JSON.stringify({files:{[SYNC_FILE]:{content:JSON.stringify(merged)}}})});
    if(changedHere&&typeof load==="function"){S=load();if(typeof tab!=="undefined"&&tab==="today")render();}
    SY.last=Date.now();SY.err="";syncSave();
  }catch(e){SY.err=e.message||"Sync failed.";syncSave();}
  finally{syncBusy=false;paintSync();}
}
function scheduleSync(){if(!syncOn())return;clearTimeout(syncTimer);syncTimer=setTimeout(syncNow,4000);}

/* stamp every change so merging knows what is newest, then sync shortly after */
const _save=save;
save=function(){
  if(typeof S!=="undefined"&&S)S.u=Date.now();
  _save();scheduleSync();
};
const _grade=grade;grade=function(g){const k=cur;_grade(g);if(S.cards[k]){S.cards[k].t=Date.now();_save();}};
const _addCard=addCard;addCard=function(l){_addCard(l);if(S.cards[l]&&!S.cards[l].t){S.cards[l].t=Date.now();save();}};
document.addEventListener("visibilitychange",()=>{if(syncOn())syncNow();});

/* ---------- connecting ---------- */
async function connectSync(token){
  SY={token:token.trim()};
  const u=await gh("/user"),scopes=(u.headers.get("x-oauth-scopes")||"");
  const me=await u.json();
  if(scopes&&!scopes.split(/,\s*/).includes("gist"))throw new Error("This key doesn't have the 'gist' box ticked. Make a new one with only 'gist' ticked.");
  let found=null;
  for(let page=1;page<=10&&!found;page++){
    const list=await (await gh(`/gists?per_page=100&page=${page}`)).json();
    found=list.find(g=>g.files&&g.files[SYNC_FILE]);if(list.length<100)break;
  }
  if(!found){
    const body={description:"Koine Trainer progress (saved by the app; please don't edit)",public:false,files:{[SYNC_FILE]:{content:"{}"}}};
    found=await (await gh("/gists",{method:"POST",body:JSON.stringify(body)})).json();
  }
  SY.gist=found.id;SY.user=me.login;syncSave();
  await syncNow();
}
function disconnectSync(){SY={};syncSave();paintSync();}

/* ---------- the card on the Today page ---------- */
const TOKEN_URL="https://github.com/settings/tokens/new?scopes=gist&description=Koine%20Trainer%20sync";
function ago(t){if(!t)return "never";const s=Math.round((Date.now()-t)/1000);return s<60?"just now":s<3600?Math.round(s/60)+" min ago":s<86400?Math.round(s/3600)+" h ago":new Date(t).toLocaleDateString();}
function paintSync(){
  const box=document.getElementById("syncCard");if(!box)return;
  if(syncOn()){
    box.innerHTML=`<div class="card"><div class="row" style="justify-content:space-between"><b>☁ Synced with GitHub</b><span class="muted small">${esc(SY.user||"")}</span></div>
      <p class="small ${SY.err?"":"muted"}" style="margin:6px 0">${SY.err?`<span style="color:var(--bad)">${esc(SY.err)}</span>`:syncBusy?"Syncing…":"Last sync: "+ago(SY.last)+". Greek and Hebrew progress are kept the same on every device you connect."}</p>
      <div class="row"><button class="small" id="syncNowBtn">Sync now</button><button class="ghost small" id="syncOff">Disconnect this device</button></div></div>`;
    $("#syncNowBtn").onclick=()=>{syncNow();paintSync();};
    $("#syncOff").onclick=()=>{if(box.dataset.confirm){disconnectSync();}else{box.dataset.confirm="1";$("#syncOff").textContent="Tap again to disconnect";}};
    return;
  }
  box.innerHTML=`<div class="card"><b>Sync your progress across devices</b>
    <p class="small" style="margin:6px 0">Your progress is saved in this browser only. Connect your GitHub account once on each device (phone, PC) and it stays in sync automatically.</p>
    <details id="syncHow"><summary class="small" style="cursor:pointer">Set up (about 2 minutes)</summary>
    <ol class="small" style="padding-left:18px;margin:8px 0">
      <li>Open <a href="${TOKEN_URL}" target="_blank" rel="noopener">GitHub's new-token page</a> (sign in if asked). The <b>gist</b> box is already ticked; leave everything else unticked.</li>
      <li>Set <b>Expiration</b> to "No expiration" (or a year), then tap <b>Generate token</b> at the bottom.</li>
      <li>Copy the token (it starts with <code>ghp_</code>) and paste it here. Use the same token on your other device, or make a second one.</li></ol>
    <div class="row"><input type="password" id="syncTok" placeholder="ghp_…" autocomplete="off" style="flex:1;min-width:0"><button class="primary small" id="syncGo">Connect</button></div>
    <p class="small" id="syncErr" style="color:var(--bad);margin:6px 0"></p>
    <p class="muted small" style="margin:6px 0">Your progress goes into one private (unlisted) gist in your GitHub account. The key only allows access to gists, nothing else, and it stays on this device. You can delete it on GitHub at any time to stop syncing.</p></details></div>`;
  $("#syncGo").onclick=async()=>{const t=$("#syncTok").value.trim(),err=$("#syncErr");
    if(!/^(ghp_|github_pat_|gho_)/.test(t)){err.textContent="That doesn't look like a GitHub token. It should start with ghp_.";return;}
    err.textContent="";$("#syncGo").textContent="Connecting…";
    try{await connectSync(t);paintSync();}catch(e){SY={};syncSave();err.textContent=e.message;$("#syncGo").textContent="Connect";}};
}
window.addEventListener("load",()=>{if(syncOn())syncNow();});
