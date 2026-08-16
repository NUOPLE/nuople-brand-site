import { useState, useEffect, useCallback } from 'react';
import { X, Upload } from 'lucide-react';

import { axiosForBackend, toast } from '@client/src/api';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { Label } from '@client/src/components/ui/label';
import { Image } from '@client/src/components/ui/image';
import type {
  SiteSettings,
  ServiceItem,
  ProcessStep,
  SuccessResponse,
} from '@shared/api.interface';

const DEFAULT_SETTINGS: SiteSettings = {
  siteTitle: '',
  companyName: '',
  logoImage: '',
  heroSlogan: '',
  heroSubtitle: '',
  aboutUs: '',
  services: [
    { title: '', description: '' },
    { title: '', description: '' },
    { title: '', description: '' },
  ],
  designProcess: [
    { title: '', description: '' },
    { title: '', description: '' },
    { title: '', description: '' },
    { title: '', description: '' },
  ],
  contact: { phone: '', email: '', address: '' },
  footer: { copyright: '', socialLinks: '' },
};

const SiteSettingsPage = () => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    const load = async (): Promise<void> => {
      try {
        const res = await axiosForBackend.get<SiteSettings>('/api/site-settings');
        if (mounted) {
          const data = res.data;
          const services: ServiceItem[] =
            data.services && Array.isArray(data.services) && data.services.length > 0
              ? data.services
              : [
                  { title: '', description: '' },
                  { title: '', description: '' },
                  { title: '', description: '' },
                ];
          while (services.length < 3) {
            services.push({ title: '', description: '' });
          }
          const designProcess: ProcessStep[] =
            data.designProcess && Array.isArray(data.designProcess) && data.designProcess.length > 0
              ? data.designProcess
              : [
                  { title: '', description: '' },
                  { title: '', description: '' },
                  { title: '', description: '' },
                  { title: '', description: '' },
                ];
          while (designProcess.length < 4) {
            designProcess.push({ title: '', description: '' });
          }
          setSettings({
            ...DEFAULT_SETTINGS,
            ...data,
            services,
            designProcess,
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = useCallback(async (): Promise<void> => {
    setSaving(true);
    try {
      await axiosForBackend.put<SuccessResponse>('/api/site-settings', settings);
      toast.success('保存成功');
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const handleLogoRemove = useCallback((): void => {
    setSettings((prev) => ({ ...prev, logoImage: '' }));
  }, []);

  const updateService = (index: number, field: keyof ServiceItem, value: string): void => {
    setSettings((prev) => {
      const next = [...prev.services];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, services: next };
    });
  };

  const updateProcess = (index: number, field: keyof ProcessStep, value: string): void => {
    setSettings((prev) => {
      const next = [...prev.designProcess];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, designProcess: next };
    });
  };

  if (loading) {
    return <div className="p-6 text-muted-foreground">加载中...</div>;
  }

  return (
    <div className="max-w-[1200px] mx-auto p-6 pb-24">
      <h1 className="text-2xl font-bold text-foreground mb-6">网站设置</h1>

      {/* 基本信息 */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-foreground border-b border-border pb-4 mb-6">
          基本信息
        </h2>
        <div className="md:grid md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-1.5">
            <Label htmlFor="siteTitle" className="text-sm font-medium">
              网站标题
              <span className="text-destructive ml-0.5">*</span>
            </Label>
            <Input
              id="siteTitle"
              value={settings.siteTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSettings((prev) => ({ ...prev, siteTitle: e.target.value }))
              }
              className="rounded-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="companyName" className="text-sm font-medium">
              公司名称
              <span className="text-destructive ml-0.5">*</span>
            </Label>
            <Input
              id="companyName"
              value={settings.companyName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSettings((prev) => ({ ...prev, companyName: e.target.value }))
              }
              className="rounded-sm"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Logo 上传</Label>
              <Input
                type="url"
                value={settings.logoImage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSettings((prev) => ({ ...prev, logoImage: e.target.value }))
                }
                placeholder="https://example.com/logo.png"
              />
              {settings.logoImage ? (
                <div className="relative w-32 h-32 border border-border rounded-sm overflow-hidden bg-muted/20">
                  <Image
                    src={settings.logoImage}
                    alt="Logo 预览"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      handleLogoRemove();
                    }}
                    className="absolute top-1 right-1 w-6 h-6 bg-background/80 border border-border rounded-sm flex items-center justify-center text-foreground hover:bg-accent"
                    aria-label="删除 logo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-muted-foreground gap-1">
                  <Upload className="w-6 h-6" />
                  <span className="text-xs">Logo 预览</span>
                </div>
              )}
        </div>
      </section>

      {/* 首页设置 */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-foreground border-b border-border pb-4 mb-6">
          首页设置
        </h2>
        <div className="md:grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="heroSlogan" className="text-sm font-medium">
              Hero 标语
              <span className="text-destructive ml-0.5">*</span>
            </Label>
            <Input
              id="heroSlogan"
              value={settings.heroSlogan}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSettings((prev) => ({ ...prev, heroSlogan: e.target.value }))
              }
              className="rounded-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="heroSubtitle" className="text-sm font-medium">
              副标题文字
              <span className="text-destructive ml-0.5">*</span>
            </Label>
            <Input
              id="heroSubtitle"
              value={settings.heroSubtitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSettings((prev) => ({ ...prev, heroSubtitle: e.target.value }))
              }
              className="rounded-sm"
            />
          </div>
        </div>
      </section>

      {/* 关于我们 */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-foreground border-b border-border pb-4 mb-6">
          关于我们
        </h2>
        <div className="space-y-1.5">
          <Label htmlFor="aboutUs" className="text-sm font-medium">
            关于我们内容
            <span className="text-destructive ml-0.5">*</span>
          </Label>
          <Textarea
            id="aboutUs"
            rows={8}
            value={settings.aboutUs}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setSettings((prev) => ({ ...prev, aboutUs: e.target.value }))
            }
            className="rounded-sm"
          />
        </div>
      </section>

      {/* 服务设置 */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-foreground border-b border-border pb-4 mb-6">
          服务设置
        </h2>
        <div className="space-y-6">
          {settings.services.map((service: ServiceItem, index: number) => (
            <div key={index} className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">
                服务{index + 1}
              </h3>
              <div className="md:grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor={`service-title-${index}`} className="text-sm font-medium">
                    标题
                    <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <Input
                    id={`service-title-${index}`}
                    value={service.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateService(index, 'title', e.target.value)
                    }
                    className="rounded-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`service-desc-${index}`} className="text-sm font-medium">
                    描述
                    <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <Input
                    id={`service-desc-${index}`}
                    value={service.description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateService(index, 'description', e.target.value)
                    }
                    className="rounded-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 设计流程 */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-foreground border-b border-border pb-4 mb-6">
          设计流程
        </h2>
        <div className="space-y-6">
          {settings.designProcess.map((step: ProcessStep, index: number) => (
            <div key={index} className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">
                步骤{index + 1}
              </h3>
              <div className="md:grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor={`step-title-${index}`} className="text-sm font-medium">
                    标题
                    <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <Input
                    id={`step-title-${index}`}
                    value={step.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateProcess(index, 'title', e.target.value)
                    }
                    className="rounded-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`step-desc-${index}`} className="text-sm font-medium">
                    描述
                    <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <Input
                    id={`step-desc-${index}`}
                    value={step.description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateProcess(index, 'description', e.target.value)
                    }
                    className="rounded-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 联系信息 */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-foreground border-b border-border pb-4 mb-6">
          联系信息
        </h2>
        <div className="md:grid md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-1.5">
            <Label htmlFor="contact-phone" className="text-sm font-medium">
              电话
              <span className="text-destructive ml-0.5">*</span>
            </Label>
            <Input
              id="contact-phone"
              value={settings.contact.phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSettings((prev) => ({
                  ...prev,
                  contact: { ...prev.contact, phone: e.target.value },
                }))
              }
              className="rounded-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-email" className="text-sm font-medium">
              邮箱
              <span className="text-destructive ml-0.5">*</span>
            </Label>
            <Input
              id="contact-email"
              value={settings.contact.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSettings((prev) => ({
                  ...prev,
                  contact: { ...prev.contact, email: e.target.value },
                }))
              }
              className="rounded-sm"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-address" className="text-sm font-medium">
            地址
            <span className="text-destructive ml-0.5">*</span>
          </Label>
          <Input
            id="contact-address"
            value={settings.contact.address}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSettings((prev) => ({
                ...prev,
                contact: { ...prev.contact, address: e.target.value },
              }))
            }
            className="rounded-sm"
          />
        </div>
      </section>

      {/* 页脚信息 */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-foreground border-b border-border pb-4 mb-6">
          页脚信息
        </h2>
        <div className="space-y-1.5 mb-4">
          <Label htmlFor="footer-copyright" className="text-sm font-medium">
            版权文字
            <span className="text-destructive ml-0.5">*</span>
          </Label>
          <Input
            id="footer-copyright"
            value={settings.footer.copyright}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSettings((prev) => ({
                ...prev,
                footer: { ...prev.footer, copyright: e.target.value },
              }))
            }
            className="rounded-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="footer-social-links" className="text-sm font-medium">
            社交媒体链接
          </Label>
          <Textarea
            id="footer-social-links"
            rows={4}
            value={settings.footer.socialLinks}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setSettings((prev) => ({
                ...prev,
                footer: { ...prev.footer, socialLinks: e.target.value },
              }))
            }
            placeholder="每行一个链接，格式：名称|链接"
            className="rounded-sm"
          />
        </div>
      </section>

      {/* 底部保存栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border py-4 z-10">
        <div className="max-w-[1200px] mx-auto px-6 flex justify-end">
          <Button
            onClick={() => { void handleSave(); }}
            disabled={saving}
            className="bg-primary text-primary-foreground rounded-sm px-8"
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SiteSettingsPage;
