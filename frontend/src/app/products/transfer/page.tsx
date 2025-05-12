'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { productAPI, userAPI } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from '@/components/ui/card';
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { UserRole, TransactionActionType, ActionReason, Product, User } from '@/types';
import { formatRupiah } from '@/lib/utils';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { 
  ArrowPathIcon, 
  ArrowRightIcon, 
  CheckCircleIcon, 
  ChevronRightIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  UserGroupIcon,
  CubeTransparentIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { getCachedSession } from '@/lib/api/client';

// At the top of the file, add this function for session storage caching
const cachedRequest = async <T,>(
  cacheKey: string,
  requestFn: () => Promise<T>,
  expiryMinutes = 5
): Promise<T> => {
  // Only use cache in browser environment
  if (typeof window === 'undefined') {
    return singletonFetch(`no-cache-${cacheKey}`, requestFn);
  }
  
  try {
    // Check if we have a cached version
    const cacheString = sessionStorage.getItem(cacheKey);
    
    if (cacheString) {
      const cache = JSON.parse(cacheString);
      
      // Check if cache is still valid
      const now = new Date().getTime();
      if (cache.expiry > now) {
        console.log(`Using cached data for ${cacheKey}`);
        return cache.data as T;
      } else {
        console.log(`Cache expired for ${cacheKey}, fetching fresh data`);
        sessionStorage.removeItem(cacheKey);
      }
    }
    
    // If no valid cache exists, make the request (using singleton fetch to prevent duplicates)
    const data = await singletonFetch(cacheKey, requestFn);
    
    // Save to cache with expiry
    const cacheObject = {
      data,
      expiry: new Date().getTime() + (expiryMinutes * 60 * 1000)
    };
    
    sessionStorage.setItem(cacheKey, JSON.stringify(cacheObject));
    return data;
  } catch (error) {
    console.error(`Error in cachedRequest for ${cacheKey}:`, error);
    // Try to return expired cache data as fallback in case of errors
    try {
      const cacheString = sessionStorage.getItem(cacheKey);
      if (cacheString) {
        const cache = JSON.parse(cacheString);
        console.log(`Using expired cache as fallback for ${cacheKey}`);
        return cache.data as T;
      }
    } catch (e) {
      console.error('Could not use expired cache as fallback:', e);
    }
    
    // If all else fails, re-throw the original error
    throw error;
  }
};

// Add a singleton request mechanism to prevent duplicate API calls
const pendingRequests = new Map<string, Promise<any>>();

const singletonFetch = <T,>(key: string, requestFn: () => Promise<T>): Promise<T> => {
  // If there's already a request in progress for this key, return it
  if (pendingRequests.has(key)) {
    console.log(`Using existing in-flight request for ${key}`);
    return pendingRequests.get(key) as Promise<T>;
  }
  
  // Otherwise, create a new request
  console.log(`Creating new request for ${key}`);
  const request = requestFn().finally(() => {
    // Remove the request from pendingRequests when it completes (whether success or failure)
    pendingRequests.delete(key);
  });
  
  // Store the request
  pendingRequests.set(key, request);
  
  return request;
};

// Client-side only content wrapper
const ClientOnly = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#18122B] via-[#232526] to-[#0f2027]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-white">Loading transfer page...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

// Simple date display component
function DateDisplay() {
  const [dateString, setDateString] = useState('-');
  
  useEffect(() => {
    setDateString(new Date().toLocaleDateString());
  }, []);
  
  return <>{dateString}</>;
}

// Main page component
export default function ProductTransferPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Get the current user and their products
  useEffect(() => {
    const fetchUserAndProducts = async () => {
      try {
        setLoading(true);
        
        // Get current user from session
        const session = await getCachedSession();
        const user = session?.user;
        setCurrentUser(user as User || null);
        
        if (user?.id) {
          // Get products owned by this user
          const response = await productAPI.getProductsByOwner(user.id);
          
          if (response && response.products) {
            // Filter to only include products with quantity > 0
            const availableProducts = response.products.filter(
              product => product.quantity && product.quantity > 0
            );
            setProducts(availableProducts);
          } else {
            setProducts([]);
          }
        }
      } catch (error) {
        console.error("Error fetching user products:", error);
        toast({
          title: "Error",
          description: "Failed to load your products. Please try again later.",
          variant: "destructive"
        });
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndProducts();
  }, [toast]);

  // Filter products based on search query
  const filteredProducts = searchQuery 
    ? products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  return (
    <ProtectedRoute>
      <div className="py-8 px-4 max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/products')}
                className="flex items-center"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Products
              </Button>
            </div>
            <CardTitle className="text-3xl">Transfer Products</CardTitle>
            <CardDescription>
              Select a product to transfer to another user in the supply chain
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="mb-6">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by product name or ID..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your products...</p>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 text-center">
                <h3 className="text-lg font-medium mb-2">No Products Available for Transfer</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchQuery 
                    ? "No products match your search criteria." 
                    : "You don't have any products that can be transferred."}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/products/new')}
                >
                  Create New Product
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <Link 
                      key={product.id} 
                      href={`/products/${product.id}/transfer`}
                      className="block"
                    >
                      <div 
                        className="border rounded-lg p-4 hover:border-primary hover:shadow-md transition-all duration-200 h-full flex flex-col"
                      >
                        <div className="flex-grow">
                          <h3 className="font-medium text-lg mb-2">{product.name}</h3>
                          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                            <span>ID: {product.id.substring(0, 8)}...</span>
                            <span>Qty: {product.quantity} {product.unit || 'units'}</span>
                          </div>
                          <p className="text-sm line-clamp-2 mb-4">
                            {product.description || 'No description provided'}
                          </p>
                        </div>
                        <div className="flex justify-end items-center text-sm mt-2 text-blue-600 dark:text-blue-400">
                          Transfer
                          <ArrowRightIcon className="ml-1 h-4 w-4" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
} 