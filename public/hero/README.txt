Hero landing slideshow images.

Drop your 15 cinematic background images into this folder, named:
  slide-01.jpeg
  slide-02.jpeg
  slide-03.jpeg
  ...
  slide-15.jpeg

Naming rules:
- Lowercase "slide-" prefix.
- Two-digit zero-padded index (slide-01, not slide-1) so file managers sort correctly.
- .jpeg extension (must match exactly — .jpg will NOT be picked up).
  To use .png or .webp, edit the file extension in
  src/components/Hero/HeroLanding.tsx (the buildSlides function).

Recommended specs:
- Dimensions: 1920x1080 minimum (will be cover-cropped, so anything wider/taller is fine).
- File size: aim for <250 KB per image (compress with squoosh.app or similar).
  15 slides x 250 KB = ~3.75 MB total slideshow weight.
- Format: JPEG with 80-85 quality, or WebP for ~30% smaller files.
- Subject: keep important focal content roughly in the upper half — the
  "NUREN GROUP" title and subtitle anchor to the lower 12-14vh.

To add or remove slides, just change SLIDE_COUNT at the top of
src/components/Hero/HeroLanding.tsx and add/remove matching files here.
No imports to update — files in /public are served verbatim.
