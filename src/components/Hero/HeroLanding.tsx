import { useEffect, useRef } from 'react';
import type { VideoHTMLAttributes } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

// Background video served from public/hero/. The `#t=0.001` media fragment
// nudges iOS Safari into painting the first frame even when it refuses to
// autoplay (Low Power Mode), so the splash never sits on a blank rectangle.
// The old slide-XX.jpeg files remain in public/hero/ but are no longer used.
const HERO_VIDEO_SRC = '/hero/hero_section_video.mp4#t=0.001';

// Shared by the backdrop and foreground <video>. Autoplay only works on
// mobile when the video is muted AND inline (`playsInline` stops iOS from
// forcing fullscreen). PiP / remote-playback are disabled so Chrome/Safari
// don't overlay cast or picture-in-picture buttons on a decorative video.
const VIDEO_PROPS: VideoHTMLAttributes<HTMLVideoElement> = {
  src: HERO_VIDEO_SRC,
  autoPlay: true,
  muted: true,
  loop: true,
  playsInline: true,
  preload: 'auto',
  disablePictureInPicture: true,
  disableRemotePlayback: true,
  tabIndex: -1,
};

// Shared Enter button styling — used by both the desktop (absolute, cinematic
// position) and mobile/tablet (stacked above title) Enter buttons so the
// visual styling stays in sync without duplication drift.
const ENTER_BTN_CLASS =
  'px-12 py-3 rounded-full bg-black/15 text-white text-base sm:text-lg font-light tracking-wide ' +
  'hover:bg-[#ee5174] hover:shadow-lg hover:shadow-[#ee5174]/30 ' +
  'active:bg-[#ee5174] active:shadow-lg active:shadow-[#ee5174]/30 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ee5174]/60 transition-all';

