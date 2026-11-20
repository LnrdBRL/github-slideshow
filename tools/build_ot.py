"""Build docs/data/he/*.json from the Open Scriptures Hebrew Bible (WLC + morphology),
the STEPBible TBESH brief lexicon, and Strong's Hebrew dictionary.

Usage: python3 tools/build_ot.py <morphhb/wlc dir> <TBESH .txt> <strongs-hebrew-dictionary.js> <docs dir>

Sources: Westminster Leningrad Codex (public domain); OSHB lemmas & morphology (CC BY 4.0, Open Scriptures);
TBESH (CC BY 4.0, STEPBible.org / Tyndale House); Strong's Hebrew dictionary (Open Scriptures, CC BY-SA).
Word record: [text with "/" between prefix/stem/suffix segments, [lemma index per lemma segment], morph, qere or ""]
"""
import sys, os, re, json, unicodedata, collections, xml.etree.ElementTree as ET

wlc, tbesh_path, strongs_js, docs = sys.argv[1:5]
nfc = lambda s: unicodedata.normalize("NFC", s)
NS = "{http://www.bibletechnologies.net/2003/OSIS/namespace}"
BOOKS = [("Gen","Genesis"),("Exod","Exodus"),("Lev","Leviticus"),("Num","Numbers"),("Deut","Deuteronomy"),("Josh","Joshua"),
 ("Judg","Judges"),("Ruth","Ruth"),("1Sam","1 Samuel"),("2Sam","2 Samuel"),("1Kgs","1 Kings"),("2Kgs","2 Kings"),
 ("1Chr","1 Chronicles"),("2Chr","2 Chronicles"),("Ezra","Ezra"),("Neh","Nehemiah"),("Esth","Esther"),("Job","Job"),
 ("Ps","Psalms"),("Prov","Proverbs"),("Eccl","Ecclesiastes"),("Song","Song of Songs"),("Isa","Isaiah"),("Jer","Jeremiah"),
 ("Lam","Lamentations"),("Ezek","Ezekiel"),("Dan","Daniel"),("Hos","Hosea"),("Joel","Joel"),("Amos","Amos"),("Obad","Obadiah"),
 ("Jonah","Jonah"),("Mic","Micah"),("Nah","Nahum"),("Hab","Habakkuk"),("Zeph","Zephaniah"),("Hag","Haggai"),("Zech","Zechariah"),("Mal","Malachi")]
# OSHB prefix letters -> STEPBible numbers, display form, gloss
PREFIX = {"c":("H9002","וְ","and, but, then (conjunction וְ)"),"d":("H9009","הַ","the (article)"),"l":("H9005","לְ","to, for, of (preposition)"),
          "b":("H9003","בְּ","in, with, by (preposition)"),"m":("H9006","מִן","from, out of; than (preposition, often prefixed as מִ)"),
          "k":("H9004","כְּ","like, as, according to (preposition)"),"i":("H9008","הֲ","(question marker: introduces a yes/no question)"),
          "s":("H9007","שֶׁ","who, which, that (relative)")}

# --- lexicons ---------------------------------------------------------
tb = {}
for line in open(tbesh_path, encoding="utf-8-sig"):
    c = line.rstrip("\n").split("\t")
    if len(c) > 6 and re.match(r"^H\d{4}[a-z]?$", c[0]) and c[0] not in tb:
        tb[c[0]] = (nfc(c[3]).lstrip("/"), c[4], c[6].strip(), c[5])
raw = open(strongs_js, encoding="utf-8").read()
strongs = json.loads(raw[raw.index("{", raw.index("strongsHebrewDictionary")):raw.rindex("};") + 1])

def key(lem):
    m = re.match(r"^(\d+)\s*([a-z]?)\+?$", lem.strip())
    if not m: return None
    return "H%04d%s" % (int(m.group(1)), m.group(2))

# hand-written glosses where the brief lexicon's wording would confuse a learner
HAND = {"H4210": ("מִזְמוֹר", "miz.mor", "psalm, song"),
        "H0853": ("אֵת", "et", "(marks the definite direct object; not translated)"),
        "H3068": ("יְהוָה", "YHWH", "the LORD (God's personal name, YHWH; traditionally read aloud as Adonai)")}

