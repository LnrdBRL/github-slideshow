// Generate one MP3 per distinct pronunciation in the NT.
// Usage: node tools/build_audio.mjs > list.tsv   (then tools/build_audio.sh list.tsv)
// The IPA comes from the app's own pron() function, so audio always matches the written guide.
import fs from "fs";
const html = fs.readFileSync("docs/index.html", "utf8");
const grab = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
const src = grab("const sayable=", "let sayBtn") + grab("/* IPA, Erasmian", "function sayRow");
const { pron, audioKey } = new Function(src + ";return {pron,audioKey};")();
const E = [["eːu̯","e:U"],["ai̯","aI"],["ei̯","eI"],["oi̯","oI"],["au̯","aU"],["eu̯","eU"],["yi̯","yI"],["uː","u:"],["eː","e:"],["oː","o:"],
           ["θ","T"],["ŋ","N"],["r","R"],["ˈ","'"],[".",""],["/",""]];
const toEspeak = ipa => E.reduce((s, [a, b]) => s.split(a).join(b), ipa);
const seen = new Map();
const add = w => { const ipa = pron(w); if (!ipa || ipa === "//") return; const k = audioKey(ipa); if (seen.has(k) && seen.get(k) !== ipa) throw new Error("hash collision " + ipa); seen.set(k, ipa); };
for (const f of fs.readdirSync("docs/data")) {
  if (["lemmas.json", "strongs.json", "books.json"].includes(f)) continue;
  for (const ch of Object.values(JSON.parse(fs.readFileSync("docs/data/" + f)))) for (const ws of Object.values(ch)) for (const w of ws) add(w[0]);
}
for (const r of JSON.parse(fs.readFileSync("docs/data/lemmas.json")).lemmas) { add(r[0]); add(r[1]); }
for (const [k, ipa] of seen) console.log(k + "\t" + toEspeak(ipa));
console.error("pronunciations:", seen.size);
