import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter, Routes, Route, Link, useLocation, useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { governanceDocs } from './data/governanceDocs';
import { Chatbot } from './components/Chatbot/Chatbot';
import { AdminPage } from './components/Admin/AdminPage';
import { 
  Users, 
  Store, 
  Globe, 
  ChevronRight, 
  ArrowRight, 
  CheckCircle2, 
  BarChart3, 
  Target, 
  Heart, 
  Menu, 
  X,
  ExternalLink,
  Smartphone,
  Zap,
  ShieldCheck,
  Newspaper,
  Play,
  FileText,
  Info,
  Gavel,
  Megaphone,
  Youtube,
  Instagram,
  Mic,
  BookOpen,
  Layers,
  Network,
  Database,
  Share2
} from 'lucide-react';

// --- Components ---

const VideoModal = ({ isOpen, onClose, videoUrl }: { isOpen: boolean, onClose: () => void, videoUrl: string }) => {
  if (!isOpen) return null;

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/);
      const id = match?.[1];
      if (!id) return url;
      const origin = typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : '';
      const params = `autoplay=1&rel=0&playsinline=1&modestbranding=1${origin ? `&origin=${origin}` : ''}`;
      return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
    }
    if (url.includes('instagram.com')) {
      const id = url.split('/reel/')[1]?.split('/')[0] || url.split('/p/')[1]?.split('/')[0];
      return `https://www.instagram.com/reel/${id}/embed`;
    }
    return url;
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            aria-label="Close video"
            className="absolute top-6 right-6 z-10 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors backdrop-blur-md"
          >
            <X size={24} />
          </button>
          <iframe
            src={getEmbedUrl(videoUrl)}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          ></iframe>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const ContactModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    services: [] as string[]
  });
  const [errors, setErrors] = useState({
    name: false,
    email: false,
    message: false
  });

  const servicesList = [
    'Parenting Platform Advertising',
    'Ibuencer Influencer Marketing',
    'Motherhood Marketplace',
    'Data Insights & Analytics',
    'Offline Events & Sampling',
    'Others'
  ];

  const handleCheckboxChange = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    const newErrors = {
      name: !formData.name.trim(),
      email: !formData.email.trim(),
      message: !formData.message.trim()
    };
    
    setErrors(newErrors);

    if (newErrors.name || newErrors.email || newErrors.message) {
      return;
    }

    const servicesText = formData.services.length > 0 ? formData.services.join(', ') : 'None selected';
    const whatsappMessage = `NEW INQUIRY\nName: ${formData.name}\nEmail: ${formData.email}\nServices: ${servicesText}\nMessage: ${formData.message}`;
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/60124238768?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Contact Us</h2>
              <button onClick={onClose} aria-label="Close contact form" className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Name *</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl border ${errors.name ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-nuren-pink focus:border-transparent outline-none transition-all`}
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email *</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-nuren-pink focus:border-transparent outline-none transition-all`}
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Services Needed</label>
                <div className="grid grid-cols-1 gap-2">
                  {servicesList.map(service => (
                    <label key={service} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input 
                          type="checkbox" 
                          checked={formData.services.includes(service)}
                          onChange={() => handleCheckboxChange(service)}
                          className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 checked:border-nuren-pink checked:bg-nuren-pink transition-all"
                        />
                        <CheckCircle2 size={14} className="absolute left-0.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Message *</label>
                <textarea 
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl border ${errors.message ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-nuren-pink focus:border-transparent outline-none transition-all h-32 resize-none`}
                  placeholder="Tell us about your requirements..."
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-nuren-pink text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-nuren-pink/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Submit via WhatsApp
                <Zap size={20} fill="currentColor" />
              </button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

type Breadcrumb = { name: string; url: string };

const SITE_URL = 'https://nurengroup.com';
// TODO: replace with a 1200x630 brand-card OG image. Logo is acceptable
// fallback — most platforms will crop/letterbox to fit.
const DEFAULT_OG = `${SITE_URL}/NurenGroup.jpg`;

const SEO = ({ title, description, keywords, canonical, ogImage, breadcrumbs }: {
  title: string,
  description: string,
  keywords?: string,
  canonical?: string,
  ogImage?: string,
  breadcrumbs?: Breadcrumb[],
}) => {
  const canonicalUrl = canonical || `${SITE_URL}/`;
  const image = ogImage || DEFAULT_OG;

  // BreadcrumbList JSON-LD — Google shows breadcrumbs in the SERP snippet
  // and AI search engines use it to understand site hierarchy.
  const breadcrumbLd = breadcrumbs && breadcrumbs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.name,
      item: b.url.startsWith('http') ? b.url : `${SITE_URL}${b.url}`,
    })),
  } : null;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* hreflang — same English content serves MY (primary), SG, and the
          x-default fallback. Add `th` once Thai-language content exists. */}
      <link rel="alternate" hrefLang="en-MY" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en-SG" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* Geo */}
      <meta name="geo.region" content="MY-10" />
      <meta name="geo.placename" content="Kuala Lumpur" />
      <meta name="geo.position" content="3.1390;101.6869" />
      <meta name="ICBM" content="3.1390, 101.6869" />

      {/* Distribution */}
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Nuren Group" />
      <meta property="og:locale" content="en_MY" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {breadcrumbLd && (
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      )}
    </Helmet>
  );
};

const Navbar = ({ onContactClick }: { onContactClick: () => void }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Ecosystem', href: '/ecosystem' },
    { name: 'Products', href: '/products' },
    { name: 'For Brands', href: '/#brands' },
    { name: 'Investors', href: '/investors' },
    { name: 'Careers', href: '/careers' },
  ];

  const isHome = location.pathname === '/';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || !isHome ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/NurenGroup.jpg" alt="Nuren Group Logo" className="h-10 w-auto object-contain" referrerPolicy="no-referrer" />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            link.href.startsWith('/#') ? (
              <a 
                key={link.name} 
                href={link.href} 
                className="text-sm font-medium text-slate-600 hover:text-nuren-pink transition-colors"
              >
                {link.name}
              </a>
            ) : (
              <Link 
                key={link.name} 
                to={link.href} 
                className={`text-sm font-medium transition-colors ${location.pathname === link.href ? 'text-nuren-pink' : 'text-slate-600 hover:text-nuren-pink'}`}
              >
                {link.name}
              </Link>
            )
          ))}
          <button 
            onClick={onContactClick}
            className="bg-nuren-pink text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-nuren-pink/90 transition-all shadow-lg shadow-nuren-pink/20"
          >
            Partner with Us
          </button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-slate-900"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white border-t border-slate-100 p-6 md:hidden shadow-xl"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                link.href.startsWith('/#') ? (
                  <a 
                    key={link.name} 
                    href={link.href} 
                    className="text-lg font-medium text-slate-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link 
                    key={link.name} 
                    to={link.href} 
                    className={`text-lg font-medium ${location.pathname === link.href ? 'text-nuren-pink' : 'text-slate-700'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                )
              ))}
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onContactClick();
                }}
                className="w-full bg-nuren-pink text-white py-4 rounded-xl font-bold mt-4"
              >
                Partner with Us
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = () => {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const videoId = "r0SxrRvigO0";
  const videoUrl = `https://youtu.be/${videoId}?si=WEozAR5uvEhxS1u_`;
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-gradient-to-l from-nuren-pink/5 to-transparent rounded-bl-[200px]" />
      <div className="absolute -top-24 -left-24 -z-10 w-96 h-96 bg-nuren-purple/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nuren-pink/10 text-nuren-pink text-xs font-bold uppercase tracking-wider mb-6">
              <Zap size={14} />
              Growth Engine for Brands
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] mb-6 text-slate-900">
              Empowering Families <br />
              <span className="text-nuren-pink">Across Southeast Asia</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-xl">
              Nuren Group is a community-driven digital ecosystem connecting brands with highly engaged audiences through trusted platforms, data, and technology.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/ecosystem" className="bg-slate-900 text-white px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:bg-slate-800 transition-all group">
                Explore Our Ecosystem
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <button 
                onClick={() => setActiveVideo(videoUrl)}
                className="border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-full font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                Watch Video
                <Play size={20} fill="currentColor" />
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div 
              className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-8 border-white group cursor-pointer aspect-video"
              onClick={() => setActiveVideo(videoUrl)}
            >
              <img
                src={thumbnailUrl}
                alt="Nuren Group Featured Video"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                <div className="relative">
                  <div className="absolute -inset-4 bg-nuren-pink/30 rounded-full blur-xl animate-pulse group-hover:bg-nuren-pink/50 transition-colors" />
                  <div className="relative w-20 h-20 bg-white text-nuren-pink rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
                    <Play size={32} fill="currentColor" className="ml-1" />
                  </div>
                </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-sm font-bold tracking-wide uppercase">Nuren Group Ecosystem</span>
                <span className="text-xs bg-black/40 px-2 py-1 rounded backdrop-blur-sm">0:45</span>
              </div>
            </div>
            {/* Floating Cards */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -right-6 z-20 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Active Users</p>
                <p className="text-lg font-bold text-slate-900">5 Million+</p>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-6 -left-6 z-20 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-nuren-pink/10 text-nuren-pink rounded-full flex items-center justify-center">
                <Store size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Merchants</p>
                <p className="text-lg font-bold text-slate-900">5,000+</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <VideoModal 
        isOpen={!!activeVideo} 
        onClose={() => setActiveVideo(null)} 
        videoUrl={activeVideo || ''} 
      />
    </section>
  );
};

