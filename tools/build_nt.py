"""Build docs/data/*.json from MorphGNT (SBLGNT) + Dodson lexicon.

Usage: python3 tools/build_nt.py <morphgnt_dir> <dodson.xml> <strongs-greek-dictionary.js> <docs_dir>

Sources: SBLGNT text (SBL/Logos) with MorphGNT parsing (CC-BY-SA), Dodson lexicon (CC0),
Strong's Greek dictionary via Open Scriptures (CC-BY-SA).
"""
import sys, os, re, json, glob, unicodedata, collections, xml.etree.ElementTree as ET

mg_dir, dodson_xml, strongs_js, docs = sys.argv[1:5]
nfc = lambda s: unicodedata.normalize("NFC", s)
def bare(s):
    s = unicodedata.normalize("NFD", s)
    return "".join(c for c in s if not unicodedata.combining(c)).lower()

BOOKS = [("Mt","Matthew"),("Mk","Mark"),("Lk","Luke"),("Jn","John"),("Ac","Acts"),("Ro","Romans"),
 ("1Co","1 Corinthians"),("2Co","2 Corinthians"),("Ga","Galatians"),("Eph","Ephesians"),("Php","Philippians"),
 ("Col","Colossians"),("1Th","1 Thessalonians"),("2Th","2 Thessalonians"),("1Ti","1 Timothy"),("2Ti","2 Timothy"),
 ("Tit","Titus"),("Phm","Philemon"),("Heb","Hebrews"),("Jas","James"),("1Pe","1 Peter"),("2Pe","2 Peter"),
 ("1Jn","1 John"),("2Jn","2 John"),("3Jn","3 John"),("Jud","Jude"),("Re","Revelation")]

# --- Dodson lexicon -------------------------------------------------------
ns = {"t": "http://www.crosswire.org/2008/TEIOSIS/namespace"}
dod, dod_bare, dod_num = {}, {}, {}
for e in ET.parse(dodson_xml).getroot().iter("{%s}entry" % ns["t"]):
    key, num = [nfc(x.strip()) for x in e.get("n").split("|")]
    dod_num.setdefault(key, "G%d" % int(num)); dod_num.setdefault(bare(key), "G%d" % int(num))
    orth = nfc((e.find("t:orth", ns).text or key).strip())
    brief = e.find("t:def[@role='brief']", ns)
    gloss = re.sub(r"\s+", " ", (brief.text or "").strip()) if brief is not None else ""
    dod.setdefault(key, (orth, gloss))
    dod_bare.setdefault(bare(key), (orth, gloss))

# --- Strong's ----------------------------------------------------------
raw = open(strongs_js, encoding="utf-8").read()
strongs = json.loads(raw[raw.index("{", raw.index("strongsGreekDictionary")):raw.rindex("};") + 1])
strongs_by_lemma = {}
for k, v in strongs.items():
    strongs_by_lemma.setdefault(nfc(v.get("lemma", "")), k)
    strongs_by_lemma.setdefault(bare(v.get("lemma", "")), k)

# --- curated glosses for the core deck (override Dodson) ------------------
curated = json.load(open(os.path.join(os.path.dirname(__file__), "core_glosses.json"), encoding="utf-8"))

# MorphGNT files three verbs under δέω; split them by form so glosses are right.
DEI = {"δεῖ","ἔδει","δεῖν","δέῃ","δέον","δέοντα"}
DEOMAI = {"δεήθητε","ἐδεήθην","δεόμενος","ἐδεῖτο","ἐδεήθη","δεόμεθα"}
def fix_lemma(lemma, norm):
    if lemma == "δέω":
        if norm in DEI: return "δεῖ"
        if norm in DEOMAI: return "δέομαι"
    return lemma

# spelling differences between SBLGNT and the older lexicons
ALIAS = {"ἐλεάω":"ἐλεέω","τεσσεράκοντα":"τεσσαράκοντα","ἐραυνάω":"ἐρευνάω","Μαθθαῖος":"Ματθαῖος",
         "ἐγκακέω":"ἐκκακέω","λεγιών":"λεγεών","τετραάρχης":"τετράρχης","βαλλάντιον":"βαλάντιον",
         "εἰδωλολατρία":"εἰδωλολατρεία","Μωϋσῆς":"Μωσεύς","ἐραυνάω":"ἐρευνάω","ἐξεραυνάω":"ἐξερευνάω"}
ENDINGS = [("όομαι","όω"),("έομαι","έω"),("άομαι","άω"),("ομαι","ω"),("αμαι","ημι"),("υμαι","υμι")]
def candidates(l):
    out = [l, ALIAS.get(l, l), re.sub(r"\((.)\)", r"\1", l), re.sub(r"\(.\)", "", l), l.replace("μψ", "ψ")]
    for a, b in ENDINGS:
        if l.endswith(a): out.append(l[: -len(a)] + b)
    return out
def lookup(l, *dicts):
    for c in candidates(l):
        for d in dicts:
            if c in d: return d[c]
            if bare(c) in d: return d[bare(c)]
    return None

# --- read MorphGNT --------------------------------------------------------
lemma_count, lemma_pos = collections.Counter(), collections.defaultdict(collections.Counter)
books = {}
for code, name in BOOKS:
    path = glob.glob(os.path.join(mg_dir, f"*-{code}-morphgnt.txt"))[0]
    chapters = collections.OrderedDict()
    for line in open(path, encoding="utf-8"):
        bcv, pos, parse, text, word, norm, lemma = line.split()
        c, v = int(bcv[2:4]), int(bcv[4:6])
        lemma = fix_lemma(nfc(lemma), nfc(norm))
        lemma_count[lemma] += 1
        lemma_pos[lemma][pos] += 1
        chapters.setdefault(c, collections.OrderedDict()).setdefault(v, []).append((nfc(text), lemma, pos + parse))
    books[code] = (name, chapters)

# --- lemma table, sorted by frequency -------------------------------------
lemmas = sorted(lemma_count, key=lambda l: (-lemma_count[l], l))
index = {l: i for i, l in enumerate(lemmas)}
missing, table = [], []
for l in lemmas:
    pos = lemma_pos[l].most_common(1)[0][0]
    if l in curated:
        form, gloss = curated[l][:2]
    elif lookup(l, dod, dod_bare):
        form, gloss = lookup(l, dod, dod_bare)
        if form.split(",")[0] != l: form = l   # show SBLGNT spelling when we matched a variant
    else:
        form, gloss = l, ""
        missing.append(l)
    sn = (curated[l][2] if l in curated and len(curated[l]) > 2 else lookup(l, dod_num, strongs_by_lemma)) or ""
    if sn not in strongs: sn = ""
    table.append([l, form, gloss, lemma_count[l], pos, sn])

out = os.path.join(docs, "data"); os.makedirs(out, exist_ok=True)
total = sum(lemma_count.values())
json.dump({"total": total, "lemmas": table}, open(os.path.join(out, "lemmas.json"), "w", encoding="utf-8"),
          ensure_ascii=False, separators=(",", ":"))

# --- Strong's dictionary: {G123: [lemma, translit, definition, kjv, derivation]} ---
sd = {k: [nfc(v.get("lemma", "")), v.get("translit", ""), re.sub(r"\s+", " ", v.get("strongs_def", "")).strip(),
          v.get("kjv_def", "").strip(), v.get("derivation", "").strip()] for k, v in strongs.items()}
json.dump(sd, open(os.path.join(out, "strongs.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
no_strongs = [t[0] for t in table if not t[5]]

# --- per-book text: {chapter: {verse: [[text, lemmaIndex, code], ...]}} -----
meta = []
for code, (name, chapters) in books.items():
    data = {c: {v: [[t, index[l], p] for t, l, p in ws] for v, ws in vs.items()} for c, vs in chapters.items()}
    json.dump(data, open(os.path.join(out, f"{code}.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    meta.append([code, name, len(chapters)])
json.dump(meta, open(os.path.join(out, "books.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

print(f"words={total} lemmas={len(lemmas)} no_gloss={len(missing)} no_strongs={len(no_strongs)}")
print("no gloss:", missing[:60]); print("no strongs:", no_strongs[:60])
print("curated unmatched:", [k for k in curated if k not in index])
