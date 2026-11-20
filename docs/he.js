/* Hebrew pronunciation (seminary standard, IPA) from pointed Masoretic text.
   Used for the written guide under each word and to generate the audio files.
   Rules: vocal vs silent sheva, qamets qatan (o) in closed unaccented syllables, dagesh forte (doubling)
   vs lene, quiescent א/ה/ו/י, holam male and shureq, furtive patah, stress from the Masoretic accents,
   and the divine name read as Adonai (or Elohim where it is pointed that way). */
const HE = (function(){
  const PT={SHEVA:"ְ",HSEG:"ֱ",HPAT:"ֲ",HQAM:"ֳ",HIR:"ִ",TSE:"ֵ",SEG:"ֶ",PAT:"ַ",QAM:"ָ",
    HOL:"ֹ",HOLV:"ֺ",QUB:"ֻ",DAG:"ּ",MET:"ֽ",SHIN:"ׁ",SIN:"ׂ",QQ:"ׇ"};
  const VOW={"ֱ":"ĕ","ֲ":"ă","ֳ":"ŏ","ִ":"i","ֵ":"e","ֶ":"e","ַ":"a","ָ":"a","ֹ":"o","ֺ":"o","ֻ":"u","ׇ":"o"};
  const LONG=new Set(["ֵ","ֹ","ֺ"]);              // tsere, holam: sheva after them is vocal
  const HATEF=new Set(["ֱ","ֲ","ֳ"]);
  const BGDKPT="בגדכךפףת";
  const NONSTRESS=new Set(["֙","֠","֩","֒","֮","֚","֭","֝"]); // pre/postpositive accents
  const isAcc=c=>c>="֑"&&c<="֯";
  const CONS={"א":"ʔ","ב":"v","ג":"g","ד":"d","ה":"h","ו":"v","ז":"z","ח":"x","ט":"t","י":"j","כ":"x","ך":"x","ל":"l","מ":"m","ם":"m",
    "נ":"n","ן":"n","ס":"s","ע":"ʔ","פ":"f","ף":"f","צ":"ts","ץ":"ts","ק":"k","ר":"ʁ","ש":"ʃ","ת":"t"};
  const HARD={"ב":"b","כ":"k","ך":"k","פ":"p","ף":"p"};

  function letters(word){
    const L=[];let maqqef=/\u05BE\s*$/.test(word),seg=0;
    for(const ch of word.normalize("NFC").normalize("NFD")){
      if(ch==="/"){seg++;continue;}
      if(ch>="\u05D0"&&ch<="\u05EA")L.push({c:ch,m:new Set(),acc:[],seg});
      else if(L.length&&(ch>="\u0591"&&ch<="\u05C7")){const l=L[L.length-1];if(isAcc(ch))l.acc.push(ch);else l.m.add(ch);}
    }
    return {L,maqqef};
  }
  const vowelOf=l=>{for(const v of [PT.QQ,PT.HSEG,PT.HPAT,PT.HQAM,PT.HIR,PT.TSE,PT.SEG,PT.PAT,PT.QAM,PT.HOL,PT.HOLV,PT.QUB])if(l.m.has(v))return v;return null;};

  function analyze(word,morph){
    const verseEnd=/\u05C3/.test(word);
    // perfect-tense verbs (qatal/weqatal): a qamets before sheva is long a, the sheva vocal (הָיְתָה hāyəṯâ, קָטְלוּ qāṭəlû)
    // perfect-tense verbs except Hophal (whose qamets is always qatan: הָקְטַל hoqṭal)
    const perfect=/(^|\/)V[a-zA-GI-Z][pq]/.test((morph||"").replace(/^[HA]/,""));
    // before a 2nd-person suffix (ךָ כֶם כֶן) a sheva after qamets is vocal: לְבָבְךָ ləvavəxa, יָדְךָ jadəxa
    const sufx2=/\/Sp2/.test(morph||"");
    const {L,maqqef}=letters(word);if(!L.length)return null;
    const n=L.length;
    // 1. roles: consonant / vowel letter, and the vowel each letter carries
    for(let i=0;i<n;i++){
      const l=L[i],p=L[i-1];l.v=vowelOf(l);l.sheva=l.m.has(PT.SHEVA);l.dag=l.m.has(PT.DAG);l.silent=false;l.vowelOnly=null;
      if(l.c==="ש")l.sound=l.m.has(PT.SIN)?"s":"ʃ";
    }
    for(let i=0;i<n;i++){
      const l=L[i],p=L[i-1],next=L[i+1];
      const pHasV=p&&(p.v||p.vowelOnly);
      if(l.c==="ו"&&(l.m.has(PT.HOL)||l.m.has(PT.HOLV))&&!l.sheva&&p&&!pHasV&&!(l.v&&l.v!==PT.HOL&&l.v!==PT.HOLV)){ // holam male
        p.vowelOnly=null;p.v=p.v||PT.HOL;p.silent=false;l.silent=true;l.v=null;continue;}
      if(l.c==="ו"&&l.dag&&!l.v&&!l.sheva&&(!p||!pHasV)){l.silent=true;l.shureq=true;continue;}   // shureq
      if(l.c==="י"&&!l.v&&!l.sheva&&!l.dag&&p&&p.v&&[PT.HIR,PT.TSE,PT.SEG].includes(p.v)){l.silent=true;continue;}
      if(l.c==="י"&&!l.v&&!l.sheva&&!l.dag&&p&&p.v===PT.QAM&&next&&next.c==="ו"&&i+1===n-1){l.silent=true;continue;} // -ָיו = av
      if(l.c==="א"&&!l.v&&!l.sheva&&!l.dag&&i>0&&!(next&&next.c==="ו"&&(next.m.has(PT.HOL)||next.m.has(PT.HOLV))&&!next.v)){l.silent=true;continue;}
      if(l.c==="ה"&&i===n-1&&!l.v&&!l.dag&&!l.sheva){l.silent=true;continue;}
    }
    // 2. dagesh: forte (doubles) when a vowel precedes, else lene
    const prevSounding=i=>{for(let k=i-1;k>=0;k--){if(!L[k].silent||L[k].shureq)return L[k];}return null;};
    for(let i=0;i<n;i++){const l=L[i];if(!l.dag||l.silent)continue;
      if(l.c==="ה"&&i===n-1){l.mappiq=true;continue;}
      const p=prevSounding(i);
      l.forte=!!(i>0&&p&&(p.v&&!HATEF.has(p.v)||p.shureq||(L[i-1]&&L[i-1].silent&&!L[i-1].shureq)));
    }
    // 3. stress: the letter carrying the main accent
    let stressAt=-1;const accs=[];L.forEach((l,i)=>l.acc.forEach(a=>accs.push([i,a])));
    const real=accs.filter(([,a])=>!NONSTRESS.has(a));
    if(real.length)stressAt=real[real.length-1][0];
    else{const pash=accs.filter(([,a])=>a==="\u0599");if(pash.length>1)stressAt=pash[0][0];
      // silluq (verse-final accent) is written with the same sign as meteg: on the verse's last word it marks the stress
      else if(verseEnd){for(let k=n-1;k>=0;k--)if(L[k].m.has(PT.MET)){stressAt=k;break;}}}
    const hasAccent=accs.length>0;
    // 4. sheva: vocal or silent; qamets: a or o
    const first=L.findIndex(l=>!l.silent);
    for(let i=0;i<n;i++){const l=L[i];if(!l.sheva||l.silent)continue;
      const p=prevSounding(i);
      if(i===n-1||(i===n-2&&L[n-1].sheva)){l.voc=false;continue;}
      if(i===first||!p){l.voc=true;continue;}
      if(l.forte){l.voc=true;continue;}
      if(p.sheva&&!p.voc){l.voc=true;continue;}
      if(p.sheva&&p.voc){l.voc=false;continue;}
      if(p.shureq||LONG.has(p.v)){l.voc=true;continue;}
      if(p.v===PT.HIR&&L[L.indexOf(p)+1]&&L[L.indexOf(p)+1].c==="י"&&L[L.indexOf(p)+1].silent){l.voc=true;continue;}
      if(p.v===PT.QAM){const pi=L.indexOf(p),nx=L[i+1];
        l.voc=p.m.has(PT.MET)||pi===stressAt||perfect||(sufx2&&nx&&"כך".includes(nx.c)&&nx.seg>l.seg);continue;}
      l.voc=false;
    }
    for(let i=0;i<n;i++){const l=L[i];if(l.v!==PT.QAM)continue;
      const nx=L.slice(i+1).find(x=>!x.silent);
      const lastSyl=!L.slice(i+1).some(x=>!x.silent&&(x.v||(x.sheva&&x.voc)));
      const closedLast=lastSyl&&nx&&!nx.v;                  // a consonant closes the final syllable
      if(maqqef&&!hasAccent&&closedLast)l.v=PT.QQ;          // כָּל־ kol: unstressed before maqqef
      else if(lastSyl&&(stressAt<0||stressAt===i)){}        // stressed final syllable keeps long a
      else if(closedLast&&stressAt>=0&&stressAt<i)l.v=PT.QQ; // וַיָּ֫קָם vayyaqom: stress moved back
      else if(nx&&nx.sheva&&!nx.voc&&i!==stressAt)l.v=PT.QQ;
      else if(nx&&nx.v===PT.HQAM)l.v=PT.QQ;
    }
    return {L,stressAt,maqqef,hasAccent};
  }

  function phones(L){
    const P=[];const n=L.length;
    L.forEach((l,i)=>{
      if(l.silent){if(l.shureq)P.push({t:"u",V:1,o:i});return;}
      let c=l.sound||CONS[l.c];
      if(l.dag&&HARD[l.c])c=HARD[l.c];
      if(l.c==="ה"&&!l.mappiq&&i===n-1&&!l.v)c=null;
      const furtive=i===n-1&&l.v===PT.PAT&&("חע".includes(l.c)||l.mappiq);
      if(furtive){P.push({t:"a",o:i,F:1});P.push({t:c,o:i});return;}   // furtive patah: a glide, not a syllable
      if(c){if(l.forte)P.push({t:c,o:i});P.push({t:c,o:i});}
      if(l.v)P.push({t:VOW[l.v],V:1,o:i});
      else if(l.sheva&&l.voc)P.push({t:"ə",V:1,o:i});
    });
    return P;
  }

  function syllables(P){
    const vi=P.map((p,i)=>p.V?i:-1).filter(i=>i>=0);if(!vi.length)return [P];
    const S=[];let start=0;
    for(let k=0;k<vi.length;k++){
      let end=P.length;
      if(k+1<vi.length){const between=vi[k+1]-vi[k]-1;end=between<=1?vi[k]+1:vi[k]+2;}
      S.push(P.slice(start,end));start=end;
    }
    return S;
  }

  const DIVINE=/^([ובלכמ]?)יהוה$/;
  function pron(word,morph){
    word=(word||"");
    const bare=word.normalize("NFD").replace(/[^א-ת]/g,"");if(!bare)return "";
    const dm=bare.match(DIVINE);
    if(dm){ // the divine name: read as Adonai (or Elohim where pointed with hireq), the traditional qere perpetuum
      const tail=word.normalize("NFD").includes(PT.HIR)?["ʔĕ","lo","him"]:["ʔă","do","naj"];
      if(!dm[1])return "/"+tail[0]+"."+tail[1]+"ˈ"+tail[2]+"/";
      const pre=analyze(word).L[0],pc=(pre.dag&&HARD[pre.c])||CONS[pre.c];
      if(pre.v===PT.PAT||pre.v===PT.SEG)return "/"+pc+VOW[pre.v]+"."+tail[1]+"ˈ"+tail[2]+"/";
      return "/"+pc+(pre.v?VOW[pre.v]:"ə")+"."+tail[0]+"."+tail[1]+"ˈ"+tail[2]+"/";
    }
    const A=analyze(word,morph);if(!A)return "";
    const P=phones(A.L);const S=syllables(P);
    let st=-1;
    if(A.stressAt>=0)st=S.findIndex(s=>s.some(p=>p.V&&(p.o===A.stressAt||A.L[p.o]===A.L[A.stressAt])))
    if(st<0&&A.stressAt>=0){ // accent sat on a vowel letter or a consonant without its own vowel: use the syllable holding that letter
      st=S.findIndex(s=>s.some(p=>p.o===A.stressAt));}
    if(st<0&&!(A.maqqef&&!A.hasAccent))st=S.length-1;
    return "/"+S.map((s,i)=>(S.length>1&&i===st?"ˈ":i>0?".":"")+s.map(p=>p.t).join("")).join("").replace(/\.ˈ/g,"ˈ")+"/";
  }

  /* translation of an IPA string into espeak-ng phoneme input (German voice: has x, ʃ, ʁ, ʔ, ts, ə) */
  const ESPEAK=[["ts","ts"],["ʃ","S"],["ʁ","R"],["ʔ","?"],["ə","@"],["ă","a"],["ĕ","E"],["ŏ","O"],["x","x"],["j","j"],["ˈ","'"],[".",""],["/",""],
    ["e","e"],["o","o"]];
  const toEspeak=ipa=>ESPEAK.reduce((s,[a,b])=>s.split(a).join(b),ipa);
  return {pron,toEspeak,analyze};
})();
