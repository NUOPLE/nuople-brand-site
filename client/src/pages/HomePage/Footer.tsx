import { useState, useEffect } from 'react';

import { getPublicSiteSettings } from '@client/src/api/public';
import type { PublicSiteSettings } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

const Footer = () => {
  const [settings, setSettings] = useState<PublicSiteSettings | null>(null);

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

  return (
    <footer className="py-10 md:py-12 bg-black text-white">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg font-bold tracking-tight">
                {settings?.siteTitle || 'NUOPLE'}
              </span>
              <span className="text-[10px] tracking-[0.2em] text-white/50 font-light">
                BRAND & ART
              </span>
            </div>
            <p className="text-xs text-white/40">
              {settings?.footer.copyright ||
                '© 2024 NUOPLE. All rights reserved.'}
            </p>
          </div>

          <div className="text-xs text-white/40 tracking-wider">
            {settings?.footer.socialLinks || 'Weibo / Instagram / Behance'}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
