/* =========================================================
   HEBREW SIDE — Hebrew Old Testament (Westminster Leningrad Codex)
   Plugs into the shared app (index.html) through the LG language config.
   ========================================================= */

/* ---------- Morphology decoder (Open Scriptures Hebrew Morphology codes) ---------- */
const HSTEM={q:"Qal",N:"Niphal",p:"Piel",P:"Pual",h:"Hiphil",H:"Hophal",t:"Hithpael",o:"Polel",O:"Polal",r:"Hithpolel",m:"Poel",M:"Poal",
  k:"Palel",K:"Pulal",Q:"Qal passive",l:"Pilpel",L:"Polpal",f:"Hithpalpel",D:"Nithpael",j:"Pealal",i:"Pilel",u:"Hothpaal",c:"Tiphil",
  v:"Hishtaphel",w:"Nithpalel",y:"Nithpoel",z:"Hithpoel"};
const ASTEM={q:"Peal",Q:"Peil",u:"Hithpeel",p:"Pael",P:"Ithpaal",M:"Hithpaal",a:"Aphel",h:"Haphel",s:"Saphel",e:"Shaphel",H:"Hophal",
  i:"Ithpeel",t:"Hishtaphel",v:"Ishtaphel",w:"Hithaphel",o:"Polel",z:"Ithpoel",r:"Hithpolel",f:"Hithpalpel",b:"Hephal",c:"Tiphel",
  m:"Poel",l:"Palpel",L:"Ithpalpel",O:"Ithpolel",G:"Ittaphal"};
const HCONJ={p:"perfect",q:"sequential perfect (weqatal)",i:"imperfect",w:"sequential imperfect (wayyiqtol)",h:"cohortative",
  j:"jussive",v:"imperative",r:"participle (active)",s:"participle (passive)",a:"infinitive absolute",c:"infinitive construct"};
const HP={1:"1st",2:"2nd",3:"3rd"},HG={m:"masculine",f:"feminine",c:"common",b:"both genders"},HN={s:"singular",p:"plural",d:"dual"},
  HS={a:"absolute",c:"construct",d:"determined"};
const HPART={a:"affirmation",d:"article",e:"exhortation",i:"question marker",j:"interjection",m:"demonstrative",n:"negative",o:"object marker",r:"relative"};
const pgn=(p,g,n)=>[HP[p]?HP[p]+" person":"",HG[g]||"",HN[n]||""].filter(Boolean).join(" ");
function parseSeg(seg,aram){
  const t=seg[0],x=seg.slice(1);
  switch(t){
    case "V":{const st=(aram?ASTEM:HSTEM)[x[0]]||x[0],cj=HCONJ[x[1]]||"";
      let s=`verb, ${st} ${cj}`;
      if("rs".includes(x[1]))s+=", "+[HG[x[2]],HN[x[3]],HS[x[4]]].filter(Boolean).join(" ");
      else if(!"ac".includes(x[1]))s+=", "+pgn(x[2],x[3],x[4]);
      return s;}
    case "N":{const k={c:"noun",g:"gentilic noun",p:"proper name",x:"noun"}[x[0]]||"noun";
      if(x[0]==="p")return "proper name";return [k,[HG[x[1]],HN[x[2]],HS[x[3]]].filter(Boolean).join(" ")].filter(Boolean).join(", ");}
    case "A":{const k={a:"adjective",c:"number (cardinal)",g:"gentilic adjective",o:"number (ordinal)"}[x[0]]||"adjective";
      return [k,[HG[x[1]],HN[x[2]],HS[x[3]]].filter(Boolean).join(" ")].filter(Boolean).join(", ");}
    case "P":{const k={d:"demonstrative pronoun",f:"indefinite pronoun",i:"interrogative pronoun",p:"personal pronoun",r:"relative pronoun"}[x[0]]||"pronoun";
      return x[0]==="p"?`${k}, ${pgn(x[1],x[2],x[3])}`:[k,[HG[x[1]],HN[x[2]]].filter(Boolean).join(" ")].filter(Boolean).join(", ");}
    case "S":{if(x[0]==="p")return "pronominal suffix, "+pgn(x[1],x[2],x[3]);
      return {d:"directional ending (toward)",h:"paragogic he (adds no meaning)",n:"paragogic nun (adds no meaning)"}[x[0]]||"suffix";}
    case "R":return x[0]==="d"?"preposition (with the article)":"preposition";
    case "T":return "particle"+(HPART[x[0]]?" ("+HPART[x[0]]+")":"");
    case "C":return "conjunction";case "D":return "adverb";
  }
  return seg;
}
function heParse(morph){const aram=morph[0]==="A";return morph.slice(1).split("/").map(s=>parseSeg(s,aram));}
function hePos(morph){
  if(!morph)return "";const segs=morph.slice(1).split("/"),main=segs.filter(x=>x[0]!=="S").pop()||segs[0];
  const t=main[0];
  return ({V:"verb",N:main[1]==="p"?"proper name":"noun",A:main[1]==="c"||main[1]==="o"?"number":"adjective",P:"pronoun",R:"preposition",C:"conjunction",D:"adverb",S:"suffix",
    T:main[1]==="d"?"article":main[1]==="o"?"object marker":main[1]==="n"?"negative":"particle"}[t]||"")+(morph[0]==="A"?" (Aramaic)":"");
}
const SUFMEAN={"1cs":"my / me","2ms":"your (m. sg.)","2fs":"your (f. sg.)","3ms":"his / him / its","3fs":"her / its","1cp":"our / us",
  "2mp":"your (m. pl.)","2fp":"your (f. pl.)","3mp":"their / them (m.)","3fp":"their / them (f.)"};
