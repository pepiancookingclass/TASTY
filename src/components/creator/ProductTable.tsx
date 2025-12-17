'use client';

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
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/hooks/useLanguage';
import { useDictionary } from '@/hooks/useDictionary';

interface ProductTableProps {
  products: Product[];
}

export function ProductTable({ products }: ProductTableProps) {
  const { language } = useLanguage();
  const dict = useDictionary();
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="border rounded-lg w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px] hidden sm:table-cell">{dict.productTable.image}</TableHead>
            <TableHead>{dict.productTable.productDetails}</TableHead>
            <TableHead className="hidden md:table-cell">{dict.productTable.type}</TableHead>
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
                <Image
                  alt={product.name[language]}
                  className="aspect-square rounded-md object-cover"
                  height="64"
                  src={product.imageUrl}
                  width="64"
                  data-ai-hint={product.imageHint}
                />
              </TableCell>
              <TableCell className="font-medium">
                 <div className="flex items-center gap-3">
                  <div className="sm:hidden">
                    <Image
                      alt={product.name[language]}
                      className="aspect-square rounded-md object-cover"
                      height="40"
                      src={product.imageUrl}
                      width="40"
                      data-ai-hint={product.imageHint}
                    />
                  </div>
                  <div>
                    <div className="font-semibold">{product.name[language]}</div>
                    <div className="text-sm text-muted-foreground sm:hidden">
                      {formatPrice(product.price)}
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
                    <DropdownMenuItem><Pencil className="mr-2 h-4 w-4"/>{dict.productTable.edit}</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>{dict.productTable.delete}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
