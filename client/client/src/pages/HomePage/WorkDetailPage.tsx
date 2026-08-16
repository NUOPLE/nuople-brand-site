import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ArrowRight } from 'lucide-react';

import Image from '@client/src/components/ui/image';
import {
  getPublicWorkDetail,
  getNextWork,
} from '@client/src/api/public';
import type { PublicWorkDetail, PublicWorkListItem } from '@shared/api.interface';
import PublicNavbar from './PublicNavbar';
import Footer from './Footer';
import ChatWidget from './ChatWidget';
import { logger } from '@lark-apaas/client-toolkit/logger';

const WorkDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [work, setWork] = useState<PublicWorkDetail | null>(null);
  const [nextWork, setNextWork] = useState<PublicWorkListItem | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const [detail, next] = await Promise.all([
          getPublicWorkDetail(id),
          getNextWork(id).catch(() => null),
        ]);
        setWork(detail);
        setNextWork(next);
        window.scrollTo(0, 0);
      } catch (err) {
        logger.error('fetch work detail failed', String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-black/40 text-sm tracking-wider">Loading...</div>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <p className="text-black/40">作品不存在</p>
        <Link
          to="/"
          className="text-sm text-black underline underline-offset-4 hover:text-black/70"
        >
          返回首页
        </Link>
      </div>
    );
  }

  const gallery = work.gallery || [];

  return (
    <div className="min-h-screen bg-white text-black">
      <PublicNavbar />

      <main className="pt-20 md:pt-24">
        <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 md:py-20">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black mb-8 transition-colors"
          >
            <ChevronLeft className="size-4" />
            返回作品列表
          </button>

          <div className="max-w-4xl">
            <p className="text-xs tracking-[0.3em] text-black/40 uppercase mb-4">
              {work.category} / {work.year}
            </p>
            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-light leading-none tracking-tight mb-6"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {work.title}
            </h1>
            <p className="text-xl md:text-2xl text-black/60 font-light leading-relaxed mb-8">
              {work.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {work.tags &&
                work.tags.length > 0 &&
                work.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-xs tracking-wider text-black/60 border border-black/10"
                  >
                    {tag}
                  </span>
                ))}
            </div>
          </div>
        </section>

        <section className="max-w-[1400px] mx-auto px-6 md:px-10 pb-16">
          <button
            onClick={() => setAboutOpen(!aboutOpen)}
            className="w-full flex items-center justify-between py-6 border-t border-black/10 hover:text-black/70 transition-colors"
          >
            <span
              className="text-2xl md:text-3xl font-light"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              关于该项目
            </span>
            <ChevronDown
              className={`size-6 text-black/40 transition-transform duration-300 ${
                aboutOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          <div
            className={`overflow-hidden transition-all duration-500 ${
              aboutOpen ? 'max-h-96 pb-8' : 'max-h-0'
            }`}
          >
            <p className="text-black/70 leading-relaxed font-light text-lg whitespace-pre-line">
              {work.content || '暂无项目介绍'}
            </p>
          </div>
        </section>

        <section className="w-full">
          {work.heroImage && (
            <div className="w-full aspect-[16/9] bg-black/5">
              <Image
                src={work.heroImage}
                alt={work.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 md:py-20 space-y-8 md:space-y-16">
            {gallery.map((image, index) => (
              <div
                key={index}
                className={
                  image.layout === 'side-by-side'
                    ? 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8'
                    : 'w-full'
                }
              >
                <div className="aspect-[4/3] bg-black/5 overflow-hidden">
                  <Image
                    src={image.url}
                    alt={`${work.title} - ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-24 border-t border-black/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <p className="text-xs tracking-wider text-black/40 uppercase mb-2">
                Client
              </p>
              <p className="text-lg">{work.client}</p>
            </div>
            <div>
              <p className="text-xs tracking-wider text-black/40 uppercase mb-2">
                Sector
              </p>
              <p className="text-lg">{work.industry}</p>
            </div>
            <div>
              <p className="text-xs tracking-wider text-black/40 uppercase mb-2">
                Discipline
              </p>
              <p className="text-lg">{work.designType}</p>
            </div>
            <div>
              <p className="text-xs tracking-wider text-black/40 uppercase mb-2">
                Year
              </p>
              <p className="text-lg">{work.year}</p>
            </div>
          </div>
        </section>

        {nextWork && (
          <section className="border-t border-black/10">
            <Link
              to={`/work/${nextWork.id}`}
              className="block group"
            >
              <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-24 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                  <p className="text-xs tracking-[0.3em] text-black/40 uppercase mb-4">
                    Next Project
                  </p>
                  <h3
                    className="text-4xl md:text-6xl font-light tracking-tight group-hover:text-black/60 transition-colors"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  >
                    {nextWork.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-black/50 group-hover:text-black transition-colors">
                  查看下一个
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </section>
        )}
      </main>

      <Footer />
      <ChatWidget />
    </div>
  );
};

export default WorkDetailPage;
