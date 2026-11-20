// Hebrew audio list: one line per distinct pronunciation (hash <TAB> espeak phonemes).
// Usage: node tools/build_audio_he.mjs > list_he.tsv && python3 tools/build_audio.py list_he.tsv he
import fs from "fs";
const html = fs.readFileSync("docs/index.html", "utf8");
const keySrc = html.slice(html.indexOf("function audioKey"), html.indexOf("let sayBtn"));
const { audioKey } = new Function(keySrc + ";return {audioKey};")();
const { HE } = new Function(fs.readFileSync("docs/he.js", "utf8") + ";return {HE};")();
const seen = new Map();
const add = (w, m) => { const ipa = HE.pron(w, m); if (!ipa || ipa === "//") return; const k = audioKey(ipa);
  if (seen.has(k) && seen.get(k) !== ipa) throw new Error("hash collision " + ipa); seen.set(k, ipa); };
for (const [b] of JSON.parse(fs.readFileSync("docs/data/he/books.json")))
  for (const ch of Object.values(JSON.parse(fs.readFileSync(`docs/data/he/${b}.json`))))
    for (const ws of Object.values(ch)) for (const w of ws) add(w[3] || w[0], w[2]);
for (const r of JSON.parse(fs.readFileSync("docs/data/he/lemmas.json")).lemmas) add(r[1], "");
for (const [k, ipa] of seen) console.log(k + "\t" + HE.toEspeak(ipa));
console.error("pronunciations:", seen.size);
