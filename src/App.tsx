import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  BookOpen
} from 'lucide-react';

// --- Components ---

const VideoModal = ({ isOpen, onClose, videoUrl }: { isOpen: boolean, onClose: () => void, videoUrl: string }) => {
  if (!isOpen) return null;

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const id = url.split('v=')[1]?.split('&')[0] || url.split('/').pop()?.split('?')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
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
            className="absolute top-6 right-6 z-10 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors backdrop-blur-md"
          >
            <X size={24} />
          </button>
          <iframe 
            src={getEmbedUrl(videoUrl)}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#' },
    { name: 'Products', href: '#products' },
    { name: 'For Brands', href: '#brands' },
    { name: 'Case Studies', href: '#casestudies' },
    { name: 'Newsroom', href: '#newsroom' },
    { name: 'Investors', href: '#investors' },
    { name: 'Vision', href: '#vision' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-nuren-pink rounded-lg flex items-center justify-center text-white font-bold text-xl">N</div>
          <span className={`text-2xl font-bold tracking-tight ${isScrolled ? 'text-slate-900' : 'text-slate-900'}`}>NUREN GROUP</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href} 
              className="text-sm font-medium text-slate-600 hover:text-nuren-pink transition-colors"
            >
              {link.name}
            </a>
          ))}
          <button className="bg-nuren-pink text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-nuren-pink/90 transition-all shadow-lg shadow-nuren-pink/20">
            Partner with Us
          </button>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-slate-900" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
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
                <a 
                  key={link.name} 
                  href={link.href} 
                  className="text-lg font-medium text-slate-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <button className="w-full bg-nuren-pink text-white py-3 rounded-xl font-semibold mt-2">
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
              <button className="bg-slate-900 text-white px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:bg-slate-800 transition-all group">
                Explore Our Ecosystem
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-full font-bold hover:bg-slate-50 transition-all">
                Case Studies
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
              <img 
                src="/nuren21.jpg" 
                alt="Nuren Group" 
                className="w-full h-auto"
                referrerPolicy="no-referrer"
              />
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

const Products = () => {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const products = [
    { 
      name: 'Motherhood.com.my', 
      desc: "Malaysia's #1 parenting marketplace and community, offering brands direct access to a high-intent audience of millions of parents.",
      image: '/motherhood.jpg',
      platformLink: 'https://motherhood.com.my',
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
      platformLink: 'https://www.motherhood.com.my/parentcraft',
      videoLink: 'https://youtu.be/RZ8iwTcbrwA?si=hqO_--EemJxj7r26'
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
      videoLink: 'https://youtu.be/4mkAcSU5GF4?si=HfcHyfn-RFzFKQKQ'
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
      platformLink: 'https://www.motherhood.com.my/moneysmartmama',
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
      platformLink: 'https://nuren.asia/',
    },
    { 
      name: 'School Outreach Program', 
      desc: 'An organized school tour program featuring curated workshops and sampling activations, creating an educational, enriching, and fun learning experience for children while offering brands direct engagement in a trusted school environment.',
      image: '/schooloutreach.png',
      platformLink: 'https://www.motherhood.com.my/',
    }
  ];

  return (
    <section id="products" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Our Products & Platforms</h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            We operate a diverse ecosystem of digital products designed to support families and empower women.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -10 }}
              className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col"
            >
              <div className="relative h-56 overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold text-slate-900 mb-3">{product.name}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
                  {product.desc}
                </p>
                <div className="flex flex-col gap-3">
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
      image: "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&w=800&q=80",
      link: "https://marketingmagazine.com.my/scotts-reached-2-million-mums-via-ibuencer-from-rainbow-gummies-virtual-launch/",
      tags: ["FMCG", "Influencer Marketing", "Launch"]
    },
    {
      title: "Motherhood Choice Awards: Driving Brand Trust & Sales",
      desc: "A look at how the annual awards program helps brands build long-term credibility with Southeast Asian mothers.",
      image: "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=800&q=80",
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
            <div className="relative aspect-video">
              <img 
                src="/nuren21.jpg" 
                alt="News Video Thumbnail" 
                className="w-full h-full object-cover"
              />
              <a 
                href="https://youtu.be/5uLP2ZA0Wuw?si=F7O7xBoksNlCNaE0" 
                target="_blank" 
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all"
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-red-600 shadow-xl transform group-hover:scale-110 transition-transform">
                  <Play size={32} fill="currentColor" />
                </div>
              </a>
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
              <a 
                href="https://nurengroup.com/mediahub" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-900 font-bold flex items-center gap-2 hover:gap-3 transition-all"
              >
                View All News
                <ArrowRight size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>
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
      link: 'https://nurengroup.com/investors/corporate-governance',
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
      link: 'https://nurengroup.com/board-of-directors',
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
          <a href="#newsroom" className="hover:text-white transition-colors">Media Hub</a>
          <a href="#investors" className="hover:text-white transition-colors">Investors</a>
          <a href="#vision" className="hover:text-white transition-colors">Our Vision</a>
        </div>
      </div>
    </section>
  );
};

const BrandSolutions = () => {
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
            <button className="mt-10 bg-white text-slate-900 px-8 py-4 rounded-full font-bold hover:bg-slate-100 transition-all flex items-center gap-2">
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
              href="https://nurengroup.com/board-of-directors" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-full font-bold hover:bg-slate-800 transition-all shadow-lg"
            >
              View Full Board
              <ExternalLink size={20} />
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
              <div className="w-10 h-10 bg-nuren-pink rounded-lg flex items-center justify-center text-white font-bold text-xl">N</div>
              <span className="text-2xl font-bold tracking-tight text-slate-900">NUREN GROUP</span>
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
              <li><a href="#" className="hover:text-nuren-pink transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-nuren-pink transition-colors">Press</a></li>
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

// --- Main App ---

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main>
        <Hero />
        <Stats />
        <QuickLinks />
        <Products />
        <BrandSolutions />
        <CaseStudies />
        <Newsroom />
        <Investors />
        <BoardOfDirectors />
        <VisionSection />
        
        {/* Call to Action Section */}
        <section className="py-24 text-center">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-4xl font-bold text-slate-900 mb-6">Ready to Grow with Us?</h2>
            <p className="text-xl text-slate-600 mb-10">
              Join 5,000+ brands and connect with millions of families across Southeast Asia.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto bg-nuren-pink text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-nuren-pink/20 hover:scale-105 transition-transform">
                Contact Sales
              </button>
              <button className="w-full sm:w-auto bg-slate-100 text-slate-700 px-10 py-4 rounded-full font-bold text-lg hover:bg-slate-200 transition-all">
                Learn More
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
