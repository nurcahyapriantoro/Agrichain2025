'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useUser } from '@/contexts/user/UserContext';
import { getProductsByOwner } from '@/lib/api/products';
import { Product, ProductStatus } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowUpRight, Info } from 'lucide-react';
import Link from 'next/link';
import { UserRole } from '@/types/user';
import TransferProductModal from './TransferProductModal';
import { formatRupiah } from '@/lib/utils';

// Define allowed transfer flows based on user roles
const TRANSFER_FLOW = {
  [UserRole.FARMER]: [UserRole.COLLECTOR],
  [UserRole.COLLECTOR]: [UserRole.TRADER],
  [UserRole.TRADER]: [UserRole.RETAILER],
  [UserRole.RETAILER]: [],
  [UserRole.CONSUMER]: [],
};

// Utility function to get status badge styling
const getStatusBadgeClass = (status: string | undefined) => {
  if (!status) {
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
  
  switch (status.toUpperCase()) {
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

// Web3 background animation component
function Web3Background() {
  const [particles, setParticles] = useState<Array<{
    left: string;
    top: string;
    width: string;
    height: string;
    animationDelay: string;
    animationDuration: string;
  }>>([]);

  // Generate particles only on client-side to avoid hydration mismatch
  useEffect(() => {
    const newParticles = Array(30).fill(0).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      width: `${Math.random() * 8 + 4}px`,
      height: `${Math.random() * 8 + 4}px`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${Math.random() * 10 + 10}s`
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#18122B] via-[#232526] to-[#0f2027] animate-gradient-move overflow-hidden">
      {/* Animated particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle, i) => (
          <div
            key={`particle-${i}`}
            className="absolute rounded-full opacity-20 animate-float"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.width,
              height: particle.height,
              background: `linear-gradient(135deg, #a259ff, #00ffcc, #00bfff)`,
              animationDelay: particle.animationDelay,
              animationDuration: particle.animationDuration
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function MyProductsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { userData } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  
  // Add wallet auth state
  const [walletAuth, setWalletAuth] = useState<{
    token: string | null;
    userData: any;
    isAuthenticated: boolean;
  }>({
    token: null,
    userData: null,
    isAuthenticated: false
  });

  // Check for wallet authentication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for wallet authentication
      const walletToken = localStorage.getItem('walletAuthToken') || localStorage.getItem('web3AuthToken');
      const walletUserDataString = localStorage.getItem('walletUserData');
      
      if (walletToken && walletUserDataString) {
        try {
          const userData = JSON.parse(walletUserDataString);
          setWalletAuth({
            token: walletToken,
            userData: userData,
            isAuthenticated: true
          });
          console.log('MyProducts: Wallet auth detected', userData);
        } catch (error) {
          console.error('MyProducts: Error parsing wallet user data:', error);
        }
      }
    }
  }, []);

  // Combined authentication check
  const isAuthenticated = !!session?.user || walletAuth.isAuthenticated;
  const userId = session?.user?.id || walletAuth.userData?.id;
  const userRole = userData?.role || session?.user?.role as UserRole || walletAuth.userData?.role;

  // Effect to fetch user's products
  useEffect(() => {
    const fetchUserProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if user is authenticated with either method
        if (userId) {
          console.log('Fetching products for user ID:', userId);
          // User is authenticated, fetch their products
          const response = await getProductsByOwner(userId);
          
          console.log('API response:', response); // Debug the response
          
          // Check if the response has products in different formats
          if (response?.products && Array.isArray(response.products)) {
            console.log('Setting products from response.products:', response.products);
            setProducts(response.products);
          } else if (response?.data?.products && Array.isArray(response.data.products)) {
            console.log('Setting products from response.data.products:', response.data.products);
            setProducts(response.data.products);
          } else {
            console.log('No products found in response:', response);
            setProducts([]);
          }
        } else {
          console.log('No user ID found in session or wallet auth');
          setProducts([]);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load your products. Please try again.');
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchUserProducts();
    } else {
      setIsLoading(false);
    }
  }, [userId, isAuthenticated]);

  // Function to open transfer modal for a product
  const handleTransferClick = (product: Product) => {
    setSelectedProduct(product);
    setIsTransferModalOpen(true);
  };

  // Function to close the transfer modal
  const handleCloseTransferModal = () => {
    setSelectedProduct(null);
    setIsTransferModalOpen(false);
  };

  // Function to handle successful transfer
  const handleTransferSuccess = () => {
    // Refresh products after successful transfer
    if (userId) {
      // Show loading state while refreshing
      setIsLoading(true);
      
      getProductsByOwner(userId)
        .then(response => {
          if (response?.products && Array.isArray(response.products)) {
            setProducts(response.products);
          } else if (response?.data?.products && Array.isArray(response.data.products)) {
            setProducts(response.data.products);
          }
        })
        .catch(err => {
          console.error('Error refreshing products:', err);
        })
        .finally(() => {
          setIsLoading(false);
          // Close the modal after refreshing
          handleCloseTransferModal();
        });
    } else {
      // Just close the modal if there's no user ID
      handleCloseTransferModal();
    }
  };

  // Simplify the canTransfer check to explicitly include these roles
  const canTransfer = userRole && (userRole === UserRole.FARMER || userRole === UserRole.COLLECTOR || userRole === UserRole.TRADER);

  return (
    <div className="min-h-screen pb-20">
      <Web3Background />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <header className="mb-10">
          <h1 className="text-4xl font-bold font-orbitron bg-gradient-to-r from-[#a259ff] via-[#00ffcc] to-[#00bfff] bg-clip-text text-transparent drop-shadow-[0_0_20px_#00ffcc] animate-glow">
            My Products
          </h1>
          <p className="text-gray-300 mt-2 font-space">
            Manage and transfer your products in the supply chain
          </p>
        </header>

        {error && (
          <div className="bg-red-900/30 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {!isAuthenticated && !isLoading ? (
          // User is not authenticated
          <div className="bg-slate-800/40 rounded-xl p-10 text-center">
            <h3 className="text-xl text-gray-300 font-space mb-6">Please sign in to view your products</h3>
            <Link href="/login">
              <Button className="bg-gradient-to-r from-[#a259ff] to-[#00ffcc] hover:opacity-90 text-black font-bold">
                Sign In
              </Button>
            </Link>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-10 w-10 text-[#a259ff] animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="bg-slate-800/40 rounded-xl p-10 text-center">
            <h3 className="text-xl text-gray-300 font-space mb-6">You don't have any products yet</h3>
            {userRole === UserRole.FARMER && (
              <Link href="/products/new">
                <Button className="bg-gradient-to-r from-[#a259ff] to-[#00ffcc] hover:opacity-90 text-black font-bold">
                  Create New Product
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <div 
                key={product.id} 
                className="bg-gradient-to-br from-[#232526cc] to-[#18122Bcc] border border-[#a259ff40] hover:border-[#a259ff] rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-[1.02] hover:shadow-[0_0_30px_#a259ff33] group"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-white truncate font-orbitron group-hover:text-[#a259ff] transition-colors">
                      {product.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(product.status)}`}>
                      {product.status}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-400 text-sm mb-1">ID: {product.id}</p>
                    <p className="text-gray-400 text-sm mb-1 truncate">Description: {product.description || 'No description'}</p>
                    <p className="text-gray-300 font-semibold mb-1">
                      Quantity: {product.quantity} {product.unit || 'units'}
                    </p>
                    <p className="text-[#00ffcc] font-bold">
                      Price: {formatRupiah(product.price)}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center mt-6">
                    <Link href={`/products/${product.id}`}>
                      <Button variant="outline" className="border-[#a259ff] text-[#a259ff] hover:bg-[#a259ff20]">
                        <Info className="mr-2 h-4 w-4" />
                        Details
                      </Button>
                    </Link>
                    
                    {canTransfer && (
                      <Button
                        onClick={() => handleTransferClick(product)}
                        className="bg-gradient-to-r from-[#a259ff] to-[#00ffcc] text-black font-bold hover:opacity-90"
                      >
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Transfer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {isTransferModalOpen && selectedProduct && (
        <TransferProductModal
          product={selectedProduct}
          onClose={handleCloseTransferModal}
          onSuccess={handleTransferSuccess}
          userRole={userRole as UserRole}
        />
      )}
    </div>
  );
} 