"""Generate docs/audio/<2 hex>/<16 hex>.mp3 for every line of list.tsv (hash <TAB> espeak phonemes).

Usage: node tools/build_audio.mjs > list.tsv && python3 tools/build_audio.py list.tsv
Needs espeak-ng and ffmpeg. Resumable: existing files are skipped.
"""
import sys, os, subprocess, tempfile
from concurrent.futures import ThreadPoolExecutor

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "docs", "audio")
AF = ("silenceremove=start_periods=1:start_threshold=-50dB,areverse,"
      "silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.05")
items = [l.rstrip("\n").split("\t") for l in open(sys.argv[1], encoding="utf-8") if l.strip()]
path = lambda k: os.path.join(OUT, k[:2], k + ".mp3")
todo = [(k, p) for k, p in items if not (os.path.exists(path(k)) and os.path.getsize(path(k)) > 0)]
for k, _ in todo: os.makedirs(os.path.dirname(path(k)), exist_ok=True)

def batch(chunk):
    with tempfile.TemporaryDirectory() as tmp:
        cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y"]
        maps = []
        for i, (k, p) in enumerate(chunk):
            wav = os.path.join(tmp, f"{i}.wav")
            subprocess.run(["espeak-ng", "-v", "grc", "-s", "125", "-w", wav, f"[[{p}]]"], check=True)
            cmd += ["-i", wav]
            maps += ["-map", str(i), "-af", AF, "-ac", "1", "-ar", "22050", "-b:a", "24k", "-c:a", "libmp3lame",
                     "-write_xing", "0", "-id3v2_version", "0", path(k) + ".tmp.mp3"]
        subprocess.run(cmd + maps, check=True)
        for k, _ in chunk: os.replace(path(k) + ".tmp.mp3", path(k))
    return len(chunk)

chunks = [todo[i:i + 40] for i in range(0, len(todo), 40)]
done = 0
with ThreadPoolExecutor(os.cpu_count()) as ex:
    for n in ex.map(batch, chunks):
        done += n
        if done % 2000 < 40: print(done, "/", len(todo), flush=True)
print("done", done)
