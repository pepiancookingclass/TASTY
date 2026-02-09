'use client';

import { useState } from 'react';
import { Product } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, Loader2, Clock } from 'lucide-react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/hooks/useLanguage';
import { useDictionary } from '@/hooks/useDictionary';
import { useToast } from '@/hooks/use-toast';
import { deleteProduct } from '@/lib/services/products';
import { useRouter } from 'next/navigation';

interface ProductTableProps {
  products: Product[];
  onProductDeleted?: () => void;
}

export function ProductTable({ products, onProductDeleted }: ProductTableProps) {
  const { language } = useLanguage();
  const dict = useDictionary();
  const { toast } = useToast();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
    }).format(price);
  };

  const handleEdit = (product: Product) => {
    router.push(`/creator/products/${product.id}/edit`);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    setDeletingId(productToDelete.id);

    try {
      const success = await deleteProduct(productToDelete.id);
      
      if (success) {
        toast({
          title: dict.productTable.deleteToastTitle,
          description: dict.productTable.deleteToastDesc
            ? dict.productTable.deleteToastDesc(productToDelete.name[language])
            : `"${productToDelete.name[language]}" ha sido eliminado.`,
        });
        onProductDeleted?.();
        router.refresh();
      } else {
        throw new Error('No se pudo eliminar');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        variant: 'destructive',
        title: dict.productTable.deleteErrorTitle,
        description: dict.productTable.deleteErrorDesc,
      });
    } finally {
      setDeletingId(null);
      setProductToDelete(null);
    }
  };

  return (
    <>
    {/* Dialog de confirmación */}
    <AlertDialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dict.productTable.deleteDialogTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {dict.productTable.deleteDialogDesc
              ? dict.productTable.deleteDialogDesc(productToDelete?.name[language] || '')
              : `¿Estás seguro que deseas eliminar "${productToDelete?.name[language]}"? Esta acción no se puede deshacer.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{dict.productTable.deleteCancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deletingId ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            {dict.productTable.deleteConfirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    
    <div className="border rounded-lg w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px] hidden sm:table-cell">{dict.productTable.image}</TableHead>
            <TableHead>{dict.productTable.productDetails}</TableHead>
            <TableHead className="hidden md:table-cell">{dict.productTable.type}</TableHead>
            <TableHead className="hidden lg:table-cell">{dict.productTable.preparation}</TableHead>
            <TableHead className="hidden sm:table-cell">{dict.productTable.price}</TableHead>
            <TableHead>
              <span className="sr-only">{dict.productTable.actions}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
               <TableCell className="hidden sm:table-cell">
                <div className="relative w-16 h-16 rounded-md overflow-hidden">
                  <Image
                    alt={product.name[language]}
                    src={product.imageUrl}
                    fill
                    style={{ objectFit: 'cover', objectPosition: 'center' }}
                    data-ai-hint={product.imageHint}
                  />
                </div>
              </TableCell>
              <TableCell className="font-medium">
                 <div className="flex items-center gap-3">
                  <div className="sm:hidden">
                    <div className="relative w-10 h-10 rounded-md overflow-hidden">
                      <Image
                        alt={product.name[language]}
                        src={product.imageUrl}
                        fill
                        style={{ objectFit: 'cover', objectPosition: 'center' }}
                        data-ai-hint={product.imageHint}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold">{product.name[language]}</div>
                    <div className="text-sm text-muted-foreground sm:hidden">
                      {formatPrice(product.price)}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{product.preparationTime}h</span>
                    </div>
                    <div className="md:hidden mt-1">
                        <Badge variant="outline" className="capitalize">{product.type}</Badge>
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="outline" className="capitalize">{product.type}</Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{product.preparationTime}h</span>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {formatPrice(product.price)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(product)}>
                      <Pencil className="mr-2 h-4 w-4"/>
                      {dict.productTable.edit}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleDeleteClick(product)}
                    >
                      <Trash2 className="mr-2 h-4 w-4"/>
                      {dict.productTable.delete}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    </>
  );
}
