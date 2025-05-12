'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { productAPI, userAPI } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRole, TransactionActionType, ActionReason, Product } from '@/lib/types';
import { formatRupiah } from '@/lib/utils';
import Image from 'next/image';
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
  ClockIcon
} from '@heroicons/react/24/outline';

function Web3Background() {
  const [particles, setParticles] = useState<Array<{
    left: string;
    top: string;
    width: string;
    height: string;
  }>>([]);
  
  // Generate particles only on client-side to avoid hydration mismatch
  useEffect(() => {
    const generatedParticles = Array.from({ length: 30 }, (_, i) => ({
      left: `${(i * 37) % 100}%`,
      top: `${(i * 53) % 100}%`,
      width: `${(i % 8) + 6}px`,
      height: `${(i % 8) + 6}px`
    }));
    setParticles(generatedParticles);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#18122B] via-[#232526] to-[#0f2027] animate-gradient-move">
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((pos, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20 animate-float"
            style={{
              left: pos.left,
              top: pos.top,
              width: pos.width,
              height: pos.height,
              background: 'linear-gradient(135deg, #a259ff, #00ffcc, #00bfff)'
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Client-side date display component to avoid hydration issues
function DateDisplay() {
  const [dateString, setDateString] = useState<string>('');
  
  useEffect(() => {
    setDateString(new Date().toLocaleDateString());
  }, []);
  
  return <>{dateString}</>;
}

const ProductTransfer = () => {
  const router = useRouter();
  const { toast } = useToast();
  
  // Step tracking
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [transferComplete, setTransferComplete] = useState(false);
  
  // Form data
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [receivers, setReceivers] = useState<any[]>([]);
  const [selectedReceiver, setSelectedReceiver] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [actionType, setActionType] = useState<string>(TransactionActionType.TRANSFER);
  const [actionReason, setActionReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // Animation controls
  const [isPreviewHovered, setIsPreviewHovered] = useState(false);
  
  // Product loading state
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingReceivers, setLoadingReceivers] = useState(true);

  // Load products owned by the current user
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        
        // First get current user id
        const currentUserResponse = await userAPI.getCurrentUser();
        const currentUserId = currentUserResponse?.data?.data?.id;

        if (!currentUserId) {
          console.error('User ID not found in session');
          toast({
            title: 'Authentication Error',
            description: 'Please login again to access your products.',
            variant: 'destructive',
          });
          setProducts([]);
          setLoadingProducts(false);
          return;
        }

        // Fetch products owned by the current user
        console.log(`Fetching products owned by user ID: ${currentUserId}`);
        const response = await productAPI.getProductsByOwner(currentUserId);
        
        if (response.data && response.data.success) {
          // Check different possible response structures
          if (Array.isArray(response.data.data)) {
            setProducts(response.data.data);
          } else if (response.data.data && Array.isArray(response.data.data.products)) {
            setProducts(response.data.data.products);
          } else if (response.data.data && response.data.data.data && Array.isArray(response.data.data.data)) {
            setProducts(response.data.data.data);
          } else {
            console.error('Unexpected response structure:', response.data);
            setProducts([]);
          }
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
        toast({
          title: 'Error',
          description: 'Failed to load your products. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [toast]);

  // Sisanya sama dengan file asli...
  
  // Contoh partial implementation 
  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product || null);
  };

  const handleReceiverSelect = (receiverId: string) => {
    setSelectedReceiver(receiverId);
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleTransfer = async () => {
    if (!selectedProduct || !selectedReceiver) return;
    
    setLoading(true);
    
    try {
      const transferData = {
        productId: selectedProduct.id,
        toUserId: selectedReceiver,
        quantity: quantity,
        actionType: actionType,
        actionReason: actionReason || undefined,
        metadata: notes ? { notes } : undefined
      };
      
      const response = await productAPI.transferProduct(transferData);
      
      if (response.data && response.data.success) {
        setTransferComplete(true);
        toast({
          title: 'Transfer Successful',
          description: 'The product has been transferred successfully.',
          variant: 'default',
        });
        
        // Move to confirmation step
        setCurrentStep(4);
      } else {
        throw new Error(response.data?.message || 'Transfer failed');
      }
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast({
        title: 'Transfer Failed',
        description: error.message || 'Failed to transfer the product. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Note: Untuk menyelesaikan implementasi ini, salin semua kode yang masih diperlukan
  // dari file page.tsx asli. Saya hanya menunjukkan bagian yang diubah di sini.

  return (
    <ProtectedRoute>
      <div>Implementasi UI dari halaman transfer product</div>
    </ProtectedRoute>
  );
};

export default ProductTransfer; 