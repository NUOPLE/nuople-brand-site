import { useState, useEffect } from 'react';

import { getPublicSiteSettings } from '@client/src/api/public';
import type { ProcessStep } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

const ProcessSection = () => {
  const [steps, setSteps] = useState<ProcessStep[]>([]);

  useEffect(() => {
    const fetchProcess = async () => {
      try {
        const data = await getPublicSiteSettings();
        setSteps(data.designProcess);
      } catch (err) {
        logger.error('fetch process failed', String(err));
      }
    };
    fetchProcess();
  }, []);

  const displaySteps = steps.length > 0
    ? steps
    : [
        { title: '品牌调研', description: '深入了解品牌' },
        { title: '策略定位', description: '明确品牌方向' },
        { title: '视觉设计', description: '创意执行落地' },
        { title: '交付跟进', description: '全链路支持' },
      ];

  return (
    <section className="py-24 md:py-32 bg-black/[0.02]">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="mb-12 md:mb-20 text-center">
          <p className="text-xs tracking-[0.3em] text-black/50 uppercase mb-4">
            How We Work
          </p>
          <h2
            className="text-5xl md:text-7xl font-light text-black leading-none tracking-tight"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Process.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6">
          {displaySteps.map((step, index) => (
            <div key={index} className="text-center">
              <div
                className="text-7xl md:text-8xl font-light text-black/10 mb-6"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                {String(index + 1).padStart(2, '0')}
              </div>
              <h3 className="text-xl font-medium text-black mb-3">
                {step.title}
              </h3>
              <p className="text-sm text-black/50 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
