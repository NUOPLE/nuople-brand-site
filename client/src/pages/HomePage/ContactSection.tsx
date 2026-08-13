import { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Send, Check } from 'lucide-react';

import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { getPublicSiteSettings, submitPublicMessage } from '@client/src/api/public';
import type { ContactInfo } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

const ContactSection = () => {
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const data = await getPublicSiteSettings();
        setContact(data.contact);
      } catch (err) {
        logger.error('fetch contact info failed', String(err));
      }
    };
    fetchContact();
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = '请输入您的姓名';
    if (!email.trim()) {
      newErrors.email = '请输入邮箱地址';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '邮箱格式不正确';
    }
    if (!content.trim()) newErrors.content = '请输入留言内容';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await submitPublicMessage({ name, email, content });
      setSubmitted(true);
      setName('');
      setEmail('');
      setContent('');
    } catch (err) {
      logger.error('submit message failed', String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-24 md:py-32 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="mb-12 md:mb-16">
          <p className="text-xs tracking-[0.3em] text-black/50 uppercase mb-4">
            Get In Touch
          </p>
          <h2
            className="text-5xl md:text-7xl font-light text-black leading-none tracking-tight"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Contact.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <p className="text-lg text-black/70 leading-relaxed mb-10 font-light max-w-md">
              有项目合作意向或任何问题，欢迎通过以下方式联系我们，
              我们会尽快回复。
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="size-10 flex items-center justify-center border border-black/10 shrink-0">
                  <Phone className="size-4 text-black/60" />
                </div>
                <div>
                  <p className="text-xs tracking-wider text-black/40 uppercase mb-1">
                    Phone
                  </p>
                  <p className="text-black">{contact?.phone || '400-888-8888'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="size-10 flex items-center justify-center border border-black/10 shrink-0">
                  <Mail className="size-4 text-black/60" />
                </div>
                <div>
                  <p className="text-xs tracking-wider text-black/40 uppercase mb-1">
                    Email
                  </p>
                  <p className="text-black">{contact?.email || 'hello@nuople.com'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="size-10 flex items-center justify-center border border-black/10 shrink-0">
                  <MapPin className="size-4 text-black/60" />
                </div>
                <div>
                  <p className="text-xs tracking-wider text-black/40 uppercase mb-1">
                    Address
                  </p>
                  <p className="text-black">
                    {contact?.address || '北京市朝阳区创意设计园区'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 border border-black/10">
                <div className="size-16 flex items-center justify-center bg-black mb-6 text-white">
                  <Check className="size-7" />
                </div>
                <h3
                  className="text-2xl font-light text-black mb-3"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  感谢您的留言
                </h3>
                <p className="text-black/50 max-w-sm">
                  我们已收到您的消息，将尽快通过邮件与您联系。
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-8 text-sm text-black/60 hover:text-black underline underline-offset-4"
                >
                  再发一条
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs tracking-wider text-black/60 uppercase">
                    姓名 <span className="text-black/30">*</span>
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.name;
                          return next;
                        });
                      }
                    }}
                    placeholder="请输入您的姓名"
                    className={`rounded-sm h-12 ${
                      errors.name ? 'border-red-500 focus-visible:ring-red-500/20' : ''
                    }`}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs tracking-wider text-black/60 uppercase">
                    邮箱 <span className="text-black/30">*</span>
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.email;
                          return next;
                        });
                      }
                    }}
                    placeholder="请输入邮箱地址"
                    className={`rounded-sm h-12 ${
                      errors.email ? 'border-red-500 focus-visible:ring-red-500/20' : ''
                    }`}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs tracking-wider text-black/60 uppercase">
                    留言 <span className="text-black/30">*</span>
                  </label>
                  <Textarea
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      if (errors.content) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.content;
                          return next;
                        });
                      }
                    }}
                    placeholder="请描述您的需求或问题"
                    rows={5}
                    className={`rounded-sm resize-none ${
                      errors.content ? 'border-red-500 focus-visible:ring-red-500/20' : ''
                    }`}
                  />
                  {errors.content && (
                    <p className="text-xs text-red-500">{errors.content}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 rounded-sm bg-black text-white hover:bg-black/80 text-sm tracking-wider"
                >
                  {submitting ? '提交中...' : '发送留言'}
                  <Send className="size-4 ml-2" />
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
