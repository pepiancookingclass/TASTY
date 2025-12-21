'use client';

import { useState, useRef } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Loader2, X, Plus, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface MultiImageUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  folder?: string;
  className?: string;
}

export function MultiImageUpload({
  values = [],
  onChange,
  maxImages = 5,
  folder = 'workspace',
  className = '',
}: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const canAddMore = values.length < maxImages;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Solo JPG, PNG o WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Máximo 5MB');
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setSelectedFile(file);
  };

  const handleCancelPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);

    try {
      const ext = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      onChange([...values, data.publicUrl]);
      handleCancelPreview();
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error al subir');
    } finally {
      setIsUploading(false);
    }
  };

  // Eliminar una imagen
  const handleRemove = (index: number) => {
    const newValues = values.filter((_, i) => i !== index);
    onChange(newValues);
  };

  return (
    <div className={className}>
      <Input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading || !canAddMore}
      />

      {/* Grid de imágenes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {/* Imágenes existentes */}
        {values.map((url, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Foto ${index + 1}`}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleRemove(index)}
            >
              <X className="h-3 w-3" />
            </Button>
            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
              {index + 1}/{maxImages}
            </div>
          </div>
        ))}

        {/* Preview de imagen pendiente - usa img nativo para blob URLs */}
        {previewUrl && (
          <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-amber-400">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-2">
              <Button
                type="button"
                size="icon"
                className="h-8 w-8 bg-green-600 hover:bg-green-700"
                onClick={handleConfirmUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                onClick={handleCancelPreview}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="absolute top-1 left-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded">
              Preview
            </div>
          </div>
        )}

        {/* Botón para agregar más */}
        {canAddMore && !previewUrl && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-1"
            disabled={isUploading}
          >
            <Plus className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {values.length}/{maxImages}
            </span>
          </button>
        )}
      </div>

      {/* Mensaje de ayuda */}
      <p className="text-xs text-muted-foreground mt-2">
        Sube hasta {maxImages} fotos de tu espacio de trabajo, cocina, herramientas, etc.
      </p>

      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
    </div>
  );
}

