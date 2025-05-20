'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { productAPI } from '@/lib/api';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { formatRupiah } from '@/lib/utils';
import clsx from 'clsx';

// Define API response interfaces for better type safety
interface ApiResponse {
  success?: boolean;
  message?: string;
  data?: {
    product?: Product;
  } | Product;
  product?: Product;
}

// Simplified product statuses
enum ProductStatus {
  CREATED = "CREATED",
  TRANSFERRED = "TRANSFERRED",
  VERIFIED = "VERIFIED",
  RECEIVED = "RECEIVED"
}

const getStatusBadgeClass = (status: string) => {
  switch (status?.toUpperCase()) {
    case ProductStatus.CREATED:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
    case ProductStatus.TRANSFERRED:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
    case ProductStatus.VERIFIED:
      return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
    case ProductStatus.RECEIVED:
      return 'bg-teal-100 text-teal-800 dark:bg-teal-800 dark:text-teal-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

// Add a custom background effect component
function Web3Background() {
  // You can reuse the same particle/gradient background as in the products list
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

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const { data: session } = useSession();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      fetchProduct(productId);
    }
  }, [productId]);

  const fetchProduct = async (productId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Cast the response to our ApiResponse type
      const response = await productAPI.getProductById(productId) as unknown as ApiResponse;
      
      // Extract product based on response structure
      let extractedProduct: Product | null = null;
      
      if (response) {
        if (response.data && typeof response.data === 'object') {
          if ('product' in response.data && response.data.product) {
            // Handle {data: {product: {...}}}
            extractedProduct = response.data.product;
          } else if ('id' in response.data) {
            // Handle {data: {...}} where data is the product
            extractedProduct = response.data as Product;
          }
        } else if (response.product) {
          // Handle {product: {...}}
          extractedProduct = response.product;
        } else if ('id' in response) {
          // Handle case where response itself is the product
          extractedProduct = response as unknown as Product;
        }
      }
      
      if (extractedProduct) {
        setProduct(extractedProduct);
      } else {
        setError('Product data structure is not as expected');
        console.error('Unexpected product data structure:', response);
      }
    } catch (error: any) {
      console.error('Error fetching product:', error);
      setError(error.response?.data?.message || 'Failed to load product details. The product may not exist or you may not have permission to view it.');
    } finally {
      setIsLoading(false);
    }
  };

  const isOwner = product && session?.user?.id === product.owner;

  const handleTransferClick = () => {
    router.push(`/products/${productId}/transfer`);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Web3Background />
      <header>
        <div className="max-w-[900px] mx-auto px-6 flex items-center gap-4 mt-10 mb-8">
          <button
            onClick={() => router.back()}
            className="mr-4 text-[#a259ff] hover:text-[#00ffcc] font-orbitron text-lg transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-orbitron text-[#a259ff] drop-shadow-[0_0_30px_#00ffcc] animate-glow font-extrabold" style={{ border: 'none', background: 'transparent', boxShadow: 'none', textShadow: '0 0 20px rgba(0, 255, 204, 0.6), 0 0 40px rgba(162, 89, 255, 0.4)' }}>Product Details</h1>
        </div>
      </header>
      <main>
        <div className="max-w-[900px] mx-auto px-6">
          {isLoading ? (
            <div className="text-center py-10">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-[#00ffcc]" role="status" />
              <p className="mt-2 text-[#a259ff] font-space">Loading product details...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <div className="rounded-md bg-red-900/30 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-red-400">⛔</span>
                  <span className="text-red-200 font-space">{error}</span>
                </div>
              </div>
            </div>
          ) : product ? (
            <div className="space-y-8">
              {/* Product Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-4">
                <div className="w-full">
                  <h2 className="text-4xl font-orbitron mb-2 bg-gradient-to-r from-[#a259ff] via-[#00ffcc] to-[#00bfff] bg-clip-text text-transparent drop-shadow-[0_0_20px_#00ffcc] animate-glow">
                    {product.name}
                  </h2>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-fira text-xs text-gray-400 mb-2 block">
                      {(() => {
                        if (!product.id) return '';
                        const parts = product.id.split('-');
                        return `prod-${parts[parts.length - 1]}`;
                      })()}
                    </span>
                  </div>
                  {/* Animated Status Bar */}
                  <div className="w-full h-10 rounded-2xl mt-1 mb-8 relative overflow-hidden">
                    <div className="absolute inset-0 w-full h-full animate-status-bar bg-gradient-to-r from-[#00ffcc] via-[#a259ff] to-[#00bfff] opacity-80" />
                    <span className="relative z-10 flex items-center justify-center h-full font-orbitron text-lg font-bold text-white drop-shadow-[0_0_10px_#18122B]">
                      {product.status || 'UNKNOWN'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {/* Remove the Transfer button - comment out or delete this code block
                  {isOwner && (
                    <Button variant="primary" onClick={handleTransferClick} className="bg-[#00ffcc] text-[#18122B] font-orbitron hover:bg-[#a259ff] hover:text-white transition-all duration-300">Transfer</Button>
                  )}
                  */}
                </div>
              </div>
              {/* Product Details Card */}
              <div className="rounded-2xl bg-gradient-to-br from-[#232526cc] to-[#18122Bcc] border-2 border-[#00ffcc] p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 animate-fadeIn relative">
                <div>
                  <div className="mb-3">
                    <span className="block text-xs font-space text-gray-400 mb-1">Description</span>
                    <span className="text-lg font-space text-white">{product.description}</span>
                  </div>
                  <div className="mb-3">
                    <span className="block text-xs font-space text-gray-400 mb-1">Category</span>
                    <span className="text-base font-space text-[#a259ff]">{product.category || '-'}</span>
                  </div>
                  <div className="mb-3">
                    <span className="block text-xs font-space text-gray-400 mb-1">Owner</span>
                    <span className="text-base font-space text-[#00ffcc]">{product.ownerName || session?.user?.name || 'Unknown'}</span>
                  </div>
                </div>
                <div>
                  <div className="mb-3">
                    <span className="block text-xs font-space text-gray-400 mb-1">Price</span>
                    <span className="text-xl font-orbitron text-[#00ffcc] font-bold">{typeof formatRupiah === 'function' ? formatRupiah(product.price) : `Rp ${product.price?.toLocaleString()}`}</span>
                  </div>
                  <div className="mb-3">
                    <span className="block text-xs font-space text-gray-400 mb-1">Quantity</span>
                    <span className="text-base font-space text-white">{product.quantity}</span>
                  </div>
                  <div className="mb-3">
                    <span className="block text-xs font-space text-gray-400 mb-1">Created At</span>
                    <span className="text-base font-space text-white">{new Date(product.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="mb-3">
                    <span className="block text-xs font-space text-gray-400 mb-1">Last Updated</span>
                    <span className="text-base font-space text-white">{new Date(product.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
                {/* View Transactions button at bottom right */}
                <div className="col-span-full flex justify-end mt-12">
                  <Link href={`/transactions?productId=${product.id}`}>
                    <Button variant="outline" className="border-[#00ffcc] text-[#00ffcc] hover:bg-[#00ffcc] hover:text-[#18122B] font-orbitron transition-all duration-300 px-6 py-2 text-base">View Transactions</Button>
                  </Link>
                </div>
              </div>
              {/* Metadata Card */}
              {product.metadata && Object.keys(product.metadata).length > 0 && (
                <div className="rounded-2xl bg-gradient-to-br from-[#232526cc] to-[#18122Bcc] border-2 border-[#a259ff] p-6 animate-fadeIn">
                  <h3 className="text-xl font-orbitron text-[#a259ff] mb-4">Product Metadata</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(product.metadata).map(([key, value]) => (
                      <div key={key} className="bg-[#18122B] rounded-xl p-4 border border-[#00ffcc] hover:shadow-[0_0_20px_#00ffcc77] transition-all">
                        <h4 className="text-sm font-space text-[#a259ff] capitalize">{key}</h4>
                        <p className="mt-2 text-sm font-fira text-[#00ffcc]">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-[#a259ff] font-space">Product not found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Add this to your global CSS for the glow effect:
// .glow-status {
//   box-shadow: 0 0 16px 2px #00ffcc99, 0 0 32px 4px #a259ff55;
// }

// Add this to your global CSS for the animated status bar:
// @keyframes status-bar {
//   0% { background-position: 0% 50%; }
//   100% { background-position: 100% 50%; }
// }
// .animate-status-bar {
//   background-size: 200% 200%;
//   animation: status-bar 2s linear infinite;
// }
