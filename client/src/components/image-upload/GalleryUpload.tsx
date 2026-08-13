import { useState } from 'react';
import { X, Plus } from 'lucide-react';

import type { GalleryImage } from '@shared/api.interface';
import Image from '@client/src/components/ui/image';
import { Label } from '@client/src/components/ui/label';
import { Input } from '@client/src/components/ui/input';
import { Button } from '@client/src/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';

interface GalleryUploadProps {
  value: GalleryImage[];
  onChange: (items: GalleryImage[]) => void;
  label?: string;
}

const GalleryUpload = ({ value, onChange, label }: GalleryUploadProps) => {
  const [newUrl, setNewUrl] = useState('');

  const handleAdd = () => {
    if (!newUrl.trim()) return;
    onChange([...value, { url: newUrl.trim(), layout: 'full' }]);
    setNewUrl('');
  };

  const handleRemove = (index: number) => {
    const next = value.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleLayoutChange = (index: number, layout: string) => {
    const next = value.map((item, i) =>
      i === index ? { ...item, layout: layout as GalleryImage['layout'] } : item,
    );
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {label && (
        <Label className="text-sm font-medium text-foreground">
          {label}
        </Label>
      )}
      <div className="flex gap-2">
        <Input
          type="url"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="输入图片URL，点击添加"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button variant="secondary" onClick={handleAdd} type="button">
          <Plus className="size-4 mr-1" />
          添加
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {value.map((item, index) => (
          <div
            key={index}
            className="relative aspect-square border border-border rounded-sm overflow-hidden bg-muted/20"
          >
            <Image
              src={item.url}
              alt={`gallery-${index}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-2 right-2 size-6 bg-background/90 border border-border rounded-sm flex items-center justify-center text-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
            >
              <X className="size-3.5" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-background/80 border-t border-border">
              <Select
                value={item.layout}
                onValueChange={(val) => handleLayoutChange(index, val)}
              >
                <SelectTrigger size="sm" className="w-full h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">全宽</SelectItem>
                  <SelectItem value="side-by-side">并排</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GalleryUpload;