/* wrap each run of Hebrew inside English text so the browser keeps it in place */
const bidiHe=html=>html.replace(/[\u0590-\u05FF]+/g,m=>`<bdi class="hb">${m}</bdi>`);
const heShow=t=>{t=(t||"").replace(/\//g,"");return (typeof S!=="undefined"&&S.accents)?t:t.replace(/[\u0591-\u05AF\u05BD]/g,"");};

/* ---------- Alphabet ---------- */
const ALPHA_HE=[
 ["א","Aleph","ʔ","glottal stop, or silent"],["בּ ב","Bet / Vet","b / v","b with the dot (dagesh), v without"],["ג","Gimel","g","hard g"],["ד","Dalet","d","d"],
 ["ה","He","h","h; silent at the end of a word"],["ו","Vav","v","v; also a vowel letter: וֹ = o, וּ = u"],["ז","Zayin","z","z"],["ח","Chet","x","as in German 'Bach'"],
 ["ט","Tet","t","t"],["י","Yod","j","y as in 'yes'; also a vowel letter"],["כּ כ ך","Kaf / Khaf","k / x","k with the dot, 'Bach' sound without; ך at word end"],["ל","Lamed","l","l"],
 ["מ ם","Mem","m","m; ם at word end"],["נ ן","Nun","n","n; ן at word end"],["ס","Samekh","s","s"],["ע","Ayin","ʔ","glottal stop or silent (seminary pronunciation)"],
 ["פּ פ ף","Pe / Fe","p / f","p with the dot, f without; ף at word end"],["צ ץ","Tsade","ts","ts as in 'cats'; ץ at word end"],["ק","Qof","k","k"],["ר","Resh","ʁ","r in the throat, as in German or French"],
 ["שׁ שׂ","Shin / Sin","ʃ / s","dot on the right: sh; dot on the left: s"],["ת","Tav","t","t"]];
const VOWELS_HE=[
 ["בַ","Patach","a","a in 'father'"],["בָ","Qamets","a / o","a; but o in a closed, unstressed syllable (qamets qatan)"],["בֶ","Segol","e","e in 'bed'"],
 ["בֵ","Tsere","e","e in 'they' (without the glide)"],["בִ","Hireq","i","i in 'machine'"],["בֹ","Holem","o","o in 'more'"],["בוֹ","Holem-vav","o","the same o, written with ו"],
 ["בֻ","Qibbuts","u","u in 'rule'"],["בוּ","Shureq","u","the same u, written with ו"],["בְ","Sheva","ə / –","a quick 'uh' at the start of a syllable; silent when it closes one"],
 ["בֲ","Hatef patach","ă","a very short a"],["בֱ","Hatef segol","ĕ","a very short e"],["בֳ","Hatef qamets","ŏ","a very short o"]];

/* ---------- Paradigms (hand-written; standard grammar, e.g. Pratico & Van Pelt) ---------- */
const HROWS=["3 m","3 f","2 m","2 f","1 c"];
function heVerbTable(id,title,info,drill,prefix,sg,pl,note){
  const cells=[];
  sg.forEach((f,i)=>{if(f)cells.push({form:f,label:`${prefix} ${HROWS[i]} sg`,r:i,c:0});});
  pl.forEach((f,i)=>{if(!f)return;const lab=(i<2&&pl[0]===pl[1])?`${prefix} 3 c pl`:`${prefix} ${HROWS[i]} pl`;cells.push({form:f,label:lab,r:i,c:1});});
  return {id,title,info,group:"Verbs",drill,rows:HROWS,cols:["Singular","Plural"],cells,note};
}
const PARADIGMS_HE=[
 heVerbTable("qp","Qal perfect — קָטַל","Completed action ('he killed'). The person is shown by an ending on the stem: קָטַלְתִּי 'I killed', קָטַלְנוּ 'we killed'. The 3rd plural is the same for both genders.","hv","Qal perf",
   ["קָטַל","קָטְלָה","קָטַלְתָּ","קָטַלְתְּ","קָטַלְתִּי"],["קָטְלוּ","קָטְלוּ","קְטַלְתֶּם","קְטַלְתֶּן","קָטַלְנוּ"],"the verb is קָטַל, 'kill'"),
 heVerbTable("qi","Qal imperfect — יִקְטֹל","Incomplete action ('he will kill'). The person is shown mainly by a prefix letter: י he, ת she/you, א I, נ we. Note that 3 f sg and 2 m sg look the same, as do 3 f pl and 2 f pl.","hv","Qal impf",
   ["יִקְטֹל","תִּקְטֹל","תִּקְטֹל","תִּקְטְלִי","אֶקְטֹל"],["יִקְטְלוּ","תִּקְטֹלְנָה","תִּקְטְלוּ","תִּקְטֹלְנָה","נִקְטֹל"],"the verb is קָטַל, 'kill'"),
 heVerbTable("qv","Qal imperative — קְטֹל","Commands, 2nd person only. Built on the imperfect without its prefix.","hv","Qal impv",
   [null,null,"קְטֹל","קִטְלִי",null],[null,null,"קִטְלוּ","קְטֹלְנָה",null],"the verb is קָטַל, 'kill'"),
 (()=>{const st=[["Qal","קָטַל","יִקְטֹל"],["Niphal","נִקְטַל","יִקָּטֵל"],["Piel","קִטֵּל","יְקַטֵּל"],["Pual","קֻטַּל","יְקֻטַּל"],
   ["Hiphil","הִקְטִיל","יַקְטִיל"],["Hophal","הָקְטַל","יָקְטַל"],["Hithpael","הִתְקַטֵּל","יִתְקַטֵּל"]];
   const cells=[];st.forEach(([n,p,i],r)=>{cells.push({form:p,label:`${n} perf 3 m sg`,r,c:0});cells.push({form:i,label:`${n} impf 3 m sg`,r,c:1});});
   return {id:"stems",title:"The seven main verb stems — 3 m sg",info:"Recognise the stem by its shape: Niphal starts with נִ, Piel and Pual double the middle letter, Hiphil starts with הִ and has a י before the last letter, Hophal starts with הָ (read 'ho'), Hithpael starts with הִתְ.",
     group:"Verbs",drill:"stems",rows:st.map(x=>x[0]),cols:["Perfect","Imperfect"],cells,note:"the verb is קָטַל, 'kill'"};})(),
 (()=>{const F=[["סוּס","סוּסִים","סוּסָה","סוּסוֹת"],["סוּס","סוּסֵי","סוּסַת","סוּסוֹת"]],cols=["m sg","m pl","f sg","f pl"],rows=["Absolute","Construct"],cells=[];
   F.forEach((row,r)=>row.forEach((f,c)=>cells.push({form:f,label:`${cols[c]} ${rows[r].toLowerCase()}`,r,c})));
   return {id:"noun",title:"Noun endings — סוּס 'horse', סוּסָה 'mare'",info:"Masculine nouns take ים in the plural (סוּסִים); feminine nouns end in ה (סוּסָה) with a plural in וֹת (סוּסוֹת). The construct form ('horse of…') is shorter: סוּסֵי, סוּסַת.",
     group:"Nouns",drill:"noun",rows,cols,cells,note:"סוּס 'horse' / סוּסָה 'mare'"};})(),
 (()=>{const sg=["הוּא","הִיא","אַתָּה","אַתְּ","אֲנִי / אָנֹכִי"],pl=["הֵם / הֵמָּה","הֵנָּה","אַתֶּם","אַתֵּן / אַתֵּנָה","אֲנַחְנוּ"],cells=[];
   sg.forEach((f,r)=>cells.push({form:f,label:`${HROWS[r]} sg`,r,c:0}));pl.forEach((f,r)=>cells.push({form:f,label:`${HROWS[r]} pl`,r,c:1}));
   return {id:"pron",title:"Personal pronouns — אֲנִי, אַתָּה, הוּא…",info:"Independent pronouns, mostly used as subjects. In the Torah הִוא is often written for הִיא.",
     group:"Pronouns",drill:"pron",rows:HROWS,cols:["Singular","Plural"],cells,note:"independent personal pronouns"};})(),
 (()=>{const sg=["סוּסוֹ","סוּסָהּ","סוּסְךָ","סוּסֵךְ","סוּסִי"],pl=["סוּסָם","סוּסָן","סוּסְכֶם","סוּסְכֶן","סוּסֵנוּ"],cells=[];
   sg.forEach((f,r)=>cells.push({form:f,label:`${HROWS[r]} sg suffix`,r,c:0}));pl.forEach((f,r)=>cells.push({form:f,label:`${HROWS[r]} pl suffix`,r,c:1}));
   return {id:"suf",title:"Pronoun suffixes — סוּסִי 'my horse'…",info:"'My, your, his…' are endings on the noun: סוּסִי my horse, סוּסְךָ your horse, סוּסוֹ his horse, סוּסָהּ her horse, סוּסֵנוּ our horse, סוּסָם their horse.",
     group:"Pronouns",drill:"suf",rows:HROWS,cols:["Singular owner","Plural owner"],cells,note:"suffixes on סוּס 'horse'"};})()
];

/* ---------- Guided passages: text from the WLC data, notes hand-written ---------- */
const GUIDED_HE=[
 {id:"gen1",title:"Genesis 1:1",b:"Gen",c:1,vs:[1],tr:{1:"In the beginning God created the heavens and the earth."},
  notes:{"1-0":"בְּ 'in' + רֵאשִׁית 'beginning'. There is no article, but 'in the beginning' is the natural sense. This first word gives the book its Hebrew name, Bereshit.",
   "1-1":"Qal perfect 3 m sg of בָּרָא 'create'. In the Qal this verb only ever has God as its subject.",
   "1-2":"Plural in form (the ‑ִים ending), but the verb בָּרָא is singular: it means 'God', the one true God, not 'gods'.",
   "1-3":"אֵת marks the definite direct object. It isn't translated; it tells you what was created.",
   "1-4":"Article הַ plus a doubled שּׁ (dagesh forte). שָׁמַיִם 'heavens' is always plural in form.",
   "1-6":"Article הָ (with qamets because א can't be doubled) + אֶרֶץ 'earth, land'."}},
 {id:"deut6",title:"Deuteronomy 6:4–5 (the Shema)",b:"Deut",c:6,vs:[4,5],
  tr:{4:"Hear, O Israel: the LORD our God, the LORD is one.",5:"You shall love the LORD your God with all your heart and with all your soul and with all your might."},
  notes:{"4-0":"Qal imperative 2 m sg: 'Hear!' The whole prayer is named the Shema after this word. In printed Hebrew Bibles the ע is written large.",
   "4-2":"God's personal name, YHWH. Out of reverence it is read aloud as Adonai, 'Lord', and English Bibles write LORD. The audio and IPA follow that traditional reading.",
   "4-3":"אֱלֹהִים in the construct form (אֱלֹהֵי) + the suffix ‑נוּ 'our': 'our God'.",
   "4-5":"'One'. The ד is written large in printed Bibles; together with the large ע of שְׁמַע it spells עֵד, 'witness'.",
   "5-0":"וְ + Qal sequential perfect (weqatal) 2 m sg: 'and you shall love'. The vav shifts the stress to the end: ve-a-hav-TA.",
   "5-5":"לֵבָב 'heart' + the suffix ‑ְךָ 'your'. In Hebrew thought the heart is the seat of mind and will, not only feeling.",
   "5-7":"נֶפֶשׁ: 'soul, life, whole self' + ‑ְךָ 'your'."}},
 {id:"ps23",title:"Psalm 23:1",b:"Ps",c:23,vs:[1],tr:{1:"A psalm of David. The LORD is my shepherd; I shall not lack."},
  notes:{"1-1":"לְ + דָּוִד: 'of David / for David'. The lamed of authorship. Hebrew Bibles count the psalm title as part of verse 1.",
   "1-3":"Qal participle of רָעָה 'to shepherd' + ‑ִי 'my': literally 'my shepherding one', i.e. 'my shepherd'.",
   "1-5":"Qal imperfect 1 c sg of חָסֵר 'to lack': 'I shall not lack', or 'I lack nothing'."}}
];

/* ---------- Hebrew screens ---------- */
let heMode="nt",heGuide="gen1",heSel=null;
const mainLemma=w=>{const ix=w[1].filter(x=>x>=0);return ix.length?LEX[ix[ix.length-1]]:null;};
function heWordPanel(ref,w,note){
  const segs=w[0].split("/"),mseg=w[2].slice(1).split("/"),aram=w[2][0]==="A",parts=[];
  segs.forEach((t,k)=>{
    const ms=mseg[k]||"",li=w[1][k],r=li!==undefined&&li>=0?LEX[li]:null;
    let mean=r?r[2]:"";
    if(!r&&ms[0]==="S"&&ms[1]==="p")mean=SUFMEAN[ms.slice(2)]||"";
    parts.push(`<tr><td class="hb" style="font-size:1.3rem;white-space:nowrap">${esc(heShow(t))}</td><td>${esc(mean)}</td><td class="muted small">${esc(parseSeg(ms,aram))}</td></tr>`);
  });
  const say=w[3]||w[0],main=mainLemma(w);
  return `<div class="row" style="justify-content:space-between"><span class="muted small">${esc(ref)}</span><button class="ghost small" id="closeP">✕</button></div>
    <div class="row" style="align-items:center;gap:12px"><span class="hb" style="font-size:1.8rem">${esc(heShow(w[0]).replace(/[׃־׀\s]+$/,""))}</span>
      <button class="say" data-say="${esc(say)}" data-m="${esc(w[2])}" aria-label="Play pronunciation">🔊</button></div>
    <div class="pron"><b>${esc(pron(say,w[2]))}</b></div>
    ${w[3]?`<p class="small" style="margin:6px 0">📜 <b>Ketiv / Qere:</b> the text is written <span class="hb">${esc(heShow(w[0]))}</span> but read <span class="hb">${esc(heShow(w[3]))}</span>. The Masoretes kept the written consonants and added the vowels of the reading; the audio and IPA follow the reading.</p>`:""}
    ${aram?`<p class="small muted" style="margin:6px 0">This word is Aramaic (parts of Daniel and Ezra, and two words in Genesis 31:47 and Jeremiah 10:11).</p>`:""}
    ${note?`<p class="small" style="margin:8px 0">💡 ${bidiHe(esc(note))}</p>`:""}
    <div class="tablewrap"><table class="list"><tbody>${parts.join("")}</tbody></table></div>
    <hr style="border:0;border-top:1px solid var(--line)">${main?wordCard(main[0]):""}`;
}
function heVerseHTML(ch,vs,cfg){
  let prev=0;
  return `<div class="verse hb" dir="rtl">${vs.map(v=>{
    const ws=ch[v]||[];let gap="";for(let k=prev+1;k<+v&&!cfg.guided;k++)gap+=`<sup>${k}</sup><span class="muted small">(—)</span> `;prev=+v;
    return gap+`<sup>${v}</sup>`+ws.map((w,i)=>{const m=mainLemma(w),unk=S.hl&&m&&!solid(m[0]);
      return `<span class="w ${unk?"unk":""} ${gotCls(m&&m[0])}" data-w="${v}-${i}" data-l="${esc(m?m[0]:"")}">${esc(heShow(w[0]))}<small>${esc(m?short(m[2]):"")}</small></span>`;}).join(" ")}).join(" ")}</div>`;
}
function bindHePanel(container,ch,refOf,noteOf){
  const close=()=>{const o=document.getElementById("panel");if(o)o.remove();container.querySelectorAll(".sel").forEach(x=>x.classList.remove("sel"));};
  container.onclick=e=>{
    if(e.target.closest("#panel"))return;
    const s=e.target.closest("[data-w]");if(!s)return;
    if(collecting){collectWord(s.dataset.l,s);return;}
    if(s.classList.contains("sel")){close();return;}
    close();const [v,i]=s.dataset.w.split("-"),w=ch[v][+i];
    const pn=document.createElement("div");pn.id="panel";pn.className="card panel";pn.dir="ltr";
    pn.innerHTML=heWordPanel(refOf(v),w,noteOf&&noteOf(v,i));
    s.closest(".verse").insertAdjacentElement("afterend",pn);s.classList.add("sel");
    pn.querySelector("#closeP").onclick=ev=>{ev.stopPropagation();close();};
    hydrate(pn);
  };
}
function viewReadHe(){
  const modeBar=`<div class="row" style="margin-bottom:12px"><button class="small ${heMode==="nt"?"on":""}" id="mNT">Whole Old Testament</button><button class="small ${heMode==="guided"?"on":""}" id="mG">Guided passages</button></div>`;
  const toggles=`<button class="small ${inter?"on":""}" id="tInter">Interlinear</button>
     <button class="small ${S.hl?"on":""}" id="tHl">Highlight unlearned</button>
     <button class="small ${S.accents?"on":""}" id="tAcc">Accent marks</button>${colBtn()}`;
  const bindToggles=()=>{
    $("#tInter").onclick=()=>{inter=!inter;viewReadHe();};$("#tHl").onclick=()=>{S.hl=!S.hl;save();viewReadHe();};
    $("#tAcc").onclick=()=>{S.accents=!S.accents;save();viewReadHe();};bindCol(viewReadHe);
    $("#mNT").onclick=()=>{heMode="nt";viewReadHe();};$("#mG").onclick=()=>{heMode="guided";viewReadHe();};};
  if(heMode==="guided"){
    const G=GUIDED_HE.find(x=>x.id===heGuide);
    $("#app").innerHTML=`<h2>Read</h2>${modeBar}
     <div class="row" style="margin-bottom:12px"><select id="gsel">${GUIDED_HE.map(x=>`<option value="${x.id}" ${x.id===heGuide?"selected":""}>${x.title}</option>`).join("")}</select>${toggles}
       <button class="small ${showTr?"on":""}" id="tTr">Translation</button></div>
     ${colBar()}
     <div class="card ${inter?"inter":""}" id="text"><p class="muted">Loading…</p></div>
     <p class="muted small">These passages have hand-written notes on key words. Tap a word to see them.</p>`;
    bindToggles();$("#tTr").onclick=()=>{showTr=!showTr;viewReadHe();};
    $("#gsel").onchange=e=>{heGuide=e.target.value;viewReadHe();};
    getBook(G.b).then(data=>{if(tab!=="read"||heMode!=="guided")return;const ch=data[G.c];
      $("#text").innerHTML=G.vs.map(v=>heVerseHTML(ch,[v],{guided:1})+(showTr?`<p class="muted small" style="margin-top:-4px">${esc(G.tr[v])}</p>`:"")).join("");
      bindHePanel($("#text"),ch,v=>`${G.title.split(" ")[0]} ${G.c}:${v}`,(v,i)=>G.notes[v+"-"+i]);});
    return;
  }
  const {b,c}=S.pos,bk=BOOKS.find(x=>x[0]===b)||BOOKS[0],cc=Math.min(c,bk[2]);
  $("#app").innerHTML=`<h2>Read</h2>${modeBar}
   <div class="row" style="margin-bottom:12px">
     <select id="bsel">${BOOKS.map(x=>`<option value="${x[0]}" ${x[0]===bk[0]?"selected":""}>${x[1]}</option>`).join("")}</select>
     <select id="csel">${Array.from({length:bk[2]},(_,i)=>`<option ${i+1===cc?"selected":""}>${i+1}</option>`).join("")}</select>${toggles}</div>
   ${colBar()}
   <div class="card ${inter?"inter":""}" id="text"><p class="muted">Loading ${bk[1]} ${cc}…</p></div>
   <div class="row" style="justify-content:space-between"><button class="small" id="prev">← Previous</button><button class="small" id="nextc">Next →</button></div>
   <p class="muted small">Text: Westminster Leningrad Codex. Parsing: Open Scriptures Hebrew Bible. Hebrew reads right to left. Verse numbers follow the Hebrew Bible, which sometimes differs from English Bibles (psalm titles are verse 1; Malachi has 3 chapters). Tap any word for its parts, parsing and Strong's entry.</p>`;
  bindToggles();
  $("#bsel").onchange=e=>{S.pos={b:e.target.value,c:1};save();viewReadHe();};
  $("#csel").onchange=e=>{S.pos.c=+e.target.value;save();viewReadHe();};
  const step=d=>{let bi=BOOKS.findIndex(x=>x[0]===bk[0]),n=cc+d;if(n<1){bi--;if(bi<0)return;n=BOOKS[bi][2];}else if(n>bk[2]){bi++;if(bi>=BOOKS.length)return;n=1;}S.pos={b:BOOKS[bi][0],c:n};save();viewReadHe();window.scrollTo(0,0);};
  $("#prev").onclick=()=>step(-1);$("#nextc").onclick=()=>step(1);
  getBook(bk[0]).then(data=>{if(tab!=="read"||heMode!=="nt")return;const ch=data[cc];
    $("#text").innerHTML=heVerseHTML(ch,Object.keys(ch),{});
    bindHePanel($("#text"),ch,v=>`${bk[1]} ${cc}:${v}`);
  }).catch(()=>{$("#text").innerHTML=`<p class="muted">Couldn't load the text. Check your connection.</p>`;});
}

/* Alphabet: letters (tracked to mastery), vowels, sound-it-out */
let heAlphaQ=null,heAlphaMode="letters";
function heUnlocked(){let n=5;while(n<ALPHA_HE.length-1&&ALPHA_HE.slice(0,n+1).every((_,k)=>(S.alpha[k]||0)>=ALPHA_DONE))n=Math.min(ALPHA_HE.length-1,n+6);return n;}
function heNewAlphaQ(){
  if(heAlphaMode==="letters"){const u=heUnlocked();const w=ALPHA_HE.map((_,i)=>i<=u?Math.max(1,ALPHA_DONE+1-(S.alpha[i]||0)):0);
    let r=Math.random()*w.reduce((a,b)=>a+b,0),i=0;for(;i<w.length;i++){r-=w[i];if(r<=0)break;}i=Math.min(i,ALPHA_HE.length-1);
    const pool=[...Array(u+1).keys()].filter(x=>x!==i);
    heAlphaQ={i,opts:shuffle([i,...shuffle(pool.length>=3?pool:[...Array(ALPHA_HE.length).keys()].filter(x=>x!==i)).slice(0,3)]),ans:null};}
  else if(heAlphaMode==="vowels"){const i=Math.floor(Math.random()*VOWELS_HE.length);
    heAlphaQ={i,opts:shuffle([i,...shuffle([...Array(VOWELS_HE.length).keys()].filter(x=>x!==i)).slice(0,3)]),ans:null};}
  else{const pick=LEX.slice(0,500).filter(r=>!r[0].startsWith("P")&&hePos(r[4])!=="proper name"&&!/\s/.test(r[1]));const w=pick[Math.floor(Math.random()*pick.length)],t=pron(w[1]);
    const others=shuffle(pick.filter(r=>r!==w)).map(r=>pron(r[1])).filter(x=>x!==t).slice(0,3);
    heAlphaQ={w,t,opts:shuffle([t,...others]),ans:null};}
  heAlphaQ.mode=heAlphaMode;
}
function viewAlphaHe(){
  if(!heAlphaQ||heAlphaQ.mode!==heAlphaMode)heNewAlphaQ();
  const a=heAlphaQ,ak=alphaKnown();let quiz;
  if(heAlphaMode==="letters"){const L=ALPHA_HE[a.i];const glyph=L[0].split(" ").slice(-1)[0];
    quiz=`<div class="muted small">Which letter is this?</div><div class="big hb">${esc(L[0].split(" ")[0])}</div>
      <div class="opts">${a.opts.map(o=>`<button data-a="${o}" class="${a.ans!==null?(o===a.i?"right":(o===a.ans?"wrong":"")):""}">${ALPHA_HE[o][1]} (${ALPHA_HE[o][2]})</button>`).join("")}</div>`;}
  else if(heAlphaMode==="vowels"){const V=VOWELS_HE[a.i];
    quiz=`<div class="muted small">Which vowel is under or over this ב?</div><div class="big hb">${esc(V[0])}</div>
      <div class="opts">${a.opts.map(o=>`<button data-a="${o}" class="${a.ans!==null?(o===a.i?"right":(o===a.ans?"wrong":"")):""}">${VOWELS_HE[o][1]} (${VOWELS_HE[o][2]})</button>`).join("")}</div>`;}
  else quiz=`<div class="muted small">Sound it out. Which pronunciation matches?</div>
      <div class="row" style="justify-content:center;gap:12px"><span class="big hb">${esc(heShow(a.w[1]))}</span><button class="say" data-say="${esc(a.w[1])}" aria-label="Play pronunciation">🔊</button></div>
      <div class="opts">${a.opts.map(o=>`<button data-a="${esc(o)}" class="${a.ans!==null?(o===a.t?"right":(o===a.ans?"wrong":"")):""}">${esc(o)}</button>`).join("")}</div>
      ${a.ans!==null?`<p>It means <b>${esc(a.w[2])}</b> (${a.w[3]}× in OT)</p>`:""}`;
  $("#app").innerHTML=`<h2>Alphabet & vowels</h2>
  <div class="row" style="margin-bottom:12px"><button class="small ${heAlphaMode==="letters"?"on":""}" id="aL">Letters</button><button class="small ${heAlphaMode==="vowels"?"on":""}" id="aV">Vowels</button><button class="small ${heAlphaMode==="words"?"on":""}" id="aW">Sound it out (real words)</button></div>
  <div class="card"><div class="row" style="justify-content:space-between"><b>${ak} / ${ALPHA_HE.length} letters learned</b><span class="muted small">${ak<ALPHA_HE.length?"New letters unlock in groups of 6 as you learn them":"Letters done ✓ Now the vowels, then Vocab"}</span></div><div class="bar" style="margin-top:8px"><i style="width:${ak/ALPHA_HE.length*100}%"></i></div>
   <p class="small muted" style="margin:8px 0 0">Hebrew reads <b>right to left</b>. The letters are consonants; the vowels are small marks (points) added below, above or inside them.</p></div>
  <div class="card flash">${quiz}${a.ans!==null?`<button class="primary" id="an" style="margin-top:14px">Next</button>`:""}</div>
  <h3>Letters</h3>
  <div class="letters">${ALPHA_HE.map((l,i)=>`<div class="letter" style="${(S.alpha[i]||0)>=ALPHA_DONE?"border-color:var(--good)":""}"><div class="hb" style="font-size:2rem">${esc(l[0])}</div><b>${l[1]}</b><div class="ipa">/${esc(l[2])}/</div><div class="small muted">${esc(l[3])}</div></div>`).join("")}</div>
  <h3>Vowels (shown under ב)</h3>
  <div class="letters">${VOWELS_HE.map(v=>`<div class="letter"><div class="hb" style="font-size:2rem">${esc(v[0])}</div><b>${v[1]}</b><div class="ipa">/${esc(v[2])}/</div><div class="small muted">${esc(v[3])}</div></div>`).join("")}</div>
  <div class="card" style="margin-top:14px"><b>Good to know</b>
   <p><b>Dagesh</b> (the dot inside a letter): in בּ כּ פּ it makes the hard sound (b, k, p). After a vowel it doubles the letter: הַשָּׁמַיִם = haʃ‑ʃa‑ma‑jim.</p>
   <p><b>Final forms:</b> five letters change shape at the end of a word: ך ם ן ף ץ.</p>
   <p><b>Accent marks:</b> the Hebrew Bible also has cantillation marks (for chanting). They show which syllable is stressed. The reader hides them by default; turn on "Accent marks" to see them.</p>
   <p class="muted small">Pronunciation here is the standard used in most seminary courses: close to modern Israeli Hebrew, with ח and כ both /x/ and א, ע glottal or silent. God's name יהוה is read Adonai, as is traditional. The 🔊 recordings use a synthetic voice saying exactly the IPA shown.</p></div>`;
  $("#aL").onclick=()=>{heAlphaMode="letters";viewAlphaHe();};$("#aV").onclick=()=>{heAlphaMode="vowels";viewAlphaHe();};$("#aW").onclick=()=>{heAlphaMode="words";viewAlphaHe();};
  $("#app").querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>{if(a.ans!==null)return;
    if(heAlphaMode==="words")a.ans=b.dataset.a;
    else{a.ans=+b.dataset.a;if(heAlphaMode==="letters"){S.alpha[a.i]=a.ans===a.i?(S.alpha[a.i]||0)+1:0;touchStreak();save();}}
    viewAlphaHe();});
  $("#app").querySelectorAll("[data-say]").forEach(b=>b.onclick=()=>speak(b.dataset.say,b));
  const n=$("#an");if(n){n.onclick=()=>{heNewAlphaQ();viewAlphaHe();};n.focus();}
}

function viewMethodHe(){
  $("#app").innerHTML=`<h2>The method — Hebrew</h2>
  <div class="card"><p>The same approach as the Greek side: alphabet first, most frequent words first, spaced repetition, the forms drilled until automatic, and real text from day one.</p></div>
  <div class="card"><h3 style="margin-top:0">What is different about Hebrew</h3>
  <p><b>Right to left, vowels as points.</b> Learn the 22 letters, then the vowel points. Budget 4–5 days for both.</p>
  <p><b>Words are built from roots.</b> Most words grow from a three-letter root: מֶלֶךְ king, מָלַךְ to reign, מַלְכוּת kingdom all come from מ‑ל‑ך. Spot the root and you can guess the meaning.</p>
  <p><b>Little words attach to the front.</b> וְ 'and', הַ 'the', בְּ 'in', לְ 'to', כְּ 'like', מִ 'from' are written joined to the next word, and 'my, your, his' are endings. The reader splits each word into its parts for you.</p>
  <p><b>Verbs carry a lot.</b> One verb form tells you the stem (Qal, Niphal, Piel…), the tense, person, gender and number. That's what the Forms tab drills.</p></div>
  <div class="card"><h3 style="margin-top:0">A 12-week plan</h3>
  <table><tr><th>Weeks</th><th>Focus</th><th>Milestone</th></tr>
  <tr><td>1</td><td>Letters, vowels, first 50 words (with the prefixes)</td><td>Sound out Genesis 1:1</td></tr>
  <tr><td>2–3</td><td>Nouns, the article, prepositions, pronoun suffixes; words to 150</td><td>Read Deuteronomy 6:4–5 with help</td></tr>
  <tr><td>4–6</td><td>Qal perfect and imperfect, wayyiqtol narrative; words to 300 (about 77% of the text)</td><td>Genesis 1 with the reader</td></tr>
  <tr><td>7–9</td><td>The other verb stems (Niphal, Piel, Hiphil…), participles</td><td>Psalm 23 and Ruth 1</td></tr>
  <tr><td>10–12</td><td>Weak verbs, infinitives; keep reading</td><td>A chapter of Genesis or Ruth a week</td></tr></table></div>
  <div class="card"><h3 style="margin-top:0">Sources & accuracy</h3>
  <p class="small">• <b>Hebrew text:</b> Westminster Leningrad Codex (public domain), the most-used edition of the oldest complete Hebrew Bible manuscript (c. 1008 AD).<br>
  • <b>Parsing & dictionary forms:</b> Open Scriptures Hebrew Bible (CC BY 4.0).<br>
  • <b>Glosses:</b> STEPBible TBESH brief lexicon (CC BY 4.0, Tyndale House Cambridge), shortened to the main sense.<br>
  • <b>Strong's:</b> Strong's Hebrew Dictionary (1890), via Open Scriptures. Its "KJV renderings" line shows how the KJV translated a word, not a definition.<br>
  • <b>Ketiv / Qere:</b> in about 1,300 places the Masoretes read a different word than the one written. The reader shows what is written and notes the reading; audio and IPA follow the reading.<br>
  • <b>Pronunciation:</b> worked out by rule from the vowel points and accents (spoken or silent sheva, qamets as o, dagesh doubling, stress from the accent marks). The rules match the grammar on all the test words, but Hebrew has exceptions; when the IPA and your grammar book disagree, trust the grammar book.<br>
  • <b>Charts and guided notes:</b> written by hand to standard Biblical Hebrew grammar (e.g. Pratico & Van Pelt, <i>Basics of Biblical Hebrew</i>).</p></div>`;
}

/* ---------- Language packs and switching ---------- */
const PACK={
  gr:{lg:LG,data:{PARADIGMS,PASSAGES,ALPHABET,DIPH},pron:pron,brand:"Koine Trainer"},
  he:{lg:{id:"he",key:"hebrew-trainer-v1",cls:"hb",dir:"data/he/",audio:"audio/he/",name:"Hebrew",corpus:"OT",
      text:"the Hebrew Old Testament (Westminster Leningrad Codex)",pos:hePos,translit:()=>"",sayOf:r=>r[1],defPos:{b:"Gen",c:1},snPrefix:"H",
      show:t=>heShow(t),bidi:bidiHe,
      coverNote:"Prefixes like וְ 'and' and הַ 'the' count as separate words here. The top 100 words cover about 64%, and the top 300 about 77%.",
      strongsNone:"No Strong's number. Strong's has none for the prefixes, and a few words in this edition are numbered differently.",
      dictHint:"Hebrew (vowels optional), English or Strong's # (e.g. H430)",
      dictTry:'<a href="#" data-q="שָׁלוֹם">שָׁלוֹם</a> · <a href="#" data-q="love">love</a> · <a href="#" data-q="אמר">אמר</a> · <a href="#" data-q="H430">H430</a>',
      dictNote:"Glosses: STEPBible TBESH lexicon (CC BY 4.0). Strong's Hebrew Dictionary (1890) via Open Scriptures. Hebrew can be typed without vowel points.",
      alphaNote:`<p class="small" style="margin:6px 0">Hebrew also has vowel points, small marks under and over the letters. After the letters, do the Vowels drill too (about 2 more days).</p>`,
      views:{read:viewReadHe,alpha:viewAlphaHe,method:viewMethodHe}},
    data:{PARADIGMS:PARADIGMS_HE,PASSAGES:[],ALPHABET:ALPHA_HE,DIPH:[]},pron:(w,m)=>HE.pron(w,m),brand:"Hebrew Trainer"}
};
const LCACHE={};
async function setLang(l){
  if(l===LANG&&LEX.length){render();return;}
  LCACHE[LANG]={LEX,LEXI,NT_WORDS,BOOKS,BOOKDATA,STRONGS};
  LANG=l;const P=PACK[l];LG=P.lg;KEY=LG.key;S=load();if(LG.id==="he"&&S.accents===undefined)S.accents=false;
  PARADIGMS=P.data.PARADIGMS;PASSAGES=P.data.PASSAGES;ALPHABET=P.data.ALPHABET;DIPH=P.data.DIPH;pron=P.pron;
  queue=[];cur=null;revealed=false;vocabMode="study";listN=300;formSel=PARADIGMS[0].id;drillQ=null;streakRun=0;
  alphaQ=null;heAlphaQ=null;collecting=false;collected=0;dictQuery="";dictSel=null;selW=null;readMode="nt";heMode="nt";
  document.documentElement.classList.toggle("he",l==="he");
  document.getElementById("brandName").textContent=P.brand;
  document.querySelectorAll("[data-lang]").forEach(b=>b.classList.toggle("on",b.dataset.lang===l));
  try{localStorage.setItem("koine-lang",l);}catch(e){}
  const c=LCACHE[l];
  if(c&&c.LEX.length){({LEX,LEXI,NT_WORDS,BOOKS,BOOKDATA,STRONGS}=c);render();return;}
  BOOKDATA={};STRONGS=null;LEX=[];
  $("#app").innerHTML=`<p class="muted">Loading the ${LG.name} lexicon…</p>`;
  try{await loadLexicon();render();}
  catch(e){$("#app").innerHTML=`<div class="card"><b>Couldn't load the ${LG.name} data.</b><p class="muted">Check your connection and try again.</p></div>`;}
}
document.querySelectorAll("[data-lang]").forEach(b=>b.onclick=()=>{tab=tab||"today";setLang(b.dataset.lang);window.scrollTo(0,0);});
(function(){let l="gr";try{l=localStorage.getItem("koine-lang")||"gr";}catch(e){}
  if(l==="he")setLang("he");else boot();})();
