'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { productAPI } from '@/lib/api';
import { UserRole } from '@/lib/types';
import Link from 'next/link';
import clsx from 'clsx';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0.01, 'Price must be greater than 0'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  category: z.string().optional(),
  unit: z.string().optional(),
  location: z.string().optional(),
  productionDate: z.string().optional(),
  expiryDate: z.string().optional(),
  qualityScore: z.coerce.number().min(0).max(100).optional(),
  metadata: z.record(z.string()).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

// Add a custom background effect component
function Web3Background() {
  return (
    <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#18122B] via-[#232526] to-[#0f2027] animate-gradient-move">
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute rounded-full opacity-20 animate-float"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              width: `${(i % 8) + 6}px`,
              height: `${(i % 8) + 6}px`,
              background: `linear-gradient(135deg, #a259ff, #00ffcc, #00bfff)`
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function NewProductPage() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attributeFields, setAttributeFields] = useState<{ key: string; value: string }[]>([]);  // Only allow certain roles to create products
  const allowedRoles = [UserRole.FARMER, UserRole.COLLECTOR, UserRole.TRADER, UserRole.RETAILER, UserRole.ADMIN];
  const userRole = session?.user?.role as UserRole | undefined;
  const canCreateProduct = userRole ? allowedRoles.includes(userRole) : false;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      quantity: 1,
      category: '',
      unit: '',
      location: '',
      productionDate: '',
      expiryDate: '',
      qualityScore: 0,
      metadata: {},
    },
  });

  const addAttributeField = () => {
    setAttributeFields([...attributeFields, { key: '', value: '' }]);
  };

  const removeAttributeField = (index: number) => {
    const updatedFields = [...attributeFields];
    updatedFields.splice(index, 1);
    setAttributeFields(updatedFields);
  };

  const handleAttributeChange = (index: number, field: 'key' | 'value', value: string) => {
    const updatedFields = [...attributeFields];
    updatedFields[index][field] = value;
    setAttributeFields(updatedFields);
  };
  const onSubmit = async (data: ProductFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated and has the correct role
      if (!session?.user?.id) {
        console.error('User not authenticated for product creation.');
        setError('Please log in again to create products.');
        setTimeout(() => router.push('/login'), 1500);
        return;
      }

      if (!canCreateProduct) {
        console.error('User does not have permission to create products:', {
          userRole: session?.user?.role
        });
        setError('You do not have permission to create products. Please check your account role.');
        return;
      }

      // Check for token
      if (!session?.user?.accessToken) {
        console.warn('No access token available, attempting to refresh session');
        // Try to update the session before proceeding
        try {
          await updateSession();
          console.log('Session updated');
        } catch (sessionError) {
          console.error('Failed to refresh session:', sessionError);
        }
      }

      // Prepare metadata from the attribute fields
      const metadataObj: Record<string, string> = {};
      attributeFields.forEach(field => {
        if (field.key.trim() !== '' && field.value.trim() !== '') {
          metadataObj[field.key] = field.value;
        }
      });

      // Prepare the product data
      const productData = {
        ...data,
        metadata: {
          ...metadataObj,
          ...(data.metadata || {})
        },
        // Convert dates to timestamps if provided
        productionDate: data.productionDate ? new Date(data.productionDate).getTime() : undefined,
        expiryDate: data.expiryDate ? new Date(data.expiryDate).getTime() : undefined,
        // Set status to CREATED for new products
        status: "CREATED",
        // Add farmerId field to match the backend's expected parameter name
        farmerId: session?.user?.id
      };

      console.log('Creating product with data:', productData);

      const response = await productAPI.createProduct(productData);

      if (response.data && response.data.success) {
        // Check how product ID is returned in the response
        const productId = response.data.data.id || 
                         response.data.data.productId || 
                         (response.data.data.product && response.data.data.product.id);
                         
        if (productId) {
          console.log(`Product created successfully with ID: ${productId}`);
          // Navigate to the product details page
          router.push(`/products/${productId}`);
        } else {
          console.warn('Product created but ID not found in response:', response.data);
          // Just go to products list page if no ID available
          router.push('/products');
        }
      } else {
        setError(response.data?.message || 'Failed to create product. Please try again.');
      }
    } catch (error: any) {
      console.error('Error creating product:', error);
      
      // Handle specific error cases
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 403) {
          setError('Permission denied. Your account may not have sufficient privileges to create products.');
        } else if (status === 401) {
          setError('Your session has expired. Please login again to continue.');
          // Redirect to login after a short delay
          setTimeout(() => router.push('/login'), 2000);
        } else {
          setError(data?.message || `Server error (${status}). Please try again later.`);
        }
      } else if (error.message?.includes('auth_required')) {
        // Handle the specific auth_required error
        setError('Authentication required. Please login again to continue.');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError('An error occurred while creating the product. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute roles={allowedRoles}>
      <div className="relative min-h-screen overflow-x-hidden">
        <Web3Background />
        <header>
          <div className="max-w-[900px] mx-auto px-6 flex items-center gap-4 mt-10 mb-8">
            <Link href="/products" className="mr-4 text-[#a259ff] hover:text-[#00ffcc] font-orbitron text-lg transition-colors">
              ← Back
            </Link>
            <h1 className="text-4xl font-orbitron bg-gradient-to-r from-[#a259ff] via-[#00ffcc] to-[#00bfff] bg-clip-text text-transparent drop-shadow-[0_0_20px_#00ffcc] animate-glow">Add New Product</h1>
          </div>
        </header>
        <main>
          <div className="max-w-[900px] mx-auto px-6">
            <div className="rounded-3xl bg-gradient-to-br from-[#232526cc] to-[#18122Bcc] border-2 border-[#a259ff] shadow-[0_0_30px_#a259ff33] p-8 animate-fadeIn">
              {!canCreateProduct ? (
                <div className="bg-yellow-900/30 border-l-4 border-yellow-400 p-4 mb-6 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-400">⚠️</span>
                    <span className="text-yellow-200 font-space">You do not have permission to create products. Only farmers, collectors, traders, retailers, and admins can create products.</span>
                  </div>
                </div>
              ) : (
                <div>
                  {error && (
                    <div className="rounded-md bg-red-900/30 p-4 mb-6">
                      <div className="flex items-center gap-3">
                        <span className="text-red-400">⛔</span>
                        <span className="text-red-200 font-space">{error}</span>
                      </div>
                    </div>
                  )}
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
                    {/* Product Name */}
                    <div>
                      <label htmlFor="name" className="block text-xs font-orbitron text-[#a259ff] mb-1">Product Name <span className="text-red-500">*</span></label>
                      <div className="bg-gradient-to-r from-[#00ffcc] to-[#a259ff] p-[2px] rounded-xl">
                        <input
                          type="text"
                          id="name"
                          {...register('name')}
                          className="font-space bg-[#18122B] text-[#a259ff] placeholder:text-[#a259ff] focus:outline-none rounded-xl px-6 py-3 w-full text-lg border-none shadow-none"
                          placeholder="Enter product name"
                        />
                      </div>
                      {errors.name && (
                        <p className="mt-1 text-xs text-red-400 font-space">{errors.name.message}</p>
                      )}
                    </div>
                    {/* Description */}
                    <div>
                      <label htmlFor="description" className="block text-xs font-orbitron text-[#a259ff] mb-1">Description <span className="text-red-500">*</span></label>
                      <div className="bg-gradient-to-r from-[#a259ff] to-[#00ffcc] p-[2px] rounded-xl">
                        <textarea
                          id="description"
                          rows={3}
                          {...register('description')}
                          className="font-space bg-[#18122B] text-[#a259ff] placeholder:text-[#a259ff] focus:outline-none rounded-xl px-6 py-3 w-full text-lg border-none shadow-none"
                          placeholder="Describe your product"
                        />
                      </div>
                      {errors.description && (
                        <p className="mt-1 text-xs text-red-400 font-space">{errors.description.message}</p>
                      )}
                    </div>
                    {/* Price & Quantity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                      <div>
                        <label htmlFor="price" className="block text-xs font-orbitron text-[#a259ff] mb-1">Price (Rp) <span className="text-red-500">*</span></label>
                        <div className="bg-gradient-to-r from-[#00ffcc] to-[#a259ff] p-[2px] rounded-xl">
                          <input
                            type="number"
                            id="price"
                            {...register('price')}
                            className="font-space bg-[#18122B] text-[#00ffcc] placeholder:text-[#a259ff] focus:outline-none rounded-xl px-6 py-3 w-full text-lg border-none shadow-none"
                            placeholder="0"
                            step="0.01"
                          />
                        </div>
                        {errors.price && (
                          <p className="mt-1 text-xs text-red-400 font-space">{errors.price.message}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="quantity" className="block text-xs font-orbitron text-[#a259ff] mb-1">Quantity <span className="text-red-500">*</span></label>
                        <div className="bg-gradient-to-r from-[#a259ff] to-[#00ffcc] p-[2px] rounded-xl">
                          <input
                            type="number"
                            id="quantity"
                            min="1"
                            step="1"
                            {...register('quantity')}
                            className="font-space bg-[#18122B] text-[#00ffcc] placeholder:text-[#a259ff] focus:outline-none rounded-xl px-6 py-3 w-full text-lg border-none shadow-none"
                            placeholder="1"
                          />
                        </div>
                        {errors.quantity && (
                          <p className="mt-1 text-xs text-red-400 font-space">{errors.quantity.message}</p>
                        )}
                      </div>
                    </div>
                    {/* Category & Unit */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                      <div>
                        <label htmlFor="category" className="block text-xs font-orbitron text-[#a259ff] mb-1">Category</label>
                        <div className="bg-gradient-to-r from-[#00ffcc] to-[#a259ff] p-[2px] rounded-xl">
                          <input
                            type="text"
                            id="category"
                            {...register('category')}
                            className="font-space bg-[#18122B] text-[#a259ff] placeholder:text-[#a259ff] focus:outline-none rounded-xl px-6 py-3 w-full text-lg border-none shadow-none"
                            placeholder="e.g. Fruit, Vegetable, etc."
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="unit" className="block text-xs font-orbitron text-[#a259ff] mb-1">Unit</label>
                        <div className="bg-gradient-to-r from-[#a259ff] to-[#00ffcc] p-[2px] rounded-xl">
                          <input
                            type="text"
                            id="unit"
                            {...register('unit')}
                            className="font-space bg-[#18122B] text-[#a259ff] placeholder:text-[#a259ff] focus:outline-none rounded-xl px-6 py-3 w-full text-lg border-none shadow-none"
                            placeholder="kg, box, piece, etc."
                          />
                        </div>
                      </div>
                    </div>
                    {/* Location */}
                    <div>
                      <label htmlFor="location" className="block text-xs font-orbitron text-[#a259ff] mb-1">Production Location</label>
                      <div className="bg-gradient-to-r from-[#00ffcc] to-[#a259ff] p-[2px] rounded-xl">
                        <input
                          type="text"
                          id="location"
                          {...register('location')}
                          className="font-space bg-[#18122B] text-[#a259ff] placeholder:text-[#a259ff] focus:outline-none rounded-xl px-6 py-3 w-full text-lg border-none shadow-none"
                          placeholder="Farm location or production facility"
                        />
                      </div>
                    </div>
                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                      <div>
                        <label htmlFor="productionDate" className="block text-xs font-orbitron text-[#a259ff] mb-1">Production Date</label>
                        <div className="bg-gradient-to-r from-[#00ffcc] to-[#a259ff] p-[2px] rounded-xl">
                          <input
                            type="date"
                            id="productionDate"
                            {...register('productionDate')}
                            className="font-space bg-[#18122B] text-[#a259ff] focus:outline-none rounded-xl px-6 py-3 w-full text-lg border-none shadow-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="expiryDate" className="block text-xs font-orbitron text-[#a259ff] mb-1">Expiry Date</label>
                        <div className="bg-gradient-to-r from-[#a259ff] to-[#00ffcc] p-[2px] rounded-xl">
                          <input
                            type="date"
                            id="expiryDate"
                            {...register('expiryDate')}
                            className="font-space bg-[#18122B] text-[#a259ff] focus:outline-none rounded-xl px-6 py-3 w-full text-lg border-none shadow-none"
                          />
                        </div>
                      </div>
                    </div>
                    {/* Quality Score */}
                    <div>
                      <label htmlFor="qualityScore" className="block text-xs font-orbitron text-[#a259ff] mb-1">Quality Score (0-100)</label>
                      <div className="bg-gradient-to-r from-[#00ffcc] to-[#a259ff] p-[2px] rounded-xl">
                        <input
                          type="number"
                          id="qualityScore"
                          min="0"
                          max="100"
                          step="1"
                          {...register('qualityScore')}
                          className="font-space bg-[#18122B] text-[#a259ff] focus:outline-none rounded-xl px-6 py-3 w-full text-lg border-none shadow-none"
                          placeholder="0-100"
                        />
                      </div>
                      {errors.qualityScore && (
                        <p className="mt-1 text-xs text-red-400 font-space">{errors.qualityScore.message}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">A score indicating the quality of the product, where 0 is lowest and 100 is highest quality.</p>
                    </div>
                    {/* Additional Metadata/Attributes Section */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-orbitron text-[#a259ff]">Additional Metadata</label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={addAttributeField}
                          className="text-xs border-[#a259ff] text-[#a259ff] hover:bg-[#a259ff] hover:text-white font-orbitron transition-all duration-300 px-4 py-1 rounded-lg"
                        >
                          + Add Metadata
                        </Button>
                      </div>
                      {attributeFields.length > 0 && (
                        <div className="mt-3 space-y-3">
                          {attributeFields.map((field, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div className="bg-gradient-to-r from-[#00ffcc] to-[#a259ff] p-[2px] rounded-xl w-1/2">
                                <input
                                  type="text"
                                  placeholder="Metadata key"
                                  value={field.key}
                                  onChange={(e) => handleAttributeChange(index, 'key', e.target.value)}
                                  className="font-space bg-[#18122B] text-[#a259ff] placeholder:text-[#a259ff] focus:outline-none rounded-xl px-4 py-2 w-full text-base border-none shadow-none"
                                />
                              </div>
                              <div className="bg-gradient-to-r from-[#a259ff] to-[#00ffcc] p-[2px] rounded-xl w-1/2">
                                <input
                                  type="text"
                                  placeholder="Value"
                                  value={field.value}
                                  onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                                  className="font-space bg-[#18122B] text-[#a259ff] placeholder:text-[#a259ff] focus:outline-none rounded-xl px-4 py-2 w-full text-base border-none shadow-none"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAttributeField(index)}
                                className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Action Buttons */}
                    <div className="flex justify-end mt-8 gap-4">
                      <Link href="/products">
                        <Button type="button" variant="outline" className="border-[#a259ff] text-[#a259ff] hover:bg-[#a259ff] hover:text-white font-orbitron transition-all duration-300 px-6 py-2 text-base">
                          Cancel
                        </Button>
                      </Link>
                      <Button type="submit" variant="primary" disabled={isLoading} className="bg-gradient-to-r from-[#00ffcc] via-[#a259ff] to-[#00bfff] text-white font-orbitron px-8 py-2 text-base rounded-xl shadow-lg hover:scale-105 transition-all duration-300 animate-glow">
                        {isLoading ? 'Creating...' : 'Create Product'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
