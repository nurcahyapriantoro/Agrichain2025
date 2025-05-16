'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getProducts } from '@/lib/api/products';
import { Product, ProductStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { formatRupiah } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Loader2, Search, Filter, X } from 'lucide-react';
import clsx from 'clsx';
import { apiGet } from '@/lib/api/client';

// Use our own simplified status enumeration for display purposes
enum DisplayStatus {
  CREATED = "CREATED",
  TRANSFERRED = "TRANSFERRED",
  VERIFIED = "VERIFIED",
  RECEIVED = "RECEIVED"
}

const getStatusBadgeClass = (status: string | undefined) => {
  if (!status) {
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'; // Default style for undefined status
  }
  
  switch (status.toUpperCase()) {
    case DisplayStatus.CREATED:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
    case DisplayStatus.TRANSFERRED:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
    case DisplayStatus.VERIFIED:
      return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
    case DisplayStatus.RECEIVED:
      return 'bg-teal-100 text-teal-800 dark:bg-teal-800 dark:text-teal-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

// Seeded random number generator
function mulberry32(a: number) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// Generate deterministic positions for particles
const generateParticlePositions = () => {
  const positions = [];
  const random = mulberry32(42); // Use a fixed seed
  
  for (let i = 0; i < 30; i++) {
    positions.push({
      left: `${random() * 100}%`,
      top: `${random() * 100}%`,
      width: `${random() * 8 + 4}px`,
      height: `${random() * 8 + 4}px`
    });
  }
  
  return positions;
};

// Pre-generate positions
const particlePositions = generateParticlePositions();

function Web3Background() {
  return (
    <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#18122B] via-[#232526] to-[#0f2027] animate-gradient-move">
      {/* Animated particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particlePositions.map((pos, i) => (
          <div
            key={`particle-${i}`}
            className="absolute rounded-full opacity-20 animate-float"
            style={{
              left: pos.left,
              top: pos.top,
              width: pos.width,
              height: pos.height,
              background: `linear-gradient(135deg, #a259ff, #00ffcc, #00bfff)`
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null); // Now represents owner role filter
  const [maxPages, setMaxPages] = useState(5); // Add max pages limit
  
  // Owner role filter options
  const filterOptions = [
    { label: 'All', value: null },
    { label: 'FARMER', value: 'FARMER' },
    { label: 'COLLECTOR', value: 'COLLECTOR' },
    { label: 'TRADER', value: 'TRADER' },
    { label: 'RETAILER', value: 'RETAILER' },
  ];
  
  // References for infinite scroll
  const observer = useRef<IntersectionObserver | null>(null);
  const lastProductElementRef = useCallback((node: HTMLElement | null) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreProducts();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore]);
  
  // Function to build query parameters
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    // Sort by creation date, newest first
    params.append('sortBy', 'createdAt');
    params.append('sortOrder', 'desc');
    
    // Add search parameters if provided - always search by name
    if (searchQuery) {
      params.append('name', searchQuery);
    }
    
    // Add owner role filter if selected
    if (activeFilter) {
      params.append('ownerRole', activeFilter);
    }
    
    return params.toString();
  };

  // Initial fetch
  useEffect(() => {
    resetAndFetchProducts();
  }, [searchQuery, activeFilter]);
  
  // Handle search input change with immediate filtering
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Reset and fetch products with the new search term
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Add a small delay to avoid too many API calls while typing
    searchTimeoutRef.current = setTimeout(() => {
      resetAndFetchProducts();
    }, 300);
  };
  
  const resetAndFetchProducts = () => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
    setIsLoading(true);
    setError(null);
    
    fetchProducts(1, true);
  };
  
  const loadMoreProducts = () => {
    if (!loadingMore && hasMore && page < maxPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage, false);
    } else if (page >= maxPages) {
      setHasMore(false);
    }
  };

  const fetchProducts = async (pageNum: number, isReset: boolean) => {
    try {
      if (!isReset) {
        setLoadingMore(true);
      }
      
      const queryParams = buildQueryParams();
      console.log(`Fetching products, page ${pageNum} with params:`, queryParams);
      
      // Try using the updated endpoint format first
      try {
        const response = await getProducts(pageNum, 20, queryParams);
        processProductsResponse(response, isReset, pageNum, newProducts => newProducts.length === 20);
      } catch (error: any) {
        // If 404, try alternative endpoint
        if (error.response?.status === 404) {
          console.warn('Products endpoint returned 404, trying alternative endpoint');
          // Parse queryParams
          const params = typeof queryParams === 'string' 
            ? new URLSearchParams(queryParams) 
            : queryParams;
          const paramsObject = { page: pageNum, limit: 20 };
          
          // Add all params from URLSearchParams to paramsObject
          if (params instanceof URLSearchParams) {
            for (const [key, value] of params.entries()) {
              (paramsObject as any)[key] = value;
            }
          }
          
          const alternativeResponse = await apiGet('/product', paramsObject);
          processProductsResponse(alternativeResponse, isReset, pageNum, newProducts => newProducts.length === 20);
        } else {
          throw error; // Rethrow to be caught by outer catch
        }
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setError(`Failed to load products. ${error.response?.data?.message || 'Please try again.'}`);
      if (isReset) {
        setProducts([]);
      }
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };
  
  // Helper to process product responses, which could come in different formats
  const processProductsResponse = (
    response: any, 
    isReset: boolean, 
    pageNum: number,
    hasMoreCheck: (newProducts: any[]) => boolean
  ) => {
    // Handle different response formats
    let newProducts: any[] = [];
    
    if (response?.products) {
      newProducts = response.products;
    } else if (response?.data?.products) {
      newProducts = response.data.products;
    } else if (Array.isArray(response)) {
      newProducts = response;
    } else if (response?.data && Array.isArray(response.data)) {
      newProducts = response.data;
    } else {
      console.warn('Unexpected response format:', response);
      newProducts = [];
    }
    
    // Filter products by name search and owner role
    let filteredProducts = newProducts;
    
    // Skip non-product entries without required fields
    filteredProducts = filteredProducts.filter(product => 
      product && product.ownerId && product.name
    );
    
    // Filter by search query (case insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filteredProducts = filteredProducts.filter(product => 
        product.name && product.name.toLowerCase().includes(query)
      );
    }
    
    // Filter by owner role if active
    if (activeFilter) {
      filteredProducts = filteredProducts.filter(product => {
        const ownerIdUpperCase = product.ownerId.toUpperCase();
        const ownerNameUpperCase = product.ownerName ? product.ownerName.toUpperCase() : '';
        
        switch(activeFilter) {
          case 'FARMER':
            return ownerIdUpperCase.includes('FARM') || ownerNameUpperCase.includes('FARMER');
          case 'COLLECTOR':
            return ownerIdUpperCase.includes('COLL') || ownerNameUpperCase.includes('COLLECTOR');
          case 'TRADER':
            return ownerIdUpperCase.includes('TRAD') || ownerNameUpperCase.includes('TRADER');
          case 'RETAILER':
            return ownerIdUpperCase.includes('RET') || ownerNameUpperCase.includes('RETAILER');
          default:
            return true;
        }
      });
    }
      
    if (isReset) {
      setProducts(filteredProducts);
    } else {
      setProducts(prev => [...prev, ...filteredProducts]);
    }
    
    // Check if there are more products to load
    if (response?.page && response?.totalPages) {
      const hasMorePages = pageNum < response.totalPages;
      setHasMore(hasMorePages);
    } else if (response?.data?.pagination?.totalPages) {
      const hasMorePages = pageNum < response.data.pagination.totalPages;
      setHasMore(hasMorePages);
    } else {
      // If no pagination data or it's the last page
      setHasMore(hasMoreCheck(newProducts));
    }
  };
  
  // Handle filter change
  const handleFilterChange = (filter: string | null) => {
    setActiveFilter(filter);
    // Force an immediate reset and fetch with the new filter
    resetAndFetchProducts();
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setActiveFilter(null);
    // Also clear the input field value
    const searchInput = document.getElementById('product-search') as HTMLInputElement;
    if (searchInput) searchInput.value = '';
  };

  // Update the getDisplayStatus function to provide more context
  const getDisplayStatus = (product: Product) => {
    // Determine the role for context
    let roleContext = '';
    
    // Check both ownerName and ownerId for role indicators
    if (product.ownerName) {
      if (product.ownerName.toUpperCase().includes('COLLECTOR')) {
        roleContext = ' AT COLLECTOR';
      } else if (product.ownerName.toUpperCase().includes('RETAILER')) {
        roleContext = ' AT RETAILER';
      } else if (product.ownerName.toUpperCase().includes('TRADER')) {
        roleContext = ' AT TRADER';
      } else if (product.ownerName.toUpperCase().includes('FARMER')) {
        roleContext = ' AT FARMER';
      }
    }
    
    // If role not found in ownerName, check ownerId
    if (!roleContext && product.ownerId) {
      if (product.ownerId.includes('COLL-')) {
        roleContext = ' AT COLLECTOR';
      } else if (product.ownerId.includes('RET-')) {
        roleContext = ' AT RETAILER';
      } else if (product.ownerId.includes('TRAD-')) {
        roleContext = ' AT TRADER';
      } else if (product.ownerId.includes('FARM-')) {
        roleContext = ' AT FARMER';
      }
    }
    
    // If still no role context, check if metadata has hints
    if (!roleContext && product.metadata) {
      if (product.metadata.recipientRole) {
        roleContext = ` AT ${product.metadata.recipientRole.toUpperCase()}`;
      }
    }

    // Only show RECEIVED when the product is with a retailer
    if (product.status?.toUpperCase() === ProductStatus.TRANSFERRED && 
        (product.ownerName?.toUpperCase().includes('RETAILER') || 
         product.ownerId?.includes('RET-') || 
         product.metadata?.recipientRole?.toUpperCase() === 'RETAILER')) {
      return DisplayStatus.RECEIVED + roleContext;
    }
    
    // For other cases, normalize to one of our supported statuses
    switch(product.status?.toUpperCase()) {
      case ProductStatus.CREATED:
        return DisplayStatus.CREATED + roleContext;
      case ProductStatus.TRANSFERRED:
        return DisplayStatus.TRANSFERRED + roleContext;
      case ProductStatus.VERIFIED:
        return DisplayStatus.VERIFIED + roleContext;
      default:
        return (product.status || 'UNKNOWN') + roleContext;
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Web3Background />
      <header>
        <div className="max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-6 mt-10">
          <h1 className="text-5xl font-orbitron text-[#a259ff] drop-shadow-[0_0_30px_#00ffcc] animate-glow font-extrabold" style={{ border: 'none', background: 'transparent', boxShadow: 'none', textShadow: '0 0 20px rgba(0, 255, 204, 0.6), 0 0 40px rgba(162, 89, 255, 0.4)' }}>Products</h1>
          <div className="flex space-x-4">
            {session && (
              <>
                <Link href="/products/new">
                  <Button variant="primary" className="bg-[#a259ff] text-white hover:bg-[#00ffcc] hover:text-[#18122B] font-orbitron shadow-[0_0_10px_#a259ff55] transition-all duration-300 text-lg px-6 py-3">Add New Product</Button>
                </Link>
                <Link href="/products/transfer">
                  <Button variant="outline" className="border-[#00ffcc] text-[#00ffcc] hover:bg-[#00ffcc22] hover:text-white font-orbitron text-lg px-6 py-3">Transfer Products</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main>
        <div className="max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-12 mt-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
            {/* Search Bar with neon gradient border */}
            <div className="bg-gradient-to-r from-[#00ffcc] to-[#a259ff] p-[2px] rounded-xl relative">
              <Input
                id="product-search"
                placeholder="Search products..."
                onChange={handleSearchInputChange}
                value={searchQuery}
                className="font-space bg-[#18122B] text-[#a259ff] placeholder:text-[#a259ff] focus:outline-none rounded-xl px-6 py-3 w-full md:w-96 text-lg border-none shadow-none pr-12"
                style={{ boxShadow: 'none' }}
              />
              {searchQuery && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    resetAndFetchProducts();
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#a259ff] hover:text-[#00ffcc] transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="flex gap-3 flex-wrap">
              {filterOptions.map((opt, index) => (
                <button
                  key={`filter-${opt.value ?? 'all'}-${index}`}
                  onClick={() => handleFilterChange(opt.value)}
                  className={clsx(
                    'px-5 py-2 rounded-xl font-space text-sm font-bold border transition-all duration-300',
                    // Custom styling for each role filter
                    activeFilter === 'FARMER' && opt.value === 'FARMER' ? 'bg-green-600 text-white border-green-500 shadow-[0_0_10px_#22c55e77]' :
                    activeFilter === 'COLLECTOR' && opt.value === 'COLLECTOR' ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_10px_#3b82f677]' :
                    activeFilter === 'TRADER' && opt.value === 'TRADER' ? 'bg-amber-600 text-white border-amber-500 shadow-[0_0_10px_#f59e0b77]' :
                    activeFilter === 'RETAILER' && opt.value === 'RETAILER' ? 'bg-purple-600 text-white border-purple-500 shadow-[0_0_10px_#9333ea77]' :
                    !opt.value && !activeFilter ? 'bg-[#00ffcc] text-[#18122B] border-[#00ffcc] shadow-[0_0_10px_#00ffcc77] animate-glow' :
                    'bg-[#232526] text-[#a259ff] border-[#a259ff] hover:bg-[#a259ff] hover:text-white hover:shadow-[0_0_10px_#a259ff77]'
                  )}
                >
                  {opt.label}
                </button>
              ))}
              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-xl font-space text-sm font-bold border border-[#a259ff] text-[#a259ff] bg-[#232526] hover:bg-[#a259ff] hover:text-white transition-all duration-300"
              >
                Clear
              </button>
            </div>
          </div>
          {/* Product List with max height and scroll */}
          <div className="max-h-[calc(100vh-250px)] overflow-y-auto pr-4 custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 mt-8">
              {isLoading ? (
                <div className="col-span-full flex justify-center items-center h-40">
                  <Loader2 className="h-12 w-12 text-[#00ffcc] animate-spin" />
                </div>
              ) : error ? (
                <div className="col-span-full text-center text-red-400 font-space animate-fadeIn text-lg">{error}</div>
              ) : products.length === 0 ? (
                <div className="col-span-full text-center text-[#a259ff] font-space animate-fadeIn text-lg">No products found.</div>
              ) : (
                products.map((product, idx) => (
                                      <div
                      key={`product-${product.id}-${idx}`}
                      ref={idx === products.length - 1 ? lastProductElementRef : undefined}
                      className={clsx(
                        'relative rounded-2xl p-6 bg-gradient-to-br from-[#232526cc] to-[#18122Bcc] border-2 shadow-[0_0_30px_#00ffcc33] animate-fadeIn transition-all duration-500',
                        idx % 2 === 0 ? 'border-[#a259ff]' : 'border-[#00ffcc]',
                        'hover:scale-105 hover:shadow-[0_0_60px_#00ffcc77] cursor-pointer group'
                      )}
                    >
                      {/* Status badge in top-right - make it more visible */}
                      <span className={clsx(
                        'absolute right-6 top-3 px-4 py-1.5 rounded-xl font-space text-sm font-bold border shadow-lg transition-all duration-300',
                        'glow-status',
                        getDisplayStatus(product).includes(DisplayStatus.CREATED) && 'bg-blue-500/30 text-blue-300 border-blue-400 animate-pulse',
                        getDisplayStatus(product).includes(DisplayStatus.TRANSFERRED) && 'bg-purple-500/30 text-purple-300 border-purple-400 animate-pulse',
                        getDisplayStatus(product).includes(DisplayStatus.VERIFIED) && 'bg-green-500/30 text-green-300 border-green-400 animate-pulse',
                        getDisplayStatus(product).includes(DisplayStatus.RECEIVED) && 'bg-teal-500/30 text-teal-300 border-teal-400 animate-pulse',
                      )}>
                        {getDisplayStatus(product)}
                      </span>
                    
                    {/* Main content */}
                    <div className="mt-6">
                      <h2 className="text-2xl font-orbitron text-[#a259ff] mb-3 group-hover:text-[#00ffcc] transition-colors duration-300">
                        {product.name}
                      </h2>
                      
                      <div className="grid grid-cols-1 gap-2 mb-3">
                        <p className="text-base font-space text-gray-300">
                          <span className="text-gray-400 text-sm">Owner:</span> 
                          <span className="text-[#00ffcc] font-fira ml-1">{product.ownerName || "Unknown"}</span>
                        </p>
                        
                        <p className="text-base font-space text-gray-300">
                          <span className="text-gray-400 text-sm">Owner ID:</span> 
                          <span className="text-[#00ffcc] font-fira ml-1">{product.ownerId || "N/A"}</span>
                        </p>
                        
                        <p className="text-base font-space text-gray-300">
                          <span className="text-gray-400 text-sm">Quality:</span> 
                          <span className="text-[#00ffcc] font-fira ml-1">
                            {product.metadata?.qualityScore ? `${product.metadata.qualityScore}/100` : 'N/A'}
                          </span>
                        </p>
                        
                        <p className="text-base font-space text-gray-300">
                          <span className="text-gray-400 text-sm">Location:</span> 
                          <span className="text-[#00ffcc] font-fira ml-1">
                            {product.metadata?.location || 'Unknown'}
                          </span>
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4">
                        <span className="font-space text-xl text-[#00ffcc] font-bold">{formatRupiah(product.price)}</span>
                        <Link href={`/products/${product.id}`} className="font-orbitron text-sm text-[#a259ff] hover:text-[#00ffcc] underline underline-offset-4 transition-colors duration-300">View Details</Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Infinite Scroll Loader */}
            {loadingMore && (
              <div className="flex justify-center items-center mt-8">
                <Loader2 className="h-8 w-8 text-[#00ffcc] animate-spin" />
              </div>
            )}
            {/* End of list message */}
            {!hasMore && products.length > 0 && (
              <div className="text-center py-6 text-base text-[#a259ff] font-space animate-fadeIn">
                {page >= maxPages ? 'You\'ve reached the maximum number of pages' : 'You\'ve reached the end of the list'}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Add custom scrollbar styles to your global CSS
// .custom-scrollbar::-webkit-scrollbar {
//   width: 8px;
// }
// .custom-scrollbar::-webkit-scrollbar-track {
//   background: #18122B;
//   border-radius: 4px;
// }
// .custom-scrollbar::-webkit-scrollbar-thumb {
//   background: #a259ff;
//   border-radius: 4px;
// }
// .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//   background: #00ffcc;
// }

// Add this to your global CSS for the glow effect:
// .glow-status {
//   box-shadow: 0 0 16px 2px #00ffcc99, 0 0 32px 4px #a259ff55;
// }
