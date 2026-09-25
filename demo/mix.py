# Builds arc-guard-demo-final.mp4: screen recording + voiceover + ducked SFX bed + quiet ambience.
import glob, subprocess
f = lambda d: glob.glob(f"{d}/*.mp3")[0]
VO = [(0.5,1),(5.0,2),(13.8,3),(18.0,4),(26.5,5),(33.8,6),(48.7,7),(59.0,8)]
CUES = [("intro",0.0,-4)]
CUES += [("click",t,-9) for t in (4.85,7.75,13.55,17.85,19.85,21.45,26.25,33.55,35.35,41.65)]
CUES += [("chime",t,-13) for t in (5.0,13.8,20.3,21.7,26.5,41.9)] + [("chime",40.0,-7)]
CUES += [("vault",5.4,-4),("snip",8.85,-5),("stamp",15.15,-3),("stamp",23.35,-3),("drawer",23.5,-8),
         ("jar",27.9,-5),("signing",37.0,-9),("keys",43.95,-2),("stamp",44.65,-2),
         ("whoosh",48.35,-5),("whoosh",58.7,-5),("outro",65.8,-3)]
TOTAL = 69.08
args, fil = ["ffmpeg","-y","-loglevel","error","-i","arc-guard-demo.mp4"], []
n = 1
vo_labels = []
for t,i in VO:
    args += ["-i", f(f"vo/{i}")]
    ms = int(t*1000); fil.append(f"[{n}:a]aresample=44100,adelay={ms}|{ms}[v{n}]"); vo_labels.append(f"[v{n}]"); n += 1
sfx_labels = []
for name,t,db in CUES:
    args += ["-i", f(f"sfx/{name}")]
    ms = int(t*1000); fil.append(f"[{n}:a]aresample=44100,volume={db}dB,adelay={ms}|{ms}[s{n}]"); sfx_labels.append(f"[s{n}]"); n += 1
args += ["-stream_loop","-1","-i", f("sfx/ambient")]
fil.append(f"[{n}:a]aresample=44100,atrim=0:{TOTAL},volume=-26dB,afade=t=in:d=1.5,afade=t=out:st={TOTAL-2.5}:d=2.5[amb]")
fil.append("".join(vo_labels)+f"amix=inputs={len(vo_labels)}:normalize=0,apad=whole_dur={TOTAL},asplit=2[vo][vokey]")
fil.append("".join(sfx_labels)+f"[amb]amix=inputs={len(sfx_labels)+1}:normalize=0,apad=whole_dur={TOTAL}[sfxraw]")
fil.append("[sfxraw][vokey]sidechaincompress=threshold=0.02:ratio=5:attack=15:release=350:makeup=1[sfx]")
fil.append(f"[vo][sfx]amix=inputs=2:normalize=0,atrim=0:{TOTAL},loudnorm=I=-15:TP=-1.5:LRA=11[aout]")
fil.append("[0:v]tpad=stop_mode=clone:stop_duration=2[vout]")
args += ["-filter_complex",";".join(fil),"-map","[vout]","-map","[aout]","-c:v","libx264","-pix_fmt","yuv420p","-crf","20",
         "-c:a","aac","-b:a","192k","-t",str(TOTAL),"-movflags","+faststart","arc-guard-demo-final.mp4"]
subprocess.run(args, check=True)
print("ok", len(CUES), "cues")
