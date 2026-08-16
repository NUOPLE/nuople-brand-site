import { useState, useEffect } from 'react';

import { getPublicSiteSettings } from '@client/src/api/public';
import type { ServiceItem } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

const ServicesSection = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await getPublicSiteSettings();
        setServices(data.services);
      } catch (err) {
        logger.error('fetch services failed', String(err));
      }
    };
    fetchServices();
  }, []);

  const displayServices = services.length > 0
    ? services
    : [
        { title: 'LOGO设计', description: '品牌标识设计' },
        { title: 'VIS视觉识别', description: '品牌视觉系统' },
        { title: '包装设计', description: '产品包装设计' },
      ];

  return (
    <section id="services" className="py-24 md:py-32 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="mb-12 md:mb-20">
          <p className="text-xs tracking-[0.3em] text-black/50 uppercase mb-4">
            What We Do
          </p>
          <h2
            className="text-5xl md:text-7xl font-light text-black leading-none tracking-tight"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Services.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 lg:gap-12">
          {displayServices.map((service, index) => (
            <div key={index} className="group">
              <div className="flex items-baseline gap-4 mb-6">
                <span
                  className="text-6xl md:text-7xl font-light text-black/10"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="text-2xl md:text-3xl font-medium text-black mb-4 tracking-tight">
                {service.title}
              </h3>
              <p className="text-black/60 leading-relaxed font-light">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
