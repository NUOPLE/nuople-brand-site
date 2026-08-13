import { useState } from 'react';
import { X } from 'lucide-react';

import { Input } from '@client/src/components/ui/input';
import Image from '@client/src/components/ui/image';
import { Label } from '@client/src/components/ui/label';

interface SingleImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

const SingleImageUpload = ({
  value,
  onChange,
  label,
  error,
  required,
  placeholder = 'https://example.com/image.jpg',
}: SingleImageUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState(value);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setPreviewUrl(url);
    onChange(url);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl('');
    onChange('');
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <Label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
      )}
      <div className="space-y-2">
        <Input
          type="url"
          value={previewUrl}
          onChange={handleUrlChange}
          placeholder={placeholder}
          className={error ? 'border-destructive' : ''}
        />
        {value ? (
          <div className="relative w-full aspect-[4/3] border border-border rounded-sm overflow-hidden bg-muted/20">
            <Image
              src={value}
              alt="preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 size-6 bg-background/90 border border-border rounded-sm flex items-center justify-center text-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <div className="w-full aspect-[4/3] border border-dashed border-border rounded-sm flex items-center justify-center text-muted-foreground text-sm bg-muted/20">
            图片预览
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-destructive" data-error="coverImage">{error}</p>
      )}
    </div>
  );
};

export default SingleImageUpload;
