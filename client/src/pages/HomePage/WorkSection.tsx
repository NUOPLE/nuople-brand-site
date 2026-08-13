import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import Image from '@client/src/components/ui/image';
import { getPublicWorkList } from '@client/src/api/public';
import type { PublicWorkListItem, WorkCategory } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

const CATEGORY_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'logo', label: 'LOGO' },
  { value: 'vis', label: 'Brand Identity' },
  { value: 'packaging', label: 'Packaging' },
];

const WorkSection = () => {
  const [works, setWorks] = useState<PublicWorkListItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorks = async () => {
      setLoading(true);
      try {
        const data = await getPublicWorkList({
          page: 1,
          pageSize: 9,
          category: activeCategory || undefined,
        });
        setWorks(data.items);
      } catch (err) {
        logger.error('fetch work list failed', String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchWorks();
  }, [activeCategory]);

  return (
    <section id="work" className="py-24 md:py-32 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 md:mb-16 gap-6">
          <div>
            <p className="text-xs tracking-[0.3em] text-black/50 uppercase mb-4">
              Selected Work
            </p>
            <h2
              className="text-5xl md:text-7xl font-light text-black leading-none tracking-tight"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Work.
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORY_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveCategory(filter.value)}
                className={`px-4 py-2 text-xs tracking-wider uppercase transition-all ${
                  activeCategory === filter.value
                    ? 'bg-black text-white'
                    : 'bg-transparent text-black/60 hover:text-black border border-black/10 hover:border-black/30'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-[3/2] bg-black/5 animate-pulse"
              />
            ))}
          </div>
        ) : works.length === 0 ? (
          <div className="text-center py-20 text-black/40">暂无作品</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {works.map((work) => (
              <Link
                key={work.id}
                to={`/work/${work.id}`}
                className="group block"
              >
                <div className="aspect-[3/2] overflow-hidden bg-black/5 mb-4">
                  <Image
                    src={work.coverImage}
                    alt={work.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-black group-hover:text-black/70 transition-colors">
                      {work.title}
                    </h3>
                    <p className="text-sm text-black/50 mt-1 line-clamp-1">
                      {work.description}
                    </p>
                  </div>
                  <span className="text-xs tracking-wider text-black/40 uppercase shrink-0">
                    {work.year}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default WorkSection;
