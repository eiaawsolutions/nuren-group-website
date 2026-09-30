Hero landing background video.

The landing page (/) plays:
  hero_section_video.mp4

To swap the video, replace that file (keep the same name), or change
HERO_VIDEO_SRC at the top of src/components/Hero/HeroLanding.tsx.
No imports to update — files in /public are served verbatim.

Recommended specs:
- Format: MP4, H.264 video codec (plays on every iOS and Android browser).
  Avoid HEVC/H.265 or AV1 — not supported everywhere.
- Resolution: 1920x1080 for crisp display on laptops/monitors
  (the video is shown in full, never cropped, at every screen size).
- File size: aim for under ~10 MB — it's committed to git and every
  visitor downloads it.
- Audio: none needed. The video always plays muted (browsers only allow
  muted autoplay).
- Export with "fast start" / "web optimized" enabled so playback begins
  before the whole file has downloaded.
- Keep important content away from the bottom ~20% — the "NUREN GROUP"
  title, subtitle and Enter button sit there.

The slide-01.jpeg ... slide-15.jpeg files are the old slideshow images.
They are kept for reference but are no longer shown on the hero page.
