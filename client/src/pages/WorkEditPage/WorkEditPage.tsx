import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { Label } from '@client/src/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import SingleImageUpload from '@client/src/components/image-upload/SingleImageUpload';
import GalleryUpload from '@client/src/components/image-upload/GalleryUpload';

import { getWorkById, createWork, updateWork } from '@client/src/api/works';
import type { Work, WorkCategory, GalleryImage } from '@shared/api.interface';
import { logger } from '@/utils/logger';

const CATEGORY_OPTIONS: { value: WorkCategory; label: string }[] = [
  { value: 'logo', label: 'LOGO设计' },
  { value: 'vis', label: '品牌形象' },
  { value: 'packaging', label: '包装设计' },
];

const WorkEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id && id !== 'new';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<WorkCategory>('logo');
  const [client, setClient] = useState('');
  const [industry, setIndustry] = useState('');
  const [designType, setDesignType] = useState('');
  const [year, setYear] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isEdit || !id) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const work: Work = await getWorkById(id);
        setTitle(work.title);
        setCategory(work.category);
        setClient(work.client);
        setIndustry(work.industry);
        setDesignType(work.designType);
        setYear(work.year);
        setDescription(work.description);
        setTags(work.tags || []);
        setContent(work.content);
        setCoverImage(work.coverImage);
        setHeroImage(work.heroImage);
        setGallery(work.gallery || []);
      } catch (err) {
        logger.error('fetch work detail failed', String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, isEdit]);

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = tagInput.trim();
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagInput('');
      }
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = '请输入标题';
    if (!client.trim()) newErrors.client = '请输入客户';
    if (!industry.trim()) newErrors.industry = '请输入行业';
    if (!designType.trim()) newErrors.designType = '请输入设计类型';
    if (!year.trim()) newErrors.year = '请输入年份';
    if (!coverImage.trim()) newErrors.coverImage = '请上传列表封面图';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstField = Object.keys(newErrors)[0];
      toast.error(`保存失败：${newErrors[firstField] ?? '请检查必填项'}`);
      const el = document.querySelector(`[data-field="${firstField}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        title,
        category,
        client,
        industry,
        designType,
        year,
        description,
        tags,
        content,
        coverImage,
        heroImage,
        gallery,
      };
      if (isEdit && id) {
        await updateWork(id, payload);
        toast.success('更新成功');
      } else {
        await createWork(payload);
        toast.success('创建成功');
      }
      navigate('/admin/works');
    } catch (err) {
      logger.error('save work failed', String(err));
      toast.error('保存失败，请检查表单内容');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        加载中...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">
          {isEdit ? '编辑作品' : '新增作品'}
        </h1>
      </div>

      <div className="space-y-6">
        {/* 基础信息 */}
        <section className="bg-card border border-border rounded-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-foreground">基础信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <div className="space-y-1.5" data-field="title">
               <Label className="text-sm font-medium text-foreground">
                 标题 <span className="text-destructive">*</span>
               </Label>
               <Input
                 value={title}
                 onChange={(e) => {
                   setTitle(e.target.value);
                   clearError('title');
                 }}
                 placeholder="请输入标题"
                 className={`rounded-sm ${errors.title ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
               />
               {errors.title && (
                 <p className="text-xs text-destructive" data-error="title">{errors.title}</p>
               )}
             </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                分类 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={category}
                onValueChange={(val) => setCategory(val as WorkCategory)}
              >
                <SelectTrigger className="w-full rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-1.5" data-field="client">
               <Label className="text-sm font-medium text-foreground">
                 客户 <span className="text-destructive">*</span>
               </Label>
               <Input
                 value={client}
                 onChange={(e) => {
                   setClient(e.target.value);
                   clearError('client');
                 }}
                 placeholder="请输入客户名称"
                 className={`rounded-sm ${errors.client ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
               />
               {errors.client && (
                 <p className="text-xs text-destructive" data-error="client">{errors.client}</p>
               )}
             </div>
             <div className="space-y-1.5" data-field="industry">
               <Label className="text-sm font-medium text-foreground">
                 行业 <span className="text-destructive">*</span>
               </Label>
               <Input
                 value={industry}
                 onChange={(e) => {
                   setIndustry(e.target.value);
                   clearError('industry');
                 }}
                 placeholder="请输入所属行业"
                 className={`rounded-sm ${errors.industry ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
               />
               {errors.industry && (
                 <p className="text-xs text-destructive" data-error="industry">{errors.industry}</p>
               )}
             </div>
             <div className="space-y-1.5" data-field="designType">
               <Label className="text-sm font-medium text-foreground">
                 设计类型 <span className="text-destructive">*</span>
               </Label>
               <Input
                 value={designType}
                 onChange={(e) => {
                   setDesignType(e.target.value);
                   clearError('designType');
                 }}
                 placeholder="请输入设计类型"
                 className={`rounded-sm ${errors.designType ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
               />
               {errors.designType && (
                 <p className="text-xs text-destructive" data-error="designType">{errors.designType}</p>
               )}
             </div>
             <div className="space-y-1.5" data-field="year">
               <Label className="text-sm font-medium text-foreground">
                 年份 <span className="text-destructive">*</span>
               </Label>
               <Input
                 value={year}
                 onChange={(e) => {
                   setYear(e.target.value);
                   clearError('year');
                 }}
                 placeholder="如 2024"
                 className={`rounded-sm ${errors.year ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
               />
               {errors.year && (
                 <p className="text-xs text-destructive" data-error="year">{errors.year}</p>
               )}
             </div>
          </div>
        </section>

        {/* 描述内容 */}
        <section className="bg-card border border-border rounded-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-foreground">描述内容</h2>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              一句话描述
            </Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简短描述作品"
              className="rounded-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              标签
            </Label>
            <div className="flex flex-wrap items-center gap-2 min-h-9 px-3 py-2 border border-border rounded-sm bg-background focus-within:border-ring focus-within:ring-ring/20 focus-within:ring-[3px] transition-[color,box-shadow]">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs rounded-sm px-2 py-0.5"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-foreground transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={tags.length === 0 ? '输入标签后按回车添加' : ''}
                className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              输入标签文字，按回车键添加
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              项目介绍
            </Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入项目详细介绍"
              className="rounded-sm min-h-[160px]"
            />
          </div>
        </section>

        {/* 图片上传 */}
        <section className="bg-card border border-border rounded-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-foreground">图片上传</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <div data-field="coverImage">
               <SingleImageUpload
                 label="列表封面图"
                 value={coverImage}
                 onChange={(v) => {
                   setCoverImage(v);
                   clearError('coverImage');
                 }}
                 error={errors.coverImage}
               />
             </div>
            <SingleImageUpload
              label="详情页 Hero 大图"
              value={heroImage}
              onChange={setHeroImage}
            />
          </div>
          <GalleryUpload
            label="画廊图片"
            value={gallery}
            onChange={setGallery}
          />
        </section>
      </div>

      {/* 底部操作栏 */}
      <div className="sticky bottom-0 bg-background border-t border-border -mx-6 px-6 py-4 flex items-center justify-end gap-3">
        <Button
          variant="outline"
          className="rounded-sm"
          onClick={() => navigate('/works')}
        >
          取消
        </Button>
        <Button
          className="rounded-sm bg-primary text-primary-foreground"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '保存中...' : '保存'}
        </Button>
      </div>
    </div>
  );
};

export default WorkEditPage;
