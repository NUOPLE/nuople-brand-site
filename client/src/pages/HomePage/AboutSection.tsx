import { useState, useEffect } from 'react';

import { getPublicSiteSettings } from '@client/src/api/public';
import type { PublicSiteSettings } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

const AboutSection = () => {
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

  const aboutParagraphs = (settings?.aboutUs || '')
    .split('\n')
    .filter((p) => p.trim());

  return (
    <section id="about" className="py-24 md:py-32 bg-black/[0.02]">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <p className="text-xs tracking-[0.3em] text-black/50 uppercase mb-4">
              About Us
            </p>
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-light text-black leading-tight tracking-tight"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {settings?.companyName || '品牌设计工作室'}
              <br />
              <span className="text-black/40">专注品牌视觉设计</span>
            </h2>
          </div>

          <div className="space-y-6 text-black/70 leading-relaxed text-base md:text-lg font-light">
            {aboutParagraphs.length > 0 ? (
              aboutParagraphs.map((p, i) => <p key={i}>{p}</p>)
            ) : (
              <p>我们是一家专注于品牌视觉设计的创意工作室。</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
