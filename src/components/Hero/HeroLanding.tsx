import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const SLIDE_COUNT = 15;
// Each slide holds steady on screen, then cross-fades into the next.
// Slightly longer hold + longer fade gives a more cinematic, story-like pace.
const SLIDE_DURATION_MS = 7000;
const FADE_MS = 2000;

// Shared Enter button styling — used by both the desktop (absolute, cinematic
// position) and mobile/tablet (stacked above title) Enter buttons so the
// visual styling stays in sync without duplication drift.
const ENTER_BTN_CLASS =
  'px-12 py-3 rounded-full bg-black/15 text-white text-base sm:text-lg font-light tracking-wide ' +
  'hover:bg-[#ee5174] hover:shadow-lg hover:shadow-[#ee5174]/30 ' +
  'active:bg-[#ee5174] active:shadow-lg active:shadow-[#ee5174]/30 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ee5174]/60 transition-all';

const buildSlides = (count: number): string[] =>
  Array.from({ length: count }, (_, i) => `/hero/slide-${String(i + 1).padStart(2, '0')}.jpeg`);

export const HeroLanding = () => {
  const slides = useMemo(() => buildSlides(SLIDE_COUNT), []);
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, SLIDE_DURATION_MS);
    return () => window.clearInterval(id);
  }, [slides.length]);

  // Warm the next image so the cross-fade isn't waiting on the network.
  useEffect(() => {
    const next = (index + 1) % slides.length;
    const img = new Image();
    img.src = slides[next];
  }, [index, slides]);

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
        <link rel="preload" as="image" href={slides[0]} />
      </Helmet>

      {/* Slideshow — each slide holds still and cross-fades into the next.
          Two-layer technique so the full illustration is always visible at
          every screen size (mobile included):
            (1) Blurred copy with `cover` fills the viewport as ambient
                backdrop, so portrait-phone empty bands don't read as dead
                black space — they pick up the slide's dominant colors.
            (2) Foreground with `contain` shows the entire illustration
                without cropping, regardless of viewport aspect ratio. */}
      <AnimatePresence mode="sync">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_MS / 1000, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        >
          {/* Blurred ambient backdrop — fills the viewport at every screen
              size so the empty space around the contained foreground always
              picks up the slide's mood instead of showing flat black. */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              backgroundImage: `url(${slides[index]})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              filter: 'blur(40px) brightness(0.7)',
              transform: 'scale(1.15)',
            }}
          />
          {/* Foreground — full illustration visible at every viewport. On
              portrait phones the empty bands above/below are filled by the
              blurred backdrop above, not flat black. */}
          <div
            className="absolute inset-0 w-full h-full bg-center bg-no-repeat bg-contain"
            style={{ backgroundImage: `url(${slides[index]})` }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Whisper-soft uniform dim — no visible "band" cutting across the
          composition. Just enough darkening to give the foreground text a
          subtle contrast lift against bright slides. */}
      <div className="absolute inset-0 bg-black/15 pointer-events-none" />

      {/* Foreground content. */}
      <div className="relative z-10 w-full h-full">
        {/* Desktop Enter button — absolute cinematic position high above the
            title. Only shown on lg+ (>=1024px); on smaller screens the button
            is rendered inside the title cluster below instead, so it sits
            directly above the title and stays clear of the slideshow content. */}
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
              Whichever dimension is more constrained wins. Capped at 120pt so
              ultrawide 4K monitors don't get an absurdly oversized title. */}
          <h1 className="font-montserrat font-bold text-[#ee5174] tracking-tight text-center leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)] px-6 text-[clamp(28pt,min(7.5vw,11vh),120pt)]">
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