export const HeroLanding = () => {
  const navigate = useNavigate();
  const backdropRef = useRef<HTMLVideoElement>(null);
  const foregroundRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videos = [backdropRef.current, foregroundRef.current].filter(
      (v): v is HTMLVideoElement => v !== null,
    );

    // React sets `muted` as a DOM property only, never as an HTML attribute,
    // so the prerendered HTML would otherwise ship an unmuted autoplay video
    // — which every mobile browser blocks. Set property and attribute both.
    videos.forEach((v) => {
      v.muted = true;
      v.defaultMuted = true;
      v.setAttribute('muted', '');
    });

    // Honour the OS "reduce motion" setting: hold the first frame instead of
    // looping. Re-evaluated live if the user flips the setting.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const play = () => videos.forEach((v) => v.play().catch(() => {}));
    const pause = () => videos.forEach((v) => v.pause());
    const syncMotion = () => (reduceMotion.matches ? pause() : play());
    syncMotion();

    // Autoplay can still be refused (iOS Low Power Mode, Android Data Saver).
    // Retry on the first tap/click anywhere so it starts as soon as the
    // visitor interacts.
    const retryPlay = () => {
      if (!reduceMotion.matches) play();
    };
    window.addEventListener('pointerdown', retryPlay, { once: true });
    reduceMotion.addEventListener('change', syncMotion);
    return () => {
      window.removeEventListener('pointerdown', retryPlay);
      reduceMotion.removeEventListener('change', syncMotion);
    };
  }, []);

  const handleEnter = () => {
    navigate('/home');
  };

  // `h-dvh` (dynamic viewport height) measures the ACTUAL visible area on
  // mobile, accounting for the URL bar and bottom nav. Plain `100vh` measures
  // the largest possible viewport (URL bar collapsed), which pushes content
  // off-screen when the browser chrome is showing.
  return (
    <div className="fixed inset-0 w-screen h-dvh overflow-hidden bg-black">
      <Helmet>
        <title>Nuren Group · Empower Women in Parenting, Education & Maternity Wellness</title>
        <meta
          name="description"
          content="Nuren Group — Southeast Asia's leading community-powered commerce platform, empowering women in parenting, education, and maternity wellness."
        />
        {/* Point search engines at the rich /home page so the splash doesn't dilute SEO. */}
        <link rel="canonical" href="https://nurengroup.com/home" />
        {/* iOS paints the notch / home-indicator safe areas with the page
            background in landscape — make it black here (instead of the
            site-wide white) so no white bars flank the video. `!` is needed
            because the global `body` rule in index.css is unlayered. Helmet
            removes the class again when navigating to /home. */}
        <body className="bg-black!" />
      </Helmet>

      {/* Background video — same two-layer technique the slideshow used, so
          the full frame is always visible at every aspect ratio (portrait
          phones, fold screens, tablets, laptops, ultrawide monitors):
            (1) Blurred `cover` copy fills the viewport as an ambient
                backdrop, so letterbox bands pick up the video's colours
                instead of reading as dead black space.
            (2) `contain` foreground shows the entire frame, never cropped.
          Purely decorative: hidden from assistive tech, and pointer events
          are off so long-press doesn't open iOS/Android "save video" menus. */}
      <div className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        <video
          ref={backdropRef}
          {...VIDEO_PROPS}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'blur(40px) brightness(0.7)', transform: 'scale(1.15)' }}
        />
        <video
          ref={foregroundRef}
          {...VIDEO_PROPS}
          className="absolute inset-0 w-full h-full object-contain"
        />
      </div>

      {/* Whisper-soft uniform dim — no visible "band" cutting across the
          composition. Just enough darkening to give the foreground text a
          subtle contrast lift against bright frames. */}
      <div className="absolute inset-0 bg-black/15 pointer-events-none" />

      {/* Foreground content. */}
      <div className="relative z-10 w-full h-full">
        {/* Desktop Enter button — absolute cinematic position high above the
            title. Only shown on lg+ (>=1024px); on smaller screens the button
            is rendered inside the title cluster below instead, so it sits
            directly above the title and stays clear of the video content. */}
        <div className="hidden lg:block absolute left-1/2 top-[68%] -translate-x-1/2 -translate-y-1/2">
          <motion.button
            onClick={handleEnter}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className={ENTER_BTN_CLASS}
            aria-label="Enter the Nuren Group website"
          >
            Enter
          </motion.button>
        </div>

        {/* Title + subtitle anchored near the bottom of the viewport.
            No horizontal padding on the parent — the subtitle row needs the
            full viewport width so its flanking lines reach the screen edges.
            The title gets its own px-6 to keep some breathing room on mobile. */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute left-0 right-0 bottom-[5dvh] sm:bottom-[6dvh] md:bottom-[7dvh] flex flex-col items-center"
        >
          {/* Mobile/tablet Enter button — sits directly above the title in
              the stacked cluster. Hidden on lg+ (the desktop button above
              takes over). `display: none` removes it from the tab order and
              accessibility tree on desktop, so there's only ever one
              effective Enter button. */}
          <button
            onClick={handleEnter}
            className={`${ENTER_BTN_CLASS} lg:hidden mb-4 sm:mb-6`}
            aria-label="Enter the Nuren Group website"
          >
            Enter
          </button>
          {/* Montserrat Bold. Sized by min(vw, vh) — scaled by viewport WIDTH
              on narrow screens (mobile portrait) so the title fits on one line,
              and by viewport HEIGHT on short screens (laptop 1366x768) so it
              never grows tall enough to crash into the Enter button above it.
              Whichever dimension is more constrained wins. The floor is
              min(28pt, 10vw) so ultra-narrow screens (fold cover displays,
              ~280px wide) shrink below 28pt instead of clipping; phones
              >=~370px wide still get the full 28pt floor. Capped at 120pt so
              ultrawide 4K monitors don't get an absurdly oversized title. */}
          <h1 className="font-montserrat font-bold text-[#ee5174] tracking-tight text-center leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)] px-6 text-[clamp(min(28pt,10vw),min(7.5vw,11vh),120pt)]">
            NUREN GROUP
          </h1>
          {/* Subtitle row — w-full + parent has no horizontal padding, so the
              flanking lines stretch from screen edge to screen edge.
              On mobile the long subtitle wraps naturally so it never overflows
              past the viewport edge; on tablet+ it stays on one line. */}
          <div className="mt-1 sm:mt-2 md:mt-3 flex items-center gap-3 sm:gap-6 md:gap-8 w-full">
            <div className="flex-1 h-px bg-white/60 min-w-[20px]" />
            {/* Montserrat Medium. Same min(vw, vh) pattern as the title so
                the subtitle stays proportional to the title at every viewport
                — never disproportionately huge on wide monitors or tiny on
                short ones. max-w + whitespace-normal on mobile lets the line
                wrap rather than overflow off the right edge. */}
            <p className="font-montserrat font-medium text-white tracking-[0.05em] text-center whitespace-normal sm:whitespace-nowrap text-[clamp(11pt,min(2vw,2.5vh),32pt)] max-w-[88vw] sm:max-w-none px-2 sm:px-0">
              Empower Women in Parenting, Education &amp; Maternity Wellness
            </p>
            <div className="flex-1 h-px bg-white/60 min-w-[20px]" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};
