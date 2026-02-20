'use client';

import { useState, useRef } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Loader2, X, Plus, ChevronUp, ChevronDown, Upload, Check } from 'lucide-react';
import Image from 'next/image';

interface PendingFile {
  file: File;
  previewUrl: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

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
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);

    const remainingSlots = maxImages - value.length - pendingFiles.length;
    if (remainingSlots <= 0) {
      setError(`Ya alcanzaste el máximo de ${maxImages} imágenes`);
      return;
    }

    const filesToAdd: PendingFile[] = [];
    const errors: string[] = [];

    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];

      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        errors.push(`${file.name}: formato no permitido`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name}: supera 5MB`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      filesToAdd.push({
        file,
        previewUrl,
        status: 'pending',
      });
    }

    if (files.length > remainingSlots) {
      errors.push(`Solo se pueden agregar ${remainingSlots} imágenes más`);
    }

    if (errors.length > 0) {
      setError(errors.join('. '));
    }

    if (filesToAdd.length > 0) {
      setPendingFiles((prev) => [...prev, ...filesToAdd]);
    }

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemovePending = (index: number) => {
    setPendingFiles((prev) => {
      const toRemove = prev[index];
      if (toRemove) {
        URL.revokeObjectURL(toRemove.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleCancelAll = () => {
    pendingFiles.forEach((pf) => URL.revokeObjectURL(pf.previewUrl));
    setPendingFiles([]);
    setError(null);
  };

  const handleUploadAll = async () => {
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    setError(null);

    const uploadedUrls: string[] = [];
    const updatedPending = [...pendingFiles];

    for (let i = 0; i < updatedPending.length; i++) {
      const pf = updatedPending[i];
      if (pf.status !== 'pending') continue;

      updatedPending[i] = { ...pf, status: 'uploading' };
      setPendingFiles([...updatedPending]);

      try {
        const formData = new FormData();
        formData.append('file', pf.file);
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

        uploadedUrls.push(data.url);
        updatedPending[i] = { ...pf, status: 'success' };
        setPendingFiles([...updatedPending]);
      } catch (err: any) {
        console.error('Upload error:', err);
        updatedPending[i] = { ...pf, status: 'error', error: err.message || 'Error' };
        setPendingFiles([...updatedPending]);
      }
    }

    if (uploadedUrls.length > 0) {
      onChange([...value, ...uploadedUrls]);
    }

    setTimeout(() => {
      setPendingFiles((prev) => {
        prev.filter((pf) => pf.status === 'success').forEach((pf) => URL.revokeObjectURL(pf.previewUrl));
        return prev.filter((pf) => pf.status === 'error');
      });
    }, 1000);

    setIsUploading(false);
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

  const canAddMore = value.length + pendingFiles.length < maxImages;

  return (
    <div className={className}>
      <Input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* Imágenes ya subidas */}
      {value.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-sm text-muted-foreground">
            {value.length} de {maxImages} imágenes subidas (la primera es la portada)
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
                
                {index === 0 && (
                  <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                    Portada
                  </div>
                )}

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
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

      {/* Previews de archivos pendientes */}
      {pendingFiles.length > 0 && (
        <div className="space-y-3 mb-4">
          <p className="text-sm font-medium text-amber-600">
            {pendingFiles.length} imagen(es) pendiente(s) de subir
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {pendingFiles.map((pf, index) => (
              <div
                key={`pending-${index}`}
                className={`relative rounded-lg overflow-hidden border-2 aspect-square ${
                  pf.status === 'error' ? 'border-red-400' : 
                  pf.status === 'success' ? 'border-green-400' : 
                  pf.status === 'uploading' ? 'border-blue-400' : 
                  'border-amber-400'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pf.previewUrl}
                  alt={`Preview ${index + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {pf.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
                
                {pf.status === 'success' && (
                  <div className="absolute inset-0 bg-green-500/50 flex items-center justify-center">
                    <Check className="h-6 w-6 text-white" />
                  </div>
                )}
                
                {pf.status === 'error' && (
                  <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                    <X className="h-6 w-6 text-white" />
                  </div>
                )}
                
                {pf.status === 'pending' && !isUploading && (
                  <button
                    type="button"
                    onClick={() => handleRemovePending(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleUploadAll}
              disabled={isUploading || pendingFiles.every((pf) => pf.status !== 'pending')}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir {pendingFiles.filter((pf) => pf.status === 'pending').length} imagen(es)
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancelAll}
              disabled={isUploading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Botón para agregar más */}
      {canAddMore && pendingFiles.length === 0 && (
        <div
          onClick={() => !isUploading && inputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
        >
          <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {value.length === 0 ? 'Seleccionar imágenes' : 'Agregar más imágenes'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Puedes seleccionar varias a la vez (máx. {maxImages - value.length} más)
          </p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WebP o GIF (máx. 5MB cada una)
          </p>
        </div>
      )}

      {/* Botón secundario si hay pendientes */}
      {canAddMore && pendingFiles.length > 0 && !isUploading && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          className="mt-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar más
        </Button>
      )}

      {/* Mensaje de límite alcanzado */}
      {!canAddMore && pendingFiles.length === 0 && (
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
