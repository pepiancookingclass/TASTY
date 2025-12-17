import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { NewProductForm } from '@/components/chef/NewProductForm';

export default function NewProductPage() {
    return (
        <div className="container mx-auto px-4 py-8">
             <Breadcrumb className="mb-8">
                <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href="/chef/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>Add New Product</BreadcrumbPage>
                </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <h1 className="font-headline text-4xl font-bold mb-2">Add a New Product</h1>
            <p className="text-muted-foreground mb-8">Fill out the details below to list a new item for sale.</p>

            <NewProductForm />
        </div>
    );
}
