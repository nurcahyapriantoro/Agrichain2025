'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/lib/types';
import { userAPI } from '@/lib/api';

export default function SelectRolePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    if (status === 'loading') {
      return;
    }
    
    // If user is not authenticated, redirect to login
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    // If user already has a role, redirect to dashboard
    if (session?.user?.role) {
      const userRole = session.user.role as string; // Cast to string to safely check
      if (userRole !== 'unknown' && 
          userRole !== 'UNKNOWN' && 
          userRole !== '') {
        console.log('User already has role:', session.user.role);
        router.push('/');
      }
    }
  }, [session, router, status]);

  // Role cards dan deskripsi untuk tiap role
  const roleCards = [
    {
      role: UserRole.FARMER,
      title: 'Petani',
      description: 'Anda adalah produsen utama yang menanam dan menghasilkan produk pertanian.',
      icon: '🌾'
    },
    {
      role: UserRole.COLLECTOR,
      title: 'Pengumpul',
      description: 'Anda mengumpulkan produk dari petani dan menjualnya kepada pedagang atau pengecer.',
      icon: '🚚'
    },
    {
      role: UserRole.TRADER,
      title: 'Pedagang',
      description: 'Anda membeli produk dalam jumlah besar dan menjualnya ke pengecer atau konsumen.',
      icon: '💼'
    },
    {
      role: UserRole.RETAILER,
      title: 'Pengecer',
      description: 'Anda menjual produk langsung ke konsumen akhir melalui toko atau outlet.',
      icon: '🏪'
    },
    {
      role: UserRole.CONSUMER,
      title: 'Konsumen',
      description: 'Anda adalah pembeli akhir yang menggunakan produk pertanian.',
      icon: '👨‍👩‍👧‍👦'
    }
  ];

  const handleRoleSelect = async () => {
    if (!selectedRole) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Gunakan userAPI untuk update role
      const response = await userAPI.updateUserRole(selectedRole);

      if (response.data && response.data.success) {
        // Update session dengan role baru
        await update({
          ...session,
          user: {
            ...session?.user,
            role: selectedRole
          }
        });
        
        // Redirect ke dashboard
        router.push('/dashboard');
      } else {
        setError('Gagal menyimpan role. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      setError('Terjadi kesalahan. Silakan coba lagi nanti.');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-green-600 motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Pilih Peran Anda</h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Selamat datang di AgriChain! Silakan pilih peran Anda dalam rantai pasok pertanian untuk melanjutkan.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 mb-8 max-w-md mx-auto">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roleCards.map((card) => (
          <div 
            key={card.role}
            className={`border rounded-lg p-6 cursor-pointer transition-all ${
              selectedRole === card.role 
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md' 
                : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700'
            }`}
            onClick={() => setSelectedRole(card.role)}
          >
            <div className="text-4xl mb-4">{card.icon}</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{card.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">{card.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Button 
          variant="primary" 
          size="lg" 
          disabled={!selectedRole || isLoading} 
          onClick={handleRoleSelect}
          className="min-w-[200px]"
        >
          {isLoading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mr-2"></span>
              Memproses...
            </>
          ) : 'Lanjutkan'}
        </Button>
      </div>
    </div>
  );
} 