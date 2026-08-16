import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { getPublicSiteSettings } from '@client/src/api/public';
import type { PublicSiteSettings } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

const navLinks = [
  { href: '#work', label: 'Work' },
  { href: '#about', label: 'About' },
  { href: '#services', label: 'Services' },
  { href: '#contact', label: 'Contact' },
];

const PublicNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settings, setSettings] = useState<PublicSiteSettings | null>(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getPublicSiteSettings();
        setSettings(data);
      } catch (err) {
        logger.error('fetch site settings failed', String(err));
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (location.pathname !== '/') {
      return;
    }
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const brandTitle = settings?.siteTitle || 'NUOPLE';
  const brandSubtitle = 'BRAND & ART';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-300 ${
        scrolled ? 'border-b border-black/10' : 'border-b border-black/10'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex items-center gap-3 group">
          <span className="text-xl md:text-2xl font-bold tracking-tight text-black">
            {brandTitle}
          </span>
          <span className="hidden md:inline text-[10px] tracking-[0.2em] text-black/60 font-light">
            {brandSubtitle}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="text-xs tracking-[0.2em] text-black/70 hover:text-black transition-colors uppercase font-medium"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <button
          className="md:hidden p-2 -mr-2 text-black"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="菜单"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-black/10">
          <nav className="flex flex-col px-6 py-4 gap-4">
             {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="text-left text-sm tracking-wider text-black/70 hover:text-black transition-colors uppercase py-2"
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default PublicNavbar;