const Stats = () => {
  const stats = [
    { icon: <Users />, value: '5M+', label: 'Active Users', color: 'bg-blue-50 text-blue-600' },
    { icon: <Store />, value: '5,000+', label: 'Brands & Merchants', color: 'bg-pink-50 text-pink-600' },
    { icon: <Globe />, value: '3', label: 'Countries (MY, SG, TH)', color: 'bg-purple-50 text-purple-600' },
    { icon: <Smartphone />, value: '4+', label: 'Digital Platforms', color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
                {stat.icon}
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</h3>
              <p className="text-slate-500 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Data ---

const products = [
  { 
    name: 'Motherhood.com.my', 
    desc: "Malaysia's #1 parenting marketplace and community, offering brands direct access to a high-intent audience of millions of parents.",
    image: '/motherhood.jpg',
    platformLink: 'https://home.motherhood.com.my/',
  },
  { 
    name: 'Kelabmama', 
    desc: 'A premium content ecosystem where brands can integrate into trusted narratives, reaching a loyal community of engaged mothers.',
    image: '/Kelabmama.png',
    platformLink: 'https://kelabmama.com',
  },
  { 
    name: 'Ibuencer.com', 
    desc: "The region's largest mom-influencer network, driving authentic brand advocacy and high-impact social commerce through 10,000+ creators.",
    image: '/ibuencer.png',
    platformLink: 'https://www.ibuencer.com/',
    videoLink: 'https://youtu.be/5JZt0qRkPsQ?si=9qvCEB4hZ2Hv4vOQ'
  },
  { 
    name: 'Parentcraft', 
    desc: 'A specialized educational platform for brands to establish thought leadership and provide value-added skills to new and expecting parents.',
    image: '/parentcraft.png',
    platformLink: 'https://www.motherhood.com.my/event/parentcraft-class',
    videoLink: 'https://youtu.be/bJjLpYrekNs'
  },
  { 
    name: 'Ask Me Doctor', 
    desc: 'A high-trust medical advice platform where healthcare and wellness brands can connect with families through expert-led content.',
    image: '/askmeDoctor.jpg',
    platformLink: 'https://home.motherhood.com.my/',
    videoLink: 'https://youtu.be/PquKkf4wM14?si=1uFO1G2aR2T9e_1F'
  },
  { 
    name: 'Motherhood Choice Award', 
    desc: "The gold standard of parenting excellence, providing brands with the ultimate seal of approval from Malaysia's largest voting community.",
    image: '/motherhoodchoiceawards.jpg',
    platformLink: 'https://www.motherhood.com.my/motherhood-award-2025',
    videoLink: 'https://youtu.be/4mkAcSU5GF4?si=H1N_85b9lL77eXla'
  },
  { 
    name: 'Nuren.asia', 
    desc: 'A dynamic lifestyle platform for Gen Z and young women, offering brands a gateway to the next generation of female consumers.',
    image: '/nuren21.jpg',
    platformLink: 'https://nuren.asia/',
  },
  { 
    name: 'Motherhood SuperApp', 
    desc: 'A data-driven mobile companion that keeps your brand at the fingertips of modern parents throughout their daily parenting journey.',
    image: '/MotherhoodSuperapp.png',
    platformLink: 'https://m.motherhood.com.my/',
  },
  { 
    name: 'Motherhood AI (MAI)', 
    desc: 'An intelligent AI-powered parenting companion providing personalized guidance, health tracking, and instant expert support for modern families.',
    image: '/MAI.png',
    platformLink: 'https://m.motherhood.com.my/',
    videoLink: 'https://youtu.be/i0p--rmPeAM?si=ykThmaNNb2zga4h0'
  },
  { 
    name: 'Superkids', 
    desc: "An interactive development hub where children's brands can engage families through creative content and educational activities.",
    image: '/superkids.png',
    platformLink: 'https://m.motherhood.com.my/superkid-infopage',
  },
  { 
    name: 'New Mom Program', 
    desc: 'A targeted loyalty ecosystem that allows brands to build long-term relationships with parents from the very start of their journey.',
    image: '/newmom.png',
    platformLink: 'https://www.motherhood.com.my/newmom-program',
  },
  { 
    name: 'Money Smart Mama', 
    desc: 'Empowering women with financial confidence, this program offers a unique space for financial and household brands to support family prosperity.',
    image: '/moneysmartmama.jpg',
    videoLink: 'https://youtu.be/-BTyNleKKyQ?si=sF491bwXBVOI0Ye0'
  },
  { 
    name: 'MamaCubaTry', 
    desc: 'The ultimate sampling and social review engine, enabling brands to generate authentic feedback, UGC, and massive share of voice.',
    image: '/mamacubatry.jpg',
    platformLink: 'https://m.motherhood.com.my/mamacubatry-product',
  },
  { 
    name: 'Creator Food Network', 
    desc: 'A specialized culinary community connecting food and kitchen brands with passionate home cooks and family-focused food creators.',
    image: '/Creatorfoodnetwork.jpg',
    platformLink: 'https://www.tiktok.com/@creatorfoodnetwork',
  },
  { 
    name: 'School Outreach Program', 
    desc: 'An organized school tour program featuring curated workshops and sampling activations, creating an educational, enriching, and fun learning experience for children while offering brands direct engagement in a trusted school environment.',
    image: '/schooloutreach.png',
    platformLink: 'https://www.motherhood.com.my/',
  },
  { 
    name: 'Nuren Insights', 
    desc: 'A specialized data and research platform providing brands with deep insights into Southeast Asian family consumption patterns and trends.',
    image: '/Success-motherhoodchoiceaward.png',
    platformLink: 'https://nuren.asia/',
  }
];

const Products = ({ showAll = false }: { showAll?: boolean }) => {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const displayProducts = showAll ? products : products.slice(0, 4);

  return (
    <section id="products" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Our Products & Platforms</h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            We operate a diverse ecosystem of digital products designed to support families and empower women.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {displayProducts.map((product, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -10 }}
              className="group bg-white rounded-2xl md:rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col"
            >
              <div className="relative aspect-video md:h-56 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
                {product.videoLink && (
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button 
                      onClick={() => setActiveVideo(product.videoLink!)}
                      className="bg-white text-nuren-pink p-4 rounded-full shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300 hover:bg-nuren-pink hover:text-white"
                    >
                      <Play size={28} fill="currentColor" />
                    </button>
                  </div>
                )}
              </div>
              <div className="p-4 md:p-8 flex-1 flex flex-col">
                <h3 className="text-lg md:text-2xl font-bold text-slate-900 mb-2 md:mb-3">{product.name}</h3>
                <p className="text-slate-600 text-xs md:text-sm leading-relaxed mb-4 md:mb-6 flex-1 line-clamp-3 md:line-clamp-none">
                  {product.desc}
                </p>
                <div className="flex flex-col gap-2 md:gap-3">
                  {product.platformLink && (
                    <a 
                      href={product.platformLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full bg-slate-900 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                    >
                      View Platform
                      <ExternalLink size={16} />
                    </a>
                  )}
                  {product.videoLink && (
                    <button 
                      onClick={() => setActiveVideo(product.videoLink!)}
                      className="w-full border-2 border-slate-100 text-slate-700 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                    >
                      View Video
                      <Play size={16} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {!showAll && (
          <div className="mt-16 text-center">
            <Link 
              to="/products" 
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-slate-800 transition-all shadow-xl"
            >
              More Offerings
              <ArrowRight size={20} />
            </Link>
          </div>
        )}
      </div>

      <VideoModal 
        isOpen={!!activeVideo} 
        onClose={() => setActiveVideo(null)} 
        videoUrl={activeVideo || ''} 
      />
    </section>
  );
};

const CaseStudies = () => {
  const cases = [
    {
      title: "Scott's reached 2 million mums via Ibuencer from Rainbow Gummies virtual launch",
      desc: "How Scott's leveraged the Ibuencer network to achieve massive reach and engagement for their new product launch.",
      image: "/Success-scotts.png",
      link: "https://marketingmagazine.com.my/scotts-reached-2-million-mums-via-ibuencer-from-rainbow-gummies-virtual-launch/",
      tags: ["FMCG", "Influencer Marketing", "Launch"]
    },
    {
      title: "Motherhood Choice Awards: Driving Brand Trust & Sales",
      desc: "A look at how the annual awards program helps brands build long-term credibility with Southeast Asian mothers.",
      image: "/Success-motherhoodchoiceaward.png",
      link: "https://www.motherhood.com.my/motherhood-award-2025",
      tags: ["Awards", "Community", "Trust"]
    }
  ];

  return (
    <section id="casestudies" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Success Stories</h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Discover how we've helped leading brands achieve exceptional results through our community-powered ecosystem.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {cases.map((item, idx) => (
            <motion.a
              key={idx}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group block"
            >
              <div className="relative aspect-[16/10] rounded-[32px] overflow-hidden mb-8 shadow-lg">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                  <span className="text-white font-bold flex items-center gap-2">
                    Read Full Case Study <ArrowRight size={20} />
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                {item.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 group-hover:text-nuren-pink transition-colors leading-tight mb-4">
                {item.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {item.desc}
              </p>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

const Newsroom = () => {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  return (
    <section id="newsroom" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Newsroom</h2>
            <p className="text-slate-600 max-w-xl text-lg">
              Stay updated with the latest news, events, and media coverage from Nuren Group.
            </p>
          </div>
          <a 
            href="https://nurengroup.com/mediahub" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-slate-50 transition-all"
          >
            Visit Media Hub
            <ExternalLink size={18} />
          </a>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Featured Video */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100 group"
          >
            <div className="relative aspect-video bg-slate-900">
              <button 
                onClick={() => setActiveVideo("https://youtu.be/5uLP2ZA0Wuw?si=F7O7xBoksNlCNaE0")}
                className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60 transition-all w-full h-full"
              >
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-red-600 shadow-2xl transform group-hover:scale-110 transition-transform">
                  <Play size={40} fill="currentColor" />
                </div>
              </button>
            </div>
            <div className="p-8">
              <div className="flex items-center gap-2 text-nuren-pink text-xs font-bold uppercase tracking-wider mb-3">
                <Youtube size={14} />
                Featured Video
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Nuren Group Corporate Overview</h3>
              <p className="text-slate-600 leading-relaxed">
                Discover how Nuren Group is transforming the digital landscape for families across Southeast Asia through our unique community-driven approach.
              </p>
            </div>
          </motion.div>

          {/* Quick News Feed */}
          <div className="space-y-6">
            {[
              { 
                title: "Parenting platform Nuren Group's 10-year journey, SuperApp and NASDAQ IPO plans", 
                date: 'March 2026', 
                category: 'Podcast', 
                link: 'https://www.bfm.my/content/podcast/parenting-platform-nuren-groups-10-year-journey-superapp-and-nasdaq-ipo-plans',
                isPodcast: true
              },
              { 
                title: "Nuren Group champions women's empowerment in the digital trade", 
                date: 'September 2024', 
                category: 'Media',
                link: 'https://themalaysianreserve.com/2024/09/24/nuren-group-champions-womens-empowerment-in-the-digital-trade-through-innovative-platforms/'
              },
              { 
                title: "Enlinea Sdn Bhd celebrates triumph at AOTY & MARKies Awards 2024", 
                date: 'May 2024', 
                category: 'Awards',
                link: 'https://www.marketing-interactive.com/enlinea-sdn-bhd-celebrates-triumph-at-aoty-markies-awards-2024'
              },
              { 
                title: "Nuren Group: A Case Study on Digital Transformation", 
                date: '2024', 
                category: 'Academic',
                link: 'https://ir.uitm.edu.my/id/eprint/55177/'
              },
            ].map((news, idx) => (
              <motion.a 
                key={idx}
                href={news.link || "#"}
                target={news.link ? "_blank" : undefined}
                rel={news.link ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex gap-6 items-center group cursor-pointer"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-nuren-pink/10 group-hover:text-nuren-pink transition-colors">
                  {news.isPodcast ? <Mic size={24} /> : <Newspaper size={24} />}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{news.category}</span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{news.date}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 group-hover:text-nuren-pink transition-colors leading-tight">{news.title}</h4>
                </div>
                <ChevronRight size={20} className="ml-auto text-slate-300 group-hover:text-nuren-pink group-hover:translate-x-1 transition-all flex-shrink-0" />
              </motion.a>
            ))}
            <div className="pt-4">
              <Link 
                to="/media-hub" 
                className="text-slate-900 font-bold flex items-center gap-2 hover:gap-3 transition-all"
              >
                View All News
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <VideoModal 
        isOpen={!!activeVideo} 
        onClose={() => setActiveVideo(null)} 
        videoUrl={activeVideo || ''} 
      />
    </section>
  );
};

const Investors = () => {
  const investorLinks = [
    { 
      title: 'Company Information', 
      desc: 'Detailed directory and market data on NSX.', 
      link: 'https://www.nsx.com.au/marketdata/company-directory/details/NRN/',
      icon: <Info className="text-blue-600" />
    },
    { 
      title: 'Corporate Governance', 
      desc: 'Our commitment to transparency and ethical business practices.', 
      link: '/investors/corporate-governance',
      icon: <Gavel className="text-purple-600" />
    },
    { 
      title: 'Announcements', 
      desc: 'Latest market announcements and regulatory filings.', 
      link: 'https://www.nsx.com.au/marketdata/company-directory/announcements/NRN/',
      icon: <Megaphone className="text-orange-600" />
    },
    { 
      title: 'Financial Reports', 
      desc: 'Annual and periodic financial performance reports.', 
      link: 'https://www.nsx.com.au/marketdata/company-directory/announcements/NRN/',
      icon: <FileText className="text-emerald-600" />
    },
    { 
      title: 'Board of Directors', 
      desc: 'Meet the experienced leaders guiding Nuren Group strategy.', 
      link: '/board-of-directors',
      icon: <Users className="text-pink-600" />
    }
  ];

  return (
    <section id="investors" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Investor Relations</h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Access key information about Nuren Group's performance, governance, and market announcements.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {investorLinks.map((item, idx) => (
            <motion.a 
              key={idx}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-nuren-pink/20 transition-all group"
            >
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-nuren-pink transition-colors">{item.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                {item.desc}
              </p>
              <div className="flex items-center gap-2 text-nuren-pink font-bold text-sm">
                Learn More
                <ExternalLink size={14} />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

const QuickLinks = () => {
  return (
    <section className="py-12 bg-slate-900 text-white/60 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-sm font-medium">
          <span className="text-white font-bold uppercase tracking-widest text-xs">Quick Links:</span>
          <a href="https://nurengroup.com/home" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Nuren Home</a>
          <a href="#products" className="hover:text-white transition-colors">Our Products</a>
          <Link to="/media-hub" className="hover:text-white transition-colors">Media Hub</Link>
          <Link to="/investors" className="hover:text-white transition-colors">Investors</Link>
          <a href="#vision" className="hover:text-white transition-colors">Our Vision</a>
        </div>
      </div>
    </section>
  );
};

const BrandSolutions = ({ onContactClick }: { onContactClick: () => void }) => {
  const solutions = [
    { 
      title: 'Community-led Campaigns', 
      desc: 'Convert high engagement into measurable action through our trusted communities.',
      icon: <Users className="text-blue-600" />
    },
    { 
      title: 'Product Sampling', 
      desc: 'Targeted trial programmes that put your products in the hands of the right consumers.',
      icon: <Zap className="text-orange-600" />
    },
    { 
      title: 'Influencer Strategies', 
      desc: 'Authentic content strategies rooted in trust through our Ibuencer network.',
      icon: <Heart className="text-pink-600" />
    },
    { 
      title: 'Social Media Content Management', 
      desc: 'From ideation to development and community management.',
      icon: <Megaphone className="text-rose-500" />
    },
    { 
      title: 'Content Sponsorship', 
      desc: 'Strategic article and video production coupled with multi-channel marketing to amplify your brand voice.',
      icon: <Newspaper className="text-cyan-600" />
    },
    { 
      title: 'Data-driven Targeting', 
      desc: 'Leverage our deep consumer insights for higher ROI and precise retargeting.',
      icon: <BarChart3 className="text-purple-600" />
    },
    { 
      title: 'Commerce Funnels', 
      desc: 'End-to-end solutions from initial awareness to repeat purchase behavior.',
      icon: <Target className="text-emerald-600" />
    },
    { 
      title: 'Trusted Ecosystem', 
      desc: 'Connect with audiences through platforms they already rely on for daily life.',
      icon: <ShieldCheck className="text-indigo-600" />
    }
  ];

  return (
    <section id="brands" className="py-24 bg-slate-900 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-nuren-pink/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-nuren-purple/10 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-3 gap-16">
          <div className="lg:col-span-1">
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              What We Deliver <br />
              <span className="text-nuren-pink text-5xl">For Brands</span>
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              Nuren partners with leading brands to drive growth through community, data, and technology.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-nuren-pink mt-1 shrink-0" />
                <p className="text-slate-300">Proven user acquisition strategies</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-nuren-pink mt-1 shrink-0" />
                <p className="text-slate-300">Deep FMCG & Healthcare expertise</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-nuren-pink mt-1 shrink-0" />
                <p className="text-slate-300">Measurable growth and ROI</p>
              </div>
            </div>
            <button 
              onClick={onContactClick}
              className="mt-10 bg-white text-slate-900 px-8 py-4 rounded-full font-bold hover:bg-slate-100 transition-all flex items-center gap-2"
            >
              Get Started
              <ArrowRight size={20} />
            </button>
          </div>

          <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
            {solutions.map((sol, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6">
                  {sol.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{sol.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {sol.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const ClientLogos = () => {
  const [activeTab, setActiveTab] = useState('Baby & Kids');

  const pillars = [
    { id: 'Baby & Kids', label: 'Baby & Kids' },
    { id: 'Families & Services', label: 'Families & Services' },
    { id: 'Health & Lifestyle', label: 'Health & Lifestyle' }
  ];

  const logos: Record<string, string[]> = {
    'Baby & Kids': [
      'Anmum.png', 'Applecrumby.png', 'BB Step 3.png', 'Baby Buds.png', 'Baby Carrie.jpg',
      'babyshop.png', 'Bellamy.png', 'Cetaphil.png', 'Drypers.png', 'Enfagrow.jpg',
      'Farm Fresh.jpg', 'Friso.png', 'Genki.png', 'Hoppi.png', 'Huggies.png',
      'Lifebuoy.png', 'Mamypoko.jpg', 'Nappikleen.png', 'Nestle.png', 'Nivea Baby.png',
      'Pet Pet.jpg', 'Philips Avent.png', 'Pigeon.png', 'QV Baby.png', 'Similac.png',
      'Wyeth Nutrition.png'
    ],
    'Families & Services': [
      'Mydin.png', 'Sunway.png', 'Tesco.png', 'Magiclean.jpg', 'KPJ.png', 'download.png',
      'Pantai Hospital.jpg', 'AIA.png', 'Prudential.png', 'Manulife.png',
      'cryocord.png', 'LYC.png', 'IPC.png', 'Eye Level.png', 'Ibis.png',
      'Maybank.png', 'BSN.png', 'I Can Read.png', 'Columbia Asia.png',
      'Gleneagles.png', 'Ecoworld.png', 'Alpha IVF.png', 'Mr DIY.png', 'CItibank.png',
      'Grab.png', 'Sealy.png', 'Zurich.png', 'Touch and go.png', 'Sunlight.png', 'SK Magic.png', 
      'Biore.png', 'Uniqlo.png', 'Spritzer.png', 'samsung.png', 'Ajinomoto.png', 'Bega.png', 
      'Farmers Union.png', 'Jantzen.png', 'HP.png', 'Philips.png', 'Canon.png', 'Sony.png', 
      'ziplock.jpg', 'Melvita.jpg', 'Panasonic.png', 'LG.png'
    ],
    'Health & Lifestyle': [
      'Scotts.jpg', 'Bio oil.png', 'Clearblue.png', 'Zenso-1.png', 'Brands.jpg', 'Vsoy.png', 
      'Tanamera.jpg', 'Bepenthen.jpg', 'wardah.png', 'blackmores.png', 'Pharmaniaga.png', 
      'Nutox.png', 'Nivea.png', 'Biotherm.png', 'Klorane.png', 'Avene.png'
    ]
  };

  return (
    <section className="py-24 bg-white border-y border-slate-100 overflow-hidden">
      <div className="text-center px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Trusted by Industry Leaders</h2>
        <p className="text-slate-500 mb-12 max-w-2xl mx-auto">
          Partnering with over 5,000 brands to drive growth through community-first strategies.
        </p>

        <div className="flex flex-wrap justify-center gap-2 mb-16">
          {pillars.map(pillar => (
            <button
              key={pillar.id}
              onClick={() => setActiveTab(pillar.id)}
              className={`px-8 py-3 rounded-full font-bold transition-all text-sm tracking-wide ${
                activeTab === pillar.id 
                  ? 'bg-nuren-pink text-white shadow-lg shadow-nuren-pink/20' 
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {pillar.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        {/* Gradients for fading edges */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="flex select-none">
          {logos[activeTab].length > 0 ? (
            <motion.div 
              key={activeTab}
              initial={{ x: 0 }}
              animate={{ x: "-50%" }}
              transition={{
                duration: 40,
                repeat: Infinity,
                ease: "linear",
              }}
              className="flex gap-8 whitespace-nowrap"
            >
              {[...logos[activeTab], ...logos[activeTab]].map((logo, idx) => (
                <div 
                  key={`${logo}-${idx}`}
                  className="flex items-center justify-center p-8 bg-white border border-slate-50 rounded-3xl h-32 w-56 hover:shadow-xl hover:shadow-slate-200/50 hover:border-nuren-pink/20 transition-all duration-300 shrink-0"
                >
                  <img
                    src={`/${logo}`}
                    alt={logo.split('.')[0]}
                    className="max-h-full max-w-full object-contain transition-all duration-500"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </motion.div>
          ) : (
            <div className="w-full py-12 text-center text-slate-300 font-medium italic">
              Coming soon - Expanding our ecosystem.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const BoardOfDirectors = () => {
  return (
    <section id="board" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-6">Board of Directors</h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Our Board of Directors comprises seasoned professionals with diverse backgrounds in technology, finance, and healthcare. They provide strategic oversight and guidance to ensure Nuren Group continues to lead the digital family ecosystem in Southeast Asia.
            </p>
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-nuren-pink/10 rounded-full flex items-center justify-center text-nuren-pink shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Strategic Governance</h4>
                  <p className="text-slate-500 text-sm">Ensuring long-term value for all stakeholders.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-nuren-pink/10 rounded-full flex items-center justify-center text-nuren-pink shrink-0">
                  <Globe size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Regional Expertise</h4>
                  <p className="text-slate-500 text-sm">Deep understanding of the SEA market landscape.</p>
                </div>
              </div>
            </div>
            <a 
              href="/board-of-directors" 
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-full font-bold hover:bg-slate-800 transition-all shadow-lg"
            >
              View Full Board
              <ArrowRight size={20} />
            </a>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                    <Info size={24} />
                  </div>
                  <h4 className="font-bold text-slate-900">Market Insight</h4>
                  <p className="text-xs text-slate-500">Public market experience on NSX & beyond.</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-4">
                    <Gavel size={24} />
                  </div>
                  <h4 className="font-bold text-slate-900">Compliance</h4>
                  <p className="text-xs text-slate-500">Adhering to the highest ethical standards.</p>
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
                    <FileText size={24} />
                  </div>
                  <h4 className="font-bold text-slate-900">Reporting</h4>
                  <p className="text-xs text-slate-500">Transparent financial and operational reporting.</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-4">
                    <Megaphone size={24} />
                  </div>
                  <h4 className="font-bold text-slate-900">Communication</h4>
                  <p className="text-xs text-slate-500">Open dialogue with our investor community.</p>
                </div>
              </div>
            </div>
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-nuren-pink/5 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const VisionSection = () => {
  return (
    <section id="vision" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-gradient-to-br from-nuren-pink to-nuren-purple rounded-[40px] p-12 md:p-20 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 100 C 20 0 50 0 100 100" stroke="white" fill="transparent" strokeWidth="0.5" />
              <path d="M0 80 C 30 20 60 20 100 80" stroke="white" fill="transparent" strokeWidth="0.5" />
            </svg>
          </div>

          <div className="max-w-3xl relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
              Our Vision for the Future
            </h2>
            <p className="text-xl md:text-2xl font-light leading-relaxed mb-12 opacity-90">
              "To become Southeast Asia’s leading community-powered commerce and healthcare ecosystem for women and families, transforming how brands connect, engage, and grow in the digital age."
            </p>
            
            <div className="grid md:grid-cols-2 gap-12 border-t border-white/20 pt-12">
              <div>
                <h4 className="text-lg font-bold mb-4 uppercase tracking-widest text-white/70">Our Positioning</h4>
                <p className="text-lg leading-relaxed">
                  Nuren Group is not a traditional marketing agency. We are a community-powered commerce platform that combines media, data, and healthcare ecosystems.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-bold mb-4 uppercase tracking-widest text-white/70">Our Impact</h4>
                <p className="text-lg leading-relaxed">
                  Hundreds of thousands of families engaged across platforms, with a proven ability to drive trials, acquisition, and repeat purchase behavior.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-slate-50 pt-20 pb-10 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <img src="/NurenGroup.jpg" alt="Nuren Group Logo" className="h-10 w-auto object-contain" referrerPolicy="no-referrer" />
            </div>
            <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
              Leading community-driven digital ecosystem focused on empowering women, mothers, and families across Southeast Asia.
            </p>
            <div className="flex gap-4">
              {['Twitter', 'LinkedIn', 'Facebook', 'Instagram'].map(social => (
                <a key={social} href="#" className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-nuren-pink hover:border-nuren-pink transition-all">
                  <span className="sr-only">{social}</span>
                  <Globe size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6">Platforms</h4>
            <ul className="space-y-4 text-slate-500">
              <li><a href="#" className="hover:text-nuren-pink transition-colors">Motherhood.com.my</a></li>
              <li><a href="#" className="hover:text-nuren-pink transition-colors">Kelabmama.com</a></li>
              <li><a href="#" className="hover:text-nuren-pink transition-colors">Ibuencer.com</a></li>
              <li><a href="#" className="hover:text-nuren-pink transition-colors">Nuren.asia</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6">Company</h4>
            <ul className="space-y-4 text-slate-500">
              <li><a href="#" className="hover:text-nuren-pink transition-colors">About Us</a></li>
              <li><Link to="/investors" className="hover:text-nuren-pink transition-colors">Investors</Link></li>
              <li><Link to="/careers" className="hover:text-nuren-pink transition-colors">Careers</Link></li>
              <li><Link to="/media-hub" className="hover:text-nuren-pink transition-colors">Media Hub</Link></li>
              <li><a href="#" className="hover:text-nuren-pink transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
          <p>© 2026 Nuren Group. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-slate-600">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- Media Hub Page ---

const MediaHubPage = ({ onContactClick }: { onContactClick: () => void }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const newsItems = [
    { 
      title: "Parenting platform Nuren Group's 10-year journey, SuperApp and NASDAQ IPO plans", 
      date: 'March 2026', 
      category: 'Podcast', 
      link: 'https://www.bfm.my/content/podcast/parenting-platform-nuren-groups-10-year-journey-superapp-and-nasdaq-ipo-plans',
      isPodcast: true,
      source: "BFM 89.9"
    },
    { 
      title: "Enlinea Sdn Bhd celebrates triumph at AOTY & MARKies Awards 2024", 
      date: 'May 2024', 
      category: 'Awards',
      link: 'https://www.marketing-interactive.com/enlinea-sdn-bhd-celebrates-triumph-at-aoty-markies-awards-2024',
      source: "Marketing Interactive"
    },
    { 
      title: "Nuren Group champions women's empowerment in the digital trade", 
      date: 'September 2024', 
      category: 'Media',
      link: 'https://themalaysianreserve.com/2024/09/24/nuren-group-champions-womens-empowerment-in-the-digital-trade-through-innovative-platforms/',
      source: "The Malaysian Reserve"
    },
    { 
      title: "Nuren Group: A Case Study on Digital Transformation", 
      date: '2024', 
      category: 'Academic',
      link: 'https://ir.uitm.edu.my/id/eprint/55177/',
      source: "UiTM Institutional Repository"
    },
    {
      title: "Motherhood.com.my: Empowering Mothers Through Every Stage",
      date: "2024",
      category: "Feature",
      link: "https://nurengroup.com/mediahub",
      source: "Nuren Group"
    },
    {
      title: "Ibuencer: The Rise of Mom-Influencers in Southeast Asia",
      date: "2024",
      category: "Insight",
      link: "https://nurengroup.com/mediahub",
      source: "Nuren Group"
    }
  ];

  return (
    <div className="pt-20">
      <SEO
        title="Media Hub | Nuren Group - News, Insights & Press"
        description="Stay updated with the latest news, press releases, and media coverage from Nuren Group, Southeast Asia's leading parenting ecosystem."
        keywords="Nuren Group news, media hub, press releases, parenting tech insights, Southeast Asia digital media"
        canonical="https://nurengroup.com/media-hub"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Media Hub', url: '/media-hub' },
        ]}
      />

      {/* Hero Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-4 py-2 bg-nuren-pink/10 text-nuren-pink rounded-full text-sm font-bold mb-6"
            >
              Media Hub
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold text-slate-900 mb-8 leading-tight"
            >
              News, Insights & <span className="text-nuren-pink">Culture</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-600 mb-10 leading-relaxed"
            >
              Discover the latest updates, stories, and collaborative culture that define Nuren Group's journey in Southeast Asia.
            </motion.p>
          </div>
        </div>
      </section>

      {/* News Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newsItems.map((news, idx) => (
              <motion.a 
                key={idx}
                href={news.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-[32px] border border-slate-100 overflow-hidden hover:shadow-2xl transition-all group flex flex-col"
              >
                <div className="p-8 flex-grow">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-nuren-pink/10 group-hover:text-nuren-pink transition-colors">
                      {news.isPodcast ? <Mic size={20} /> : <Newspaper size={20} />}
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">{news.category}</span>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-nuren-pink">{news.source}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-nuren-pink transition-colors leading-tight">
                    {news.title}
                  </h3>
                </div>
                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{news.date}</span>
                  <div className="flex items-center gap-2 text-nuren-pink font-bold text-sm">
                    Read More
                    <ExternalLink size={14} />
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Press Contact */}
      <section className="py-24 bg-slate-900 text-white rounded-[64px] mx-6 mb-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Megaphone className="text-nuren-pink mx-auto mb-8" size={64} />
          <h2 className="text-4xl font-bold mb-6">Media Inquiries</h2>
          <p className="text-slate-400 text-lg mb-10 leading-relaxed">
            For press releases, media kits, or interview requests, please reach out to our communications team.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onContactClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-nuren-pink text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-nuren-pink/90 transition-all shadow-lg shadow-nuren-pink/20"
            >
              Contact Press Team
              <ArrowRight size={20} />
            </button>
            <a 
              href="https://wa.me/60124238768"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-10 py-4 rounded-full font-bold text-lg hover:bg-slate-100 transition-all shadow-lg"
            >
              Media Inquiries
              <ExternalLink size={20} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

// --- Board of Directors Page ---

const BoardOfDirectorsPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const directors = [
    {
      name: "Prof Dr K.Y. Wong",
      role: "Group Chairman, Independent Director",
      image: "/prof-dr-wong.png",
      bio: "Economist Prof Dr Wong, is Director of EUDA Health Holdings Limited (NASDAQ:EUDA), Director of E-Plus Ltd (NSX:8EP) and CEO of D'Mace Group Ltd (Singapore). He holds PhD from Strathclyde Business School (UK), postdoctoral at Peking University (China), BBA from Western Michigan University (USA) and M.Econ from University Putra (Malaysia). With a distinguished career as both scholar and corporate leader, Prof Dr Wong has held various executive positions in public listed companies, VP/deanship with universities, and lead consultant roles in several initiatives with ASEAN and UNWTO. From 2004 to 2016, he served as advisor to the government of Malaysia, SEA nations and China. In 2010, he led the National Key Economic Area EPP10, an essential component of Malaysia's Economic Transformation Program under the Prime Minister's Office. Prof Dr Wong's significant experience in the fields of business, economic policy and planning, showcase his ability to provide strategic guidance as Chairman of Nuren Group."
    },
    {
      name: "Petrina Goh",
      role: "Group CEO, Executive Director",
      image: "/petrina-goh.png",
      bio: "Founder and CEO of the group. She is an accomplished professional with a diverse background in the technology and finance sectors. She holds a Master Degree (Accounting & Finance) from University of Bath; and Bachelor Degree (Engineering) from University of Hull. Prior to this, she served as a tech consultant in Accenture, where she honed her expertise in the industry. Additionally, her tenure as an investment banker in CIMB Investment Bank (Malaysia) and Tael Partners (Malaysia) allowed her to manage a substantial investment portfolio, specializing in the evaluation of technology sector deals. Ms Goh is a recipient of MVCA Outstanding Women Entrepreneur of the year 2018 and the Inti Alumni Young Entrepreneur of the Year Award 2016. Besides being active keynote speakers, she is also a strong supporter of women in tech. Her remarkable journey and expertise make her a prominent figure in both the technology and business realms."
    },
    {
      name: "Kelvin Leow",
      role: "CTO, Executive Director",
      image: "/kelvin-leow.png",
      bio: "Mr Leow is a seasoned professional with over 20 years of experience in the tech industry. He holds a PMP certification and an honours degree in Software Engineering from the University of New South Wales, Australia. Mr Leow began his career in Sydney and has gained experience working in Malaysia, Singapore, Cambodia, and the United States. Throughout his career, Mr Leow has worked in software development, project management, and technology consulting. He has held key positions at Intel Malaysia and Motorola Australia, focusing on manufacturing automation and mobile messaging software. As an entrepreneur, he co-founded Claritas, a cloud-based CRM solution company, which was acquired by Incite Innovations in 2022. Mr Leow is recognized as an industry thought leader, having been a keynote speaker at numerous innovation and technology conferences. His expertise includes solution architecture, CRM, AI, digital media, retail management, and fintech. Currently, Mr Leow leads technology innovation and product direction at Nuren Group."
    },
    {
      name: "Dato Y.K. Eng",
      role: "Independent, Non-Executive Director",
      image: "/datoeng.png",
      bio: "Dato Eng is a prominent entrepreneur in Malaysia, particularly noted for his contributions to the confinement care industry and women's wellness. He began his entrepreneurial journey at 18, after graduating from high school in 2002. Mr Yee Koon Eng and his wife established Cozzi Confinement Centre (“Cozzi”) in 2017, providing affordable postnatal care including baby care, mother care, nutritious meals, and professional guidance. The success of the initial centre prompted further expansions of 5 centres to date. Cozzi has also focused on maternal education, organizing over 25 talks since 2021 on topics related to women and baby wellness. In 2021, Dato Eng acquired stakes in Itsherbs (“IH”), which addresses women's fertility concerns through Traditional Chinese Medicine and serves over 30,000 customers. In 2022, Dato Eng was also appointed as an advisor to Tradisi Bidan House (“TBH Wellness”), a company offering traditional postnatal massages. Under Dato Eng's leadership, Cozzi and his associated ventures continue to provide comprehensive wellness services for women in Malaysia."
    },
    {
      name: "Paul Fong",
      role: "Independent, Non-Executive",
      image: "/paul-fong.png",
      bio: "Mr Fong has decades of experience in business and law. Educated at the University of New South Wales, Mr Fong holds a Bachelor of Jurisprudence and a Bachelor of Laws, equipping him with a strong foundation in legal principles and critical thinking. His career began in Kuala Lumpur (Malaysia), where he honed his legal expertise at prestigious firms such as Hamzah Abu Samah & Partners and Yusuf Khan & Fong. Relocating to Sydney and in his recent role as a Director at D’Mace Capital Pty Ltd, a boutique financial service provider, Mr Fong leverages his extensive legal background to ensure compliance, mitigate risks and foster ethical business practices. He is deeply committed to driving innovation, sustainability, and long-term growth, while maintaining the highest standards of corporate governance."
    }
  ];

  return (
    <div className="pt-20">
      <SEO
        title="Board of Directors | Nuren Group - Leadership & Governance"
        description="Meet the Board of Directors of Nuren Group, providing strategic oversight and guidance for Southeast Asia's leading digital family ecosystem."
        keywords="Nuren Group board, leadership, corporate governance, Petrina Goh, Kelvin Leow, Prof Dr Wong"
        canonical="https://nurengroup.com/board-of-directors"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Board of Directors', url: '/board-of-directors' },
        ]}
      />

      {/* Hero Section */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100" stroke="white" fill="transparent" strokeWidth="0.5" />
          </svg>
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-2 bg-nuren-pink/20 text-nuren-pink rounded-full text-sm font-bold mb-6 border border-nuren-pink/30"
          >
            Leadership
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-8"
          >
            Board of <span className="text-nuren-pink">Directors</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed"
          >
            Our board brings together a wealth of experience in technology, finance, and regional market expansion to guide Nuren Group's strategic vision.
          </motion.p>
        </div>
      </section>

      {/* Directors List */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="space-y-24">
            {directors.map((director, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 items-center`}
              >
                <div className="w-full md:w-1/3">
                  <div className="relative aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl shadow-slate-200">
                    <img
                      src={director.image}
                      alt={director.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <div className="w-full md:w-2/3">
                  <motion.div 
                    initial={{ opacity: 0, x: idx % 2 === 0 ? 20 : -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="inline-block px-4 py-1 bg-nuren-pink/10 text-nuren-pink rounded-full text-xs font-bold mb-4 uppercase tracking-widest">
                      {director.role}
                    </div>
                    <h3 className="text-4xl font-bold text-slate-900 mb-6">{director.name}</h3>
                    <div className="w-20 h-1.5 bg-nuren-pink rounded-full mb-8" />
                    <p className="text-lg text-slate-600 leading-relaxed mb-6">
                      {director.bio}
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Governance Statement */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Corporate Governance</h2>
          <p className="text-lg text-slate-600 leading-relaxed mb-12">
            Nuren Group is committed to the highest standards of corporate governance. Our board ensures that the company operates with integrity, transparency, and accountability to all stakeholders, including our community of mothers, brand partners, and investors.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
              <ShieldCheck className="text-nuren-pink mx-auto mb-4" size={32} />
              <h4 className="font-bold mb-2">Integrity</h4>
              <p className="text-sm text-slate-500">Ethical conduct in all business dealings.</p>
            </div>
            <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
              <Globe className="text-blue-500 mx-auto mb-4" size={32} />
              <h4 className="font-bold mb-2">Responsibility</h4>
              <p className="text-sm text-slate-500">Accountability to our community and partners.</p>
            </div>
            <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
              <BarChart3 className="text-emerald-500 mx-auto mb-4" size={32} />
              <h4 className="font-bold mb-2">Transparency</h4>
              <p className="text-sm text-slate-500">Clear and open communication with stakeholders.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// --- Investors Page ---

// --- Corporate Governance Page ---

const CorporateGovernancePage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const principles = [
    {
      title: "Integrity & Ethics",
      desc: "We maintain the highest standards of integrity in all our dealings, ensuring ethical conduct across every level of the organization.",
      icon: <ShieldCheck className="text-nuren-pink" size={32} />
    },
    {
      title: "Transparency",
      desc: "We are committed to clear, accurate, and timely disclosure of information to our shareholders and the public.",
      icon: <BarChart3 className="text-blue-500" size={32} />
    },
    {
      title: "Accountability",
      desc: "Our board and management are accountable for the company's performance and for protecting the interests of all stakeholders.",
      icon: <Gavel className="text-purple-600" size={32} />
    }
  ];

  const committees = [
    {
      name: "Audit Committee",
      desc: "Oversees financial reporting, internal controls, and the external audit process to ensure financial integrity."
    },
    {
      name: "Remuneration Committee",
      desc: "Ensures that executive compensation is fair, competitive, and aligned with the long-term interests of the company."
    },
    {
      name: "Nomination Committee",
      desc: "Responsible for board composition, succession planning, and ensuring a diverse and capable leadership team."
    }
  ];

  return (
    <div className="pt-20">
      <SEO
        title="Corporate Governance | Nuren Group - Ethics & Transparency"
        description="Learn about Nuren Group's commitment to corporate governance, ethical business practices, and transparency."
        keywords="corporate governance, business ethics, transparency, Nuren Group policies"
        canonical="https://nurengroup.com/investors/corporate-governance"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Investors', url: '/investors' },
          { name: 'Corporate Governance', url: '/investors/corporate-governance' },
        ]}
      />

      {/* Hero Section */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100" stroke="white" fill="transparent" strokeWidth="0.5" />
          </svg>
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-2 bg-nuren-pink/20 text-nuren-pink rounded-full text-sm font-bold mb-6 border border-nuren-pink/30"
          >
            Governance
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-8"
          >
            Corporate <span className="text-nuren-pink">Governance</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed"
          >
            Nuren Group is committed to the highest standards of corporate governance, ensuring transparency, accountability, and ethical business practices.
          </motion.p>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Our Core Principles</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">
              These principles guide our decision-making and ensure we build long-term value for our stakeholders.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {principles.map((principle, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-10 rounded-[40px] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-8">
                  {principle.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{principle.title}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {principle.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Board Committees */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">Board Committees</h2>
              <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                Our board committees play a vital role in ensuring that specific areas of governance are handled with the necessary expertise and focus.
              </p>
              <div className="space-y-6">
                {committees.map((committee, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm"
                  >
                    <h4 className="font-bold text-slate-900 mb-2">{committee.name}</h4>
                    <p className="text-slate-500 text-sm">{committee.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-[64px] overflow-hidden shadow-2xl">
                <img
                  src="https://picsum.photos/seed/governance/800/800"
                  alt="Governance"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-8 -left-8 bg-nuren-pink text-white p-8 rounded-[32px] shadow-xl max-w-xs">
                <p className="text-lg font-bold">"Governance is not just about compliance; it's about building trust."</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Policies & Documents */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-8">Policies & Disclosures</h2>
          <p className="text-lg text-slate-600 leading-relaxed mb-12">
            We maintain a comprehensive set of policies to ensure that our operations are conducted ethically and in compliance with all applicable laws and regulations.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {governanceDocs.slice(0, 6).map((doc, idx) => (
              <Link 
                key={idx} 
                to={`/investors/governance-documents/${doc.id}`}
                className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <FileText className="text-slate-400 group-hover:text-nuren-pink transition-colors" size={24} />
                  <span className="font-bold text-slate-700">{doc.title}</span>
                </div>
                <ArrowRight className="text-slate-300 group-hover:text-nuren-pink transition-all group-hover:translate-x-1" size={20} />
              </Link>
            ))}
          </div>
          <div className="mt-12">
            <Link 
              to="/investors/governance-documents" 
              className="inline-flex items-center gap-2 text-nuren-pink font-bold hover:gap-3 transition-all"
            >
              View All Governance Documents
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

// --- Governance Documents Page ---

const GovernanceDocumentsPage = () => {
  const { docId } = useParams();
  const [selectedDoc, setSelectedDoc] = useState(governanceDocs[0]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (docId) {
      const doc = governanceDocs.find(d => d.id === docId);
      if (doc) setSelectedDoc(doc);
    }
  }, [docId]);

  return (
    <div className="pt-20">
      <SEO
        title={`${selectedDoc.title} | Governance Documents | Nuren Group`}
        description={`Read the ${selectedDoc.title} and other governance documents of Nuren Group.`}
        keywords={`governance documents, ${selectedDoc.title}, Nuren Group policies`}
        canonical={`https://nurengroup.com/investors/governance-documents/${selectedDoc.id}`}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Investors', url: '/investors' },
          { name: 'Governance Documents', url: '/investors/governance-documents' },
          { name: selectedDoc.title, url: `/investors/governance-documents/${selectedDoc.id}` },
        ]}
      />

      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <Link to="/investors/corporate-governance" className="inline-flex items-center gap-2 text-slate-500 hover:text-nuren-pink mb-8 transition-colors">
            <ChevronRight className="rotate-180" size={20} />
            Back to Corporate Governance
          </Link>
          <h1 className="text-4xl font-bold text-slate-900">Governance Documents</h1>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-4 gap-12">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 space-y-8">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Committee Charters</h3>
                  <div className="space-y-1">
                    {governanceDocs.filter(d => d.category === 'Charter').map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        className={`w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedDoc.id === doc.id ? 'bg-nuren-pink text-white shadow-lg shadow-nuren-pink/20' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        {doc.title}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Corporate Policies</h3>
                  <div className="space-y-1">
                    {governanceDocs.filter(d => d.category === 'Policy').map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        className={`w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedDoc.id === doc.id ? 'bg-nuren-pink text-white shadow-lg shadow-nuren-pink/20' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        {doc.title}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Statements</h3>
                  <div className="space-y-1">
                    {governanceDocs.filter(d => d.category === 'Statement').map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        className={`w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedDoc.id === doc.id ? 'bg-nuren-pink text-white shadow-lg shadow-nuren-pink/20' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        {doc.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              <motion.div
                key={selectedDoc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 md:p-12 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 min-h-[600px]"
              >
                <div className="inline-block px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold mb-6 uppercase tracking-wider">
                  {selectedDoc.category}
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-8">{selectedDoc.title}</h2>
                <div 
                  className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600 prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6"
                  dangerouslySetInnerHTML={{ __html: selectedDoc.content }}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const InvestorsPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-20">
      <SEO
        title="Investors | Nuren Group - Investor Relations & Governance"
        description="Access key information about Nuren Group's performance, governance, and market announcements for our investor community."
        keywords="investor relations, Nuren Group stock, financial performance, market announcements"
        canonical="https://nurengroup.com/investors"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Investors', url: '/investors' },
        ]}
      />

      {/* Hero Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-4 py-2 bg-nuren-pink/10 text-nuren-pink rounded-full text-sm font-bold mb-6"
            >
              Investor Relations
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold text-slate-900 mb-8 leading-tight"
            >
              Transparency & <span className="text-nuren-pink">Growth</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-600 mb-10 leading-relaxed"
            >
              Nuren Group is committed to maintaining the highest standards of corporate governance and providing clear, timely information to our shareholders and the investment community.
            </motion.p>
          </div>
        </div>
      </section>

      <Investors />
      <BoardOfDirectors />

      {/* Investment Highlights */}
      <section className="py-24 bg-slate-900 text-white rounded-[64px] mx-6 mb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Investment Highlights</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Why Nuren Group is positioned for long-term success in the digital economy.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Market Leadership",
                desc: "Malaysia's #1 parenting platform with a growing footprint across Southeast Asia."
              },
              {
                title: "Scalable Model",
                desc: "A community-powered commerce flywheel that drives efficient user acquisition and high lifetime value."
              },
              {
                title: "Data Advantage",
                desc: "Proprietary data insights that enable precision targeting and high-margin brand solutions."
              }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10"
              >
                <h3 className="text-xl font-bold mb-4 text-nuren-pink">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// --- Careers Page ---

const CareersPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const benefits = [
    {
      title: "Growth & Learning",
      desc: "We invest in our people. From workshops to hands-on experience in a fast-growing tech company.",
      icon: <Zap className="text-nuren-pink" size={24} />,
    },
    {
      title: "Inclusive Culture",
      desc: "A diverse team where every voice matters. We celebrate different perspectives and ideas.",
      icon: <Users className="text-blue-500" size={24} />,
    },
    {
      title: "Impactful Work",
      desc: "Help us build the future of parenting and commerce in Southeast Asia. Your work touches millions.",
      icon: <Heart className="text-red-500" size={24} />,
    },
    {
      title: "Flexible Environment",
      desc: "We focus on results. Enjoy a dynamic work environment that values work-life balance.",
      icon: <Globe className="text-emerald-500" size={24} />,
    }
  ];

  const departments = [
    { name: "Tech & Engineering", roles: ["Frontend Developer", "Backend Developer", "Mobile App Developer"] },
    { name: "Marketing & Growth", roles: ["Performance Marketing", "SEO Specialist", "Social Media Manager"] },
    { name: "Content & Creative", roles: ["Content Writer", "Video Editor", "Graphic Designer"] },
    { name: "Sales & Partnerships", roles: ["Account Manager", "Business Development", "Sales Executive"] },
    { name: "Operations & HR", roles: ["HR Generalist", "Operations Executive", "Admin Support"] },
    { name: "Data & Analytics", roles: ["Data Analyst", "Business Intelligence", "Data Scientist"] }
  ];

  return (
    <div className="pt-20">
      <SEO
        title="Careers | Nuren Group - Join Our Mission"
        description="Join Nuren Group and help us build Southeast Asia's leading community-powered commerce platform for women and families."
        keywords="Nuren Group careers, jobs in Malaysia, tech jobs SEA, join Nuren Group"
        canonical="https://nurengroup.com/careers"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Careers', url: '/careers' },
        ]}
      />

      {/* Hero Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-4 py-2 bg-nuren-pink/10 text-nuren-pink rounded-full text-sm font-bold mb-6"
            >
              Join the Team
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold text-slate-900 mb-8 leading-tight"
            >
              Build the Future of <span className="text-nuren-pink">Parenting</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-600 mb-10 leading-relaxed"
            >
              We are looking for passionate, innovative, and driven individuals to help us empower women and families across Southeast Asia.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Why Join Us */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Why Join Nuren Group?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">
              We offer more than just a job. We offer a chance to make a real difference in the lives of millions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-8 rounded-3xl border border-slate-100 bg-white hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-6">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{benefit.title}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {benefit.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-24 bg-slate-900 text-white rounded-[64px] mx-6 mb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Open Positions</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Explore our current opportunities and find where you fit in.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">{dept.name}</h3>
                  <ChevronRight className="text-nuren-pink group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="space-y-2">
                  {dept.roles.map((role, rIdx) => (
                    <div key={rIdx} className="text-slate-400 text-sm flex items-center gap-2">
                      <div className="w-1 h-1 bg-nuren-pink rounded-full" />
                      {role}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-slate-400 mb-8">Don't see a role that fits? We're always looking for talent. Send your CV to us!</p>
            <a 
              href="mailto:admin@nurengroup.com" 
              className="inline-flex items-center gap-2 bg-nuren-pink text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-nuren-pink/90 transition-all shadow-lg shadow-nuren-pink/20"
            >
              Email CV to admin@nurengroup.com
              <ArrowRight size={20} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

// --- Ecosystem Page ---

const EcosystemPage = ({ onContactClick }: { onContactClick: () => void }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const flywheelSteps = [
    {
      title: "Community First",
      desc: "We build high-trust communities where families connect, share, and support each other.",
      icon: <Users className="text-nuren-pink" size={32} />,
      color: "bg-pink-50"
    },
    {
      title: "Content Driven",
      desc: "Our expert-led and user-generated content provides value at every stage of the parenting journey.",
      icon: <BookOpen className="text-nuren-purple" size={32} />,
      color: "bg-purple-50"
    },
    {
      title: "Commerce Integrated",
      desc: "We seamlessly integrate commerce through our marketplace and influencer-led social commerce.",
      icon: <Store className="text-blue-500" size={32} />,
      color: "bg-blue-50"
    },
    {
      title: "Data Powered",
      desc: "Every interaction generates insights that help us serve families better and drive brand growth.",
      icon: <Database className="text-emerald-500" size={32} />,
      color: "bg-emerald-50"
    }
  ];

  const ecosystemLayers = [
    {
      name: "Discovery & Content",
      platforms: ["Kelabmama", "Ask Me Doctor", "Nuren.asia"],
      desc: "Where families find inspiration, expert advice, and relatable stories."
    },
    {
      name: "Community & Advocacy",
      platforms: ["Ibuencer.com", "Motherhood Choice Awards", "MamaCubaTry"],
      desc: "Harnessing the power of peer-to-peer trust and authentic reviews."
    },
    {
      name: "Commerce & Fulfillment",
      platforms: ["Motherhood.com.my", "Motherhood SuperApp", "New Mom Program"],
      desc: "The destination for all parenting needs, from pregnancy to school years."
    }
  ];

  return (
    <div className="pt-24 pb-20">
      <SEO
        title="Nuren Group Ecosystem - Empowering Families through Digital Innovation"
        description="Discover Nuren Group's comprehensive ecosystem of digital products, from Motherhood SuperApp to Ibuencer, supporting families and empowering women across SE Asia."
        keywords="Nuren Group ecosystem, parenting platforms, Motherhood SuperApp, Ibuencer network, Kelabmama, digital family support SE Asia"
        canonical="https://nurengroup.com/ecosystem"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Ecosystem', url: '/ecosystem' },
        ]}
      />
      {/* Hero */}
      <section className="py-20 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <Network className="w-full h-full text-nuren-pink" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nuren-pink/10 text-nuren-pink text-sm font-bold mb-6"
            >
              <Layers size={16} />
              EXPLORE OUR ECOSYSTEM
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold text-slate-900 mb-8 leading-tight"
            >
              A 360° Universe for <span className="text-nuren-pink">Modern Families</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-600 mb-10 leading-relaxed"
            >
              Nuren Group has built Southeast Asia's most comprehensive ecosystem for parents and women. We don't just provide platforms; we create a seamless journey of support, discovery, and growth.
            </motion.p>
          </div>
        </div>
      </section>

      {/* The Flywheel */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">The Nuren Flywheel</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">
              Our ecosystem is built on a self-reinforcing cycle that creates value for users and brands alike.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {flywheelSteps.map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-8 rounded-3xl border border-slate-100 bg-white hover:shadow-xl transition-all group"
              >
                <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ecosystem Architecture */}
      <section className="py-24 bg-slate-900 text-white rounded-[64px] mx-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-8">Integrated Architecture</h2>
              <p className="text-slate-400 text-lg mb-12 leading-relaxed">
                Our platforms are not silos. They are interconnected layers that work together to provide a holistic experience for our users.
              </p>

              <div className="space-y-8">
                {ecosystemLayers.map((layer, idx) => (
                  <div key={idx} className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-nuren-pink/20 border border-nuren-pink/30 flex items-center justify-center font-bold text-nuren-pink">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">{layer.name}</h4>
                      <p className="text-slate-400 mb-4">{layer.desc}</p>
                      <div className="flex flex-wrap gap-2">
                        {layer.platforms.map(p => (
                          <span key={p} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-slate-300">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-nuren-pink/20 to-nuren-purple/20 rounded-full flex items-center justify-center p-12 border border-white/10">
                <div className="w-full h-full bg-white/5 backdrop-blur-3xl rounded-full border border-white/10 flex items-center justify-center relative">
                  <div className="w-32 h-32 bg-nuren-pink rounded-full flex items-center justify-center text-4xl font-bold shadow-2xl shadow-nuren-pink/50">N</div>
                  
                  {/* Floating Icons */}
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute top-10 left-10 w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20"
                  >
                    <Users className="text-nuren-pink" />
                  </motion.div>
                  <motion.div 
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute bottom-10 right-10 w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20"
                  >
                    <Store className="text-blue-400" />
                  </motion.div>
                  <motion.div 
                    animate={{ x: [0, 10, 0] }}
                    transition={{ duration: 6, repeat: Infinity }}
                    className="absolute top-1/2 -right-8 w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20"
                  >
                    <Share2 className="text-emerald-400" />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Insights */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-nuren-pink/5 rounded-[48px] p-12 md:p-20 overflow-hidden relative">
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-nuren-pink/10 rounded-full blur-3xl"></div>
            <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
              <div>
                <h2 className="text-4xl font-bold text-slate-900 mb-6">Unified Data Insights</h2>
                <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                  Our ecosystem captures data across the entire lifecycle of a family. From the first pregnancy test to the first day of school, we understand the evolving needs of parents.
                </p>
                <ul className="space-y-4">
                  {[
                    "Cross-platform user profiling",
                    "Behavioral intent mapping",
                    "Predictive lifecycle marketing",
                    "Real-time market sentiment analysis"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                      <CheckCircle2 className="text-nuren-pink" size={20} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                  <div className="text-3xl font-bold text-nuren-pink mb-2">5M+</div>
                  <div className="text-sm text-slate-500 uppercase tracking-wider font-bold">Monthly Active Users</div>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                  <div className="text-3xl font-bold text-nuren-purple mb-2">10K+</div>
                  <div className="text-sm text-slate-500 uppercase tracking-wider font-bold">Influencers</div>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                  <div className="text-3xl font-bold text-blue-500 mb-2">100M+</div>
                  <div className="text-sm text-slate-500 uppercase tracking-wider font-bold">Data Points</div>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                  <div className="text-3xl font-bold text-emerald-500 mb-2">5K+</div>
                  <div className="text-sm text-slate-500 uppercase tracking-wider font-bold">Brand Partners</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">Be Part of the Ecosystem</h2>
          <p className="text-xl text-slate-600 mb-10">
            Whether you're a parent looking for support or a brand looking for growth, there's a place for you in our universe.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onContactClick}
              className="w-full sm:w-auto bg-nuren-pink text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-nuren-pink/20 hover:scale-105 transition-transform"
            >
              Partner with Us
            </button>
            <Link to="/" className="w-full sm:w-auto bg-slate-100 text-slate-700 px-10 py-4 rounded-full font-bold text-lg hover:bg-slate-200 transition-all">
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

// --- Products Page ---

const ProductsPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-20">
      <SEO
        title="Our Products & Platforms | Nuren Group"
        description="Explore Nuren Group's diverse ecosystem of digital products designed to support families and empower women across Southeast Asia."
        keywords="parenting platforms, Motherhood.com.my, Kelabmama, Ibuencer, digital products, family ecosystem"
        canonical="https://nurengroup.com/products"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Products', url: '/products' },
        ]}
      />
      <Products showAll={true} />
    </div>
  );
};

// --- Home Component ---

const Home = ({ onContactClick }: { onContactClick: () => void }) => {
  return (
    <>
      <SEO 
        title="Nuren Group - Southeast Asia's Leading Community-Powered Commerce Platform"
        description="Nuren Group is a community-driven digital ecosystem connecting brands with highly engaged audiences through trusted platforms, data, and technology in SE Asia."
        keywords="Nuren Group, community-powered commerce, parenting ecosystem, Southeast Asia, Motherhood SuperApp, Ibuencer, Kelabmama, digital family ecosystem, women empowerment"
        canonical="https://nurengroup.com/"
      />
      <Hero />
      <Stats />
      <QuickLinks />
      <Products />
      <BrandSolutions onContactClick={onContactClick} />
      <ClientLogos />
      <CaseStudies />
      <Newsroom />
      <VisionSection />
      
      {/* Call to Action Section */}
      <section className="py-24 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">Ready to Grow with Us?</h2>
          <p className="text-xl text-slate-600 mb-10">
            Join 5,000+ brands and connect with millions of families across Southeast Asia.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onContactClick}
              className="w-full sm:w-auto bg-nuren-pink text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-nuren-pink/20 hover:scale-105 transition-transform"
            >
              Contact Sales
            </button>
            <Link to="/ecosystem" className="w-full sm:w-auto bg-slate-100 text-slate-700 px-10 py-4 rounded-full font-bold text-lg hover:bg-slate-200 transition-all">
              Explore our ecosystem
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

// --- Main App ---

export default function App() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={<AdminPage />} />
          <Route
            path="*"
            element={
              <div className="min-h-screen bg-white">
                {/* Skip-to-content link for keyboard / screen-reader users.
                    Visually hidden until focused (Tailwind sr-only + focus utilities). */}
                <a
                  href="#main-content"
                  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-nuren-pink focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-medium"
                >
                  Skip to main content
                </a>
                <Navbar onContactClick={() => setIsContactModalOpen(true)} />

                <main id="main-content">
                  <Routes>
                    <Route path="/" element={<Home onContactClick={() => setIsContactModalOpen(true)} />} />
                    <Route path="/ecosystem" element={<EcosystemPage onContactClick={() => setIsContactModalOpen(true)} />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/investors" element={<InvestorsPage />} />
                    <Route path="/media-hub" element={<MediaHubPage onContactClick={() => setIsContactModalOpen(true)} />} />
                    <Route path="/investors/corporate-governance" element={<CorporateGovernancePage />} />
                    <Route path="/investors/governance-documents" element={<GovernanceDocumentsPage />} />
                    <Route path="/investors/governance-documents/:docId" element={<GovernanceDocumentsPage />} />
                    <Route path="/board-of-directors" element={<BoardOfDirectorsPage />} />
                    <Route path="/careers" element={<CareersPage />} />
                  </Routes>
                </main>

                <Footer />

                <ContactModal
                  isOpen={isContactModalOpen}
                  onClose={() => setIsContactModalOpen(false)}
                />

                <Chatbot />
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}
