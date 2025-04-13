import { Button } from "../components/ui/button";
import { motion, useAnimation, useInView } from "framer-motion";
import React, { useState, useEffect, ReactNode, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import TypeWriter from "../components/TypeWriter";
import SlideInText from "../components/SlideInText";
import LoadingAnimation from "../components/LoadingAnimation";

// Common animation variants to reuse - memoize these to reduce object creation
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.5 }
};

// Scroll variants for sections
const scrollVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.1, 0.25, 0.3, 1]
    }
  }
};

// Card component to reduce duplication
interface FeatureCardProps {
  icon: string;
  title: string;
  children: ReactNode;
}

// Memoize the FeatureCard component
const FeatureCard = React.memo(({ icon, title, children }: FeatureCardProps) => (
  <motion.div 
    variants={{
      hidden: { opacity: 0, scale: 0.9 },
      visible: { opacity: 1, scale: 1 }
    }}
    className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6"
  >
    <h3 className="text-lg font-semibold mb-2">{icon} {title}</h3>
    {children}
  </motion.div>
));

// Section component for smooth animations when scrolling
interface SectionProps {
  id: string;
  className?: string;
  children: ReactNode;
  delay?: number;
  forwardedRef?: React.RefObject<HTMLDivElement>;
}

const Section = ({ id, className = "", children, delay = 0, forwardedRef }: SectionProps) => {
  const controls = useAnimation();
  const internalRef = useRef(null);
  const ref = forwardedRef || internalRef;
  const inView = useInView(ref, { once: false, amount: 0.3 });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <motion.section
      id={id}
      ref={ref}
      variants={scrollVariants}
      initial="hidden"
      animate={controls}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.section>
  );
};

