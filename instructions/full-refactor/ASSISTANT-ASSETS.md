# mini Douglas — character asset contract and recording guide

> For Douglas. The assistant (stage 5) already ships with an original SVG placeholder. When the recorded clips below exist, drop them in `public/assistant/`, set `ASSISTANT_MEDIA.ready = true` in `lib/assistant/media.ts`, and nothing else changes: the same `AssistantCharacter` component switches from the placeholder to the videos.

## The contract

| File | Format | Loop | Used when |
|------|--------|------|-----------|
| `public/assistant/idle.webm` | VP9 + alpha (WebM) | 4–6 s, seamless | Standing around (Chromium, Firefox, Android) |
| `public/assistant/talk.webm` | VP9 + alpha | 2–3 s, seamless | A balloon is open |
| `public/assistant/dance.webm` | VP9 + alpha | 3.5–4 s, seamless | Click on him (dances ~3.5 s) and, from stage 8, while music plays |
| `public/assistant/idle.mov` | HEVC + alpha (`hvc1`) | same | Safari (macOS) and every iOS/iPadOS browser |
| `public/assistant/talk.mov` | HEVC + alpha | same | ″ |
| `public/assistant/dance.mov` | HEVC + alpha | same | ″ |
| `public/assistant/poster.png` | PNG with transparency | — | First paint, **reduced motion**, and fallback if a video can't play |

**Why two video formats.** Apple's WebKit plays VP9 but drops its alpha channel (you'd get a black box), so Safari/iOS get HEVC-with-alpha. Chromium on macOS may claim HEVC support but ignores HEVC alpha, so the format is picked in JS (`pickMediaFormat`, unit-tested), not by `<source>` order. Animated WebP/APNG were considered as the Safari fallback and rejected: 10–20× heavier for the same loop, no hardware decoding.

**Display box:** 96 × 112 CSS px on desktop, 60 × 70 on phones (aspect **6:7**). Videos are muted, looped, `playsInline`, and only load after the desktop is interactive (lazy chunk + idle callback).

## Weight budget (hard limits)

| Asset | Max per file |
|-------|--------------|
| `idle` | 400 KB |
| `talk` | 250 KB |
| `dance` | 500 KB |
| `poster.png` | 60 KB |
| **Total per browser** (3 clips of one format + poster) | **≤ 1.2 MB** |

If a file is over budget: lower the CRF quality (higher number) / bitrate first, then the frame rate (24 → 20 fps), then shorten the loop. Don't go below 240 × 280.

## Recording (green screen)

1. **Backdrop:** chroma-green (or blue) fabric/paper, smooth and evenly lit, **no wrinkles or shadows on it**. Stand 1.5–2 m in front of it so you don't cast a shadow or pick up green spill.
2. **Lighting:** two soft lights on the backdrop (even), one soft key light on you, ideally a rim/back light to separate hair from the background.
3. **You:** full body, head to feet, with ~10% margin on every side. **No green clothes or accessories**; avoid fine stripes and very reflective glasses. Same outfit in every clip (the hoodie look of the placeholder is a nice match).
4. **Camera:** on a tripod, **locked** (no autofocus hunting, fixed exposure and white balance), portrait orientation, 1080 × 1920 (or 4K) at 25 or 30 fps. Phone camera is fine.
5. **Clips** — record each one 3–4 times, ~10 s long, and we pick the best loop:
   - **idle**: relaxed, small breathing/weight shift, one blink or look around. Start and end in the **same neutral pose** (that's what makes the loop seamless).
   - **talk**: as if explaining something friendly; light hand gestures; mouth moving (no sound needed). Same start/end pose.
   - **dance**: a fun 4-second move you can repeat (e.g. side steps with arm swings). Same start/end pose.
   - **poster**: a still frame, neutral and smiling, looking at the camera (can be taken from `idle`).
6. Sound is not used (all clips are muted).

## Encoding (ffmpeg)

Pick each loop's in/out points first (`-ss` start, `-t` duration). `0x00B140` is a typical chroma green; sample your real backdrop color from a frame if the key is weak.

```bash
# 1) Key, crop and scale to a master with alpha (ProRes 4444), per clip.
#    Adjust crop=w:h:x:y so you're centered with the 6:7 aspect (e.g. 900:1050:90:500 on 1080x1920).
ffmpeg -ss 2.0 -t 4.0 -i raw-idle.mov \
  -vf "chromakey=0x00B140:0.13:0.06,despill=type=green,crop=900:1050:90:500,scale=240:280:flags=lanczos,fps=24,format=yuva444p10le" \
  -c:v prores_ks -profile:v 4444 -an idle-master.mov

# 2) WebM VP9 + alpha (Chromium / Firefox / Android).
ffmpeg -i idle-master.mov -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 36 \
  -row-mt 1 -deadline good -auto-alt-ref 0 -an public/assistant/idle.webm

# 3) HEVC + alpha (Safari / iOS). Needs macOS (VideoToolbox) — run it on the Mac.
ffmpeg -i idle-master.mov -pix_fmt bgra -c:v hevc_videotoolbox -alpha_quality 0.75 -allow_sw 1 \
  -b:v 600k -tag:v hvc1 -an public/assistant/idle.mov

# 4) Poster: one transparent frame from the idle master.
ffmpeg -ss 0 -i idle-master.mov -frames:v 1 -pix_fmt rgba public/assistant/poster.png
```

Repeat 1–3 for `talk` and `dance`. Then check:

```bash
ls -lh public/assistant/                       # sizes vs. the budget above
ffprobe -v error -show_entries stream=codec_name,pix_fmt,width,height public/assistant/idle.webm
# Visual check: open the page in Chrome AND Safari — the character must have no box around him.
```

If the edge has a green fringe, raise the `despill` effect or lower the chromakey similarity (`0.13` → `0.10`); if parts of you disappear, raise the similarity a little or improve the backdrop lighting.

## Switching on

1. Copy the 7 files into `public/assistant/`.
2. `lib/assistant/media.ts` → `ready: true`.
3. `npm run build && npm run start`, check desktop Chrome, Safari, an iPhone and reduced motion (poster only).

**Heads-up:** the placeholder follows the cursor with its eyes and makes faces (curious / happy / sleepy / surprised — DESKTOP-INTERFACE-SPEC §13 → Cursor gaze). Recorded clips can't do that, so once `ready` is true the character just plays the idle/talk/dance loops and the gaze is ignored.
