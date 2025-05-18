'use client';

import { useState, useRef, ChangeEvent, ReactNode } from 'react';
import { Button } from './button';
import { Upload, ImageIcon, X } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  currentImageUrl?: string;
  onUpload: (file: File) => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'square' | 'circle';
  className?: string;
  children?: ReactNode;
}

export function ImageUpload({
  currentImageUrl,
  onUpload,
  size = 'md',
  shape = 'circle',
  className = '',
  children,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClass = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
  }[size];

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('File must be an image');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      await onUpload(file);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {previewUrl ? (
        <div className="relative group">
          <div 
            className={`${sizeClass} ${shape === 'circle' ? 'rounded-full' : 'rounded-lg'} overflow-hidden border-2 border-[#00ffcc] bg-[#232526] shadow-[0_0_30px_#00ffcc33]`}
          >
            <Image
              src={previewUrl}
              alt="Profile picture"
              fill
              className="object-cover"
            />
          </div>
          
          <div className={`absolute inset-0 ${shape === 'circle' ? 'rounded-full' : 'rounded-lg'} bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2`}>
            <Button
              type="button"
              onClick={handleClick}
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 rounded-full bg-[#232526] border-[#00ffcc] text-[#00ffcc]"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              onClick={clearImage}
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 rounded-full bg-[#232526] border-red-500 text-red-500"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className={`${sizeClass} ${shape === 'circle' ? 'rounded-full' : 'rounded-lg'} flex flex-col items-center justify-center border-2 border-dashed border-[#00bfff] bg-[#232526] hover:border-[#00ffcc] hover:bg-[#00ffcc22] transition-colors`}
          disabled={isUploading}
        >
          {isUploading ? (
            <div className="h-6 w-6 border-2 border-[#00ffcc] border-t-transparent rounded-full animate-spin" />
          ) : children ? (
            children
          ) : (
            <>
              <ImageIcon className="h-6 w-6 text-[#00bfff]" />
              <span className="mt-1 text-xs text-[#00bfff]">Upload</span>
            </>
          )}
        </button>
      )}
      
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
} 