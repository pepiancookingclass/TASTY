'use client';

import { useState, useRef } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Loader2, X, Image as ImageIcon, Check, RefreshCw } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  bucket?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
}

export function ImageUpload({
  value,
  onChange,
  folder = 'uploads',
  bucket = 'images',
  className = '',
  aspectRatio = 'square',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: '',
  };

  // Paso 1: Seleccionar archivo y mostrar preview
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validar tipo
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Solo se permiten imágenes JPG, PNG, WebP o GIF');
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5MB');
      return;
    }

    // Crear preview local
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setSelectedFile(file);
  };

  // Paso 2: Cancelar preview
  const handleCancelPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // Paso 3: Confirmar y subir
  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('bucket', bucket);
      formData.append('folder', folder);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      onChange(data.url);
      handleCancelPreview();
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Error al subir imagen');
    } finally {
      setIsUploading(false);
    }
  };

  // Eliminar imagen actual
  const handleRemove = () => {
    onChange('');
  };

  // Cambiar imagen (seleccionar nueva)
  const handleChange = () => {
    inputRef.current?.click();
  };

  return (
    <div className={className}>
      <Input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* Si hay preview, mostrar previsualización con opciones - usa img nativo para blob URLs */}
      {previewUrl ? (
        <div className="space-y-3">
          <div className={`relative rounded-lg overflow-hidden border-2 border-amber-400 ${aspectClasses[aspectRatio]}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded">
              Previsualización
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleConfirmUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {isUploading ? 'Subiendo...' : 'Confirmar'}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleCancelPreview}
              disabled={isUploading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : value ? (
        /* Si ya hay imagen guardada */
        <div className="space-y-3">
          <div className={`relative rounded-lg overflow-hidden border ${aspectClasses[aspectRatio]}`}>
            <Image
              src={value}
              alt="Uploaded image"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleChange}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Cambiar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
            >
              <X className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>
      ) : (
        /* Si no hay imagen, mostrar área de drop */
        <div
          onClick={() => !isUploading && inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            hover:border-primary hover:bg-muted/50 transition-colors
            ${aspectClasses[aspectRatio]}
            flex flex-col items-center justify-center
          `}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Subiendo...</p>
            </>
          ) : (
            <>
              <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Haz clic para subir una imagen
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, WebP o GIF (máx. 5MB)
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
    </div>
  );
}

