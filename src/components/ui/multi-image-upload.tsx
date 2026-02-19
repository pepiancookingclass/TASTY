'use client';

import { useState, useRef } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Loader2, X, Image as ImageIcon, Plus, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import Image from 'next/image';

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  bucket?: string;
  maxImages?: number;
  className?: string;
}

export function MultiImageUpload({
  value = [],
  onChange,
  folder = 'products',
  bucket = 'images',
  maxImages = 6,
  className = '',
}: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Solo se permiten imágenes JPG, PNG, WebP o GIF');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5MB');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setSelectedFile(file);
  };

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

      onChange([...value, data.url]);
      handleCancelPreview();
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Error al subir imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newUrls = [...value];
    [newUrls[index - 1], newUrls[index]] = [newUrls[index], newUrls[index - 1]];
    onChange(newUrls);
  };

  const handleMoveDown = (index: number) => {
    if (index === value.length - 1) return;
    const newUrls = [...value];
    [newUrls[index], newUrls[index + 1]] = [newUrls[index + 1], newUrls[index]];
    onChange(newUrls);
  };

  const canAddMore = value.length < maxImages;

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

      {/* Imágenes existentes */}
      {value.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-sm text-muted-foreground">
            {value.length} de {maxImages} imágenes (la primera es la portada)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {value.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className={`relative rounded-lg overflow-hidden border-2 aspect-square group ${
                  index === 0 ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                }`}
              >
                <Image
                  src={url}
                  alt={`Imagen ${index + 1}`}
                  fill
                  className="object-cover"
                />
                
                {/* Badge de portada */}
                {index === 0 && (
                  <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                    Portada
                  </div>
                )}

                {/* Controles de la imagen */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  {/* Mover arriba */}
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleMoveUp(index)}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {/* Mover abajo */}
                  {index < value.length - 1 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleMoveDown(index)}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {/* Eliminar */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview de nueva imagen */}
      {previewUrl && (
        <div className="space-y-3 mb-4">
          <div className="relative rounded-lg overflow-hidden border-2 border-amber-400 aspect-square max-w-[200px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded">
              Nueva imagen
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleConfirmUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {isUploading ? 'Subiendo...' : 'Agregar'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancelPreview}
              disabled={isUploading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Botón para agregar más */}
      {canAddMore && !previewUrl && (
        <div
          onClick={() => !isUploading && inputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Subiendo...</p>
            </>
          ) : (
            <>
              <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {value.length === 0 ? 'Agregar imágenes' : 'Agregar otra imagen'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, WebP o GIF (máx. 5MB cada una)
              </p>
            </>
          )}
        </div>
      )}

      {/* Mensaje de límite alcanzado */}
      {!canAddMore && !previewUrl && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Máximo de {maxImages} imágenes alcanzado
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
    </div>
  );
}
