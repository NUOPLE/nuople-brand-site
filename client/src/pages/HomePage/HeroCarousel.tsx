import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import Image from '@client/src/components/ui/image';
import { getFeaturedWorks } from '@client/src/api/public';
import type { PublicWorkListItem } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

const HeroCarousel = () => {
  const [works, setWorks] = useState<PublicWorkListItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorks = async () => {
      try {
        const data = await getFeaturedWorks(5);
        setWorks(data.items);
      } catch (err) {
        logger.error('fetch featured works failed', String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchWorks();
  }, []);

  const goNext = useCallback(() => {
    if (works.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % works.length);
  }, [works.length]);

  const goPrev = useCallback(() => {
    if (works.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + works.length) % works.length);
  }, [works.length]);

  useEffect(() => {
    if (works.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % works.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [works.length]);

  if (loading || works.length === 0) {
    return (
      <section className="relative h-screen w-full bg-black/5 flex items-center justify-center">
        <div className="text-black/40 text-sm tracking-wider">Loading...</div>
      </section>
    );
  }

  const currentWork = works[currentIndex];

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black/5">
      <div className="absolute inset-0">
        {works.map((work, index) => (
          <div
            key={work.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={work.coverImage}
              alt={work.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        ))}
      </div>

      <div className="relative h-full flex items-end pb-20 md:pb-28">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 w-full">
          <div
            key={currentWork.id}
            className="max-w-2xl animate-fade-in"
          >
            <p className="text-white/80 text-xs tracking-[0.3em] uppercase mb-4">
              {currentWork.category} / {currentWork.year}
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-white leading-tight tracking-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              {currentWork.title}
            </h1>
            <p className="text-white/70 text-base md:text-lg mt-4 max-w-lg font-light">
              {currentWork.description}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={goPrev}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 size-10 md:size-12 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all rounded-full"
        aria-label="上一张"
      >
        <ChevronLeft className="size-6 md:size-7" />
      </button>

      <button
        onClick={goNext}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 size-10 md:size-12 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all rounded-full"
        aria-label="下一张"
      >
        <ChevronRight className="size-6 md:size-7" />
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {works.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-[2px] transition-all duration-300 ${
              index === currentIndex
                ? 'w-10 bg-white'
                : 'w-5 bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`第 ${index + 1} 张`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;