# --- text ---------------------------------------------------------------
count, morphs = collections.Counter(), collections.defaultdict(collections.Counter)
books, langs = {}, collections.Counter()
for code, name in BOOKS:
    root = ET.parse(os.path.join(wlc, code + ".xml")).getroot()
    chapters = collections.OrderedDict()
    for verse in root.iter(NS + "verse"):
        _, c, v = verse.get("osisID").split(".")
        words = []
        for el in verse:
            tag = el.tag.replace(NS, "")
            if tag == "w":
                lem, morph, text = el.get("lemma", ""), el.get("morph", ""), nfc("".join(el.itertext()))
                segs = [s.strip() for s in lem.split("/")]
                keys = []
                for s in segs:
                    k = ("P" + s) if s in PREFIX else key(s)
                    keys.append(k or "")
                    if k: count[k] += 1; morphs[k][morph] += 1
                words.append([text, keys, morph, ""])
                langs[morph[:1]] += 1
            elif tag == "note" and words:
                q = [nfc("".join(w.itertext())) for w in el.iter(NS + "w")]
                if q and any(r.get("type") == "x-qere" for r in el.iter(NS + "rdg")): words[-1][3] = " ".join(q)
            elif tag == "seg" and words:
                t = el.get("type")
                if t == "x-maqqef": words[-1][0] += "־"
                elif t == "x-sof-pasuq": words[-1][0] += "׃"
                elif t == "x-paseq": words[-1][0] += " ׀"
        chapters.setdefault(int(c), collections.OrderedDict())[int(v)] = words
    books[code] = (name, chapters)

# --- lemma table, by frequency -----------------------------------------
lemmas = sorted(count, key=lambda k: (-count[k], k))
index = {k: i for i, k in enumerate(lemmas)}
table, nogloss = [], []
for k in lemmas:
    pos = morphs[k].most_common(1)[0][0]
    if k.startswith("P"):
        sn, form, gloss = PREFIX[k[1:]]; tr = ""; lang = "H"
        pos = {"c": "HC", "d": "HTd", "i": "HTi", "s": "HTr"}.get(k[1:], "HR")
        stk = "H4480" if k == "Pm" else ""
    else:
        e = HAND.get(k) or tb.get(k) or tb.get(k[:5]) or next((tb[x] for x in sorted(tb) if x.startswith(k[:5])), None)
        form, tr, gloss = (e[0], e[1], e[2]) if e else ("", "", "")
        num = "H%d" % int(k[1:5])
        stk = num if num in strongs else ""
        if not form and stk: form = nfc(strongs[stk]["lemma"])
        gloss = re.sub(r"^(to [^:]+|[^:]+):\s.*$", r"\1", gloss).strip()   # "land: country/planet" -> "land"
        if not gloss: nogloss.append(k)
    table.append([k, form, gloss, count[k], pos, stk])

out = os.path.join(docs, "data", "he"); os.makedirs(out, exist_ok=True)
words = sum(len(ws) for _, ch in books.values() for vs in ch.values() for ws in vs.values())
total = sum(count.values())   # word parts: prefixes such as וְ and הַ count separately, so coverage stays a true share
dump = lambda o, f: json.dump(o, open(os.path.join(out, f), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
dump({"total": total, "words": words, "lemmas": table}, "lemmas.json")
sd = {k: [nfc(v.get("lemma", "")), v.get("xlit", ""), re.sub(r"\s+", " ", v.get("strongs_def", "")).strip(),
          v.get("kjv_def", "").strip(), v.get("derivation", "").strip()] for k, v in strongs.items()}
dump(sd, "strongs.json")
meta = []
for code, (name, chapters) in books.items():
    data = {c: {v: [[t, [index[k] if k else -1 for k in ks], m, q] for t, ks, m, q in ws] for v, ws in vs.items()} for c, vs in chapters.items()}
    dump(data, code + ".json"); meta.append([code, name, len(chapters)])
dump(meta, "books.json")
print("words", words, "word parts", total, "lemmas", len(lemmas), "no gloss", len(nogloss), nogloss[:15], "langs", dict(langs))
print("top", [(r[0], r[1], r[2], r[3]) for r in table[:12]])