export default function WisdomMinimalLanding() {
  const navigate = useNavigate();
  const staticText = "Perrašymas – tai tūkstantmečių senumo praktika, kuri padeda ne tik įsiminti informaciją, bet ir pasiekti gilų teksto supratimą, kurį patyrė didieji istorijos protai.";
  const [isLoaded, setIsLoaded] = useState(false);
  const [rewrittenCount, setRewrittenCount] = useState(12483); // Starting with a base number
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [typingComplete, setTypingComplete] = useState(false);
  const [shouldStartTyping, setShouldStartTyping] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Add refs for the sections
  const philosophyRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const startJourneyRef = useRef<HTMLDivElement>(null);

  // Smooth scroll function
  const scrollToSection = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80, // Offset for header
        behavior: "smooth"
      });
    }
  };

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // Memoize handlers to prevent recreation on each render
  const handleAccessCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAccessCode(e.target.value);
  }, []);

  const handleAccess = useCallback(() => {
    // For demo purposes, let's use a simple code "demo123"
    if (accessCode === "demo123") {
      localStorage.setItem('auth_token', 'demo_token');
      navigate('/article');
    } else {
      setError("Neteisingas kodas. Bandykite dar kartą.");
      setTimeout(() => setError(""), 3000);
    }
  }, [accessCode, navigate]);

  // Memoize the typing completion handler
  const handleTypingComplete = useCallback(() => {
    setTypingComplete(true);
  }, []);

  useEffect(() => {
    // Make sure everything is properly loaded
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1500); // Give the animation some time to show (1.5s)

    return () => clearTimeout(timer);
  }, []);

  // Separate the counter effect from scroll effect to avoid unnecessary work
  useEffect(() => {
    // Increment counter by 3 every 5 seconds
    const counterInterval = setInterval(() => {
      setRewrittenCount(prev => prev + 3);
    }, 5000);

    return () => clearInterval(counterInterval);
  }, []);

  // Handle scroll effects in a separate effect
  useEffect(() => {
    // Add scroll listener for the typing effect and scroll-to-top button
    const handleScroll = () => {
      // Show scroll-to-top button when user scrolls down 300px
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
      
      if (philosophyRef.current) {
        const rect = philosophyRef.current.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;
        
        if (isVisible && !shouldStartTyping && !typingComplete) {
          setShouldStartTyping(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Trigger once to check if already visible
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [shouldStartTyping, typingComplete]);

  // Memoize formatted count to avoid recalculation on render
  const formattedCount = useMemo(() => {
    return rewrittenCount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      useGrouping: true,
    });
  }, [rewrittenCount]);

  if (!isLoaded) {
    return <LoadingAnimation fullScreen message="Kraunama..." />;
  }

  // Main content background and layout classes
  const mainClasses = "min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 text-gray-800 flex flex-col items-center px-6 py-10 font-playfair";

  // Navigation items with scroll targets
  const navItems = [
    { name: "Apie mus", target: "philosophy" },
    { name: "Privalumai", target: "features" },
    { name: "Pradėti", target: "journey" }
  ];

  return (
    <main className={mainClasses}>
      <header className="w-full max-w-6xl flex flex-col items-center py-4 px-2 md:px-6 mb-6 sticky top-0 z-50 bg-white bg-opacity-90 backdrop-blur-sm shadow-sm">
        <div className="w-full flex items-center justify-between mb-4 border-b border-gray-200 pb-4">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight font-cormorant"
          >
            Readleta
          </motion.h1>
          <SlideInText 
            text="Tik tiems, kurie ieško giliau" 
            className="text-sm md:block" 
            brandStyle={true}
            duration={1.2}
          />
        </div>
        <nav className="w-full flex justify-center space-x-8 text-sm text-gray-500 font-medium md:flex font-lora">
          {navItems.map((item, index) => (
            <motion.button
              key={item.name}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.15, duration: 0.5 }}
              className="hover:text-gray-900 transition-colors duration-200 cursor-pointer relative group"
              onClick={() => scrollToSection(item.target)}
            >
              {item.name}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-300 ease-in-out group-hover:w-full"></span>
            </motion.button>
          ))}
        </nav>
      </header>

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-center mb-12"
      >
        <h2 className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight text-gray-900 font-playfair">
          Prieiga prie išminties
        </h2>
        <p className="text-md md:text-lg max-w-xl mx-auto text-gray-600 font-baskerville mb-6">
          Estetiškai švari erdvė tiems, kurie ieško gilios savistabos, senosios išminties ir nepertraukiamo proto gilinimo.
        </p>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-0"
        >
          <p className="text-sm uppercase tracking-widest text-gray-500 mb-1">VISO PERRAŠYTA ŽODŽIŲ</p>
          <p className="text-6xl font-light text-gray-900 font-mono mb-2">
            {formattedCount}
          </p>
        </motion.div>
      </motion.div>

      {/* Access code section */}
      <motion.div
        {...fadeIn}
        transition={{ delay: 0.5, duration: 1 }}
        className="w-full max-w-sm mx-auto -mt-1"
      >
        <div className="p-2">
          <div className="mb-3">
            <input
              type="text"
              placeholder="Įveskite prieigos kodą..."
              value={accessCode}
              onChange={handleAccessCodeChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-1 focus:ring-gray-700 font-lora text-center"
            />
          </div>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm mb-3 text-center"
            >
              {error}
            </motion.p>
          )}
          <Button 
            variant="primary"
            size="md"
            className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white font-cormorant text-base py-2"
            onClick={handleAccess}
          >
            Atrasti prieigą
          </Button>
        </div>
      </motion.div>

      <Section 
        id="philosophy" 
        className="mt-16 max-w-2xl text-center text-gray-700"
        forwardedRef={philosophyRef}
      >
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 font-playfair flex items-center justify-center gap-2">
            <span className="text-2xl">📜</span> 
            Perrašymo filosofija
          </h2>
          <div className="text-md font-baskerville leading-relaxed text-gray-800">
            {typingComplete ? (
              staticText
            ) : shouldStartTyping ? (
              <TypeWriter 
                text={staticText} 
                delay={30} 
                onComplete={handleTypingComplete}
                className="inline-block"
              />
            ) : (
              <span className="opacity-80">{staticText}</span>
            )}
          </div>
        </div>
      </Section>

      <Section 
        id="features" 
        className="mt-16 max-w-3xl w-full"
        delay={0.2}
        forwardedRef={featuresRef}
      >
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.15
              }
            }
          }}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-700"
        >
          {[
            {
              icon: "📈",
              title: "IŠSKIRTINIS ĮSIMINIMAS",
              content: "Neuromokslo tyrimai patvirtina: perrašymas aktyvuoja Broca, motorinę žievę ir hipokampą vienu metu. Rezultatas? Iki 78% geresnis informacijos išsaugojimas nei skaitant."
            },
            {
              icon: "🧠",
              title: "GILESNIS SUPRATIMAS",
              content: "Kai ranka juda popieriumi, smegenys apdoroja informaciją giliau. Kiekvienas perrašytas žodis tampa asmeniniu atradimu, ne svetima koncepcija."
            },
            {
              icon: "💎",
              title: "NEPAJUDINAMAS DĖMESYS",
              content: "Šiuolaikiniame išsiblaškymo amžiuje perrašymas treniruoja ilgalaikio susikaupimo raumenis. Tyrimai rodo 65% pagerėjusį gebėjimą išlaikyti dėmesį po reguliarios praktikos."
            },
            {
              icon: "🎵",
              title: "SMEGENŲ AKTYVAVIMAS",
              content: "Mūsų platforma integruoja specialius garso dažnius, kurie sinchronizuojasi su jūsų perrašymo ritmu. Šie ambientiški tonai optimizuoti smegenų veiklai gerinti."
            },
            {
              icon: "🔊",
              title: "ALPHA IR THETA BANGOS",
              content: "7–14 Hz dažnių garsai sukuria idealią būseną giliam mokymuisi. Moksliškai įrodyta, kad šie garsai didina smegenų funkcionalumą ir kūrybiškumą."
            },
            {
              icon: "⚙️",
              title: "PERSONALIZUOTI NUSTATYMAI",
              content: (
                <ul className="list-disc list-inside text-sm leading-relaxed">
                  <li>Fokuso režimas</li>
                  <li>Kūrybinis režimas</li>
                  <li>Atminties režimas</li>
                </ul>
              )
            }
          ].map((feature, index) => (
            <FeatureCard key={index} icon={feature.icon} title={feature.title}>
              {typeof feature.content === 'string' ? (
                <p className="text-sm leading-relaxed">{feature.content}</p>
              ) : (
                feature.content
              )}
            </FeatureCard>
          ))}
        </motion.div>
      </Section>

      <Section 
        id="journey" 
        className="mt-20 max-w-2xl text-center text-gray-600"
        delay={0.3}
        forwardedRef={startJourneyRef}
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { 
              opacity: 1, 
              y: 0,
              transition: {
                duration: 0.6,
                ease: "easeOut"
              }
            }
          }}
        >
          <h3 className="text-lg font-semibold mb-2">🚀 Pradėkite savo transformacijos kelionę</h3>
          <ul className="space-y-2">
            <li><strong>1.</strong> Intuityvi sąsaja – pritaikyta tiek kompiuteriams, tiek mobiliesiems įrenginiams</li>
            <li><strong>2.</strong> Progresas – individualiai pritaikytas jūsų mokymosi tempui</li>
            <li><strong>3.</strong> Integruoti garsai – skirti skatinti gilų mokymosi režimą</li>
          </ul>
          <motion.div 
            className="mt-8"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              variant="primary"
              size="lg"
              className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white font-cormorant text-lg py-3 px-8"
              onClick={() => scrollToSection("top")}
            >
              Atrasti prieigą dabar
            </Button>
          </motion.div>
        </motion.div>
      </Section>

      {/* Minimal footer */}
      <footer className="w-full max-w-4xl mt-24 pt-6 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-xs text-gray-400 mb-3 md:mb-0">© 2070 Išminties Kontinuumas</div>
          <div className="flex items-center space-x-4">
            <span className="text-xs text-gray-400">Tik tiems, kurie žino</span>
            <div className="w-[1px] h-3 bg-gray-300"></div>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600">Privatumo politika</a>
          </div>
        </div>
      </footer>

      {/* Scroll to top button */}
      <motion.button
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-lg z-50"
        onClick={scrollToTop}
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: showScrollTop ? 1 : 0,
          y: showScrollTop ? 0 : 20 
        }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M18 15l-6-6-6 6"/>
        </svg>
      </motion.button>
    </main>
  );
}