'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserRole } from '@/lib/types';
import { cn } from '@/lib/utils';
import { signOut, useSession } from 'next-auth/react';
import { Menu, X, LogOut, User, Home, Package, FileText, BarChart2, Layers, BookOpen, Users, ShoppingBag } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: UserRole[];
  authRequired?: boolean;
}

const navigationItems: NavItem[] = [
  {
    label: 'Home',
    href: '/',
    icon: <Home className="w-5 h-5" />,
    authRequired: false,
  },  
  {
    label: 'Products',
    href: '/products',
    icon: <Package className="w-5 h-5" />,
    authRequired: true,
  },
  {
    label: 'My Products',
    href: '/my-products',
    icon: <ShoppingBag className="w-5 h-5" />,
    authRequired: true,
  },
  {
    label: 'Blockchain',
    href: '/blockchain',
    icon: <BarChart2 className="w-5 h-5" />,
    authRequired: true,
  },  
  {
    label: 'Learning Hub',
    href: '/learn',
    icon: <BookOpen className="w-5 h-5" />,
    authRequired: false,
  },
  {
    label: 'Roles',
    href: '/roles',
    icon: <Users className="w-5 h-5" />,
    authRequired: false,
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: <User className="w-5 h-5" />,
    authRequired: true,
  },
];

// Component for the animated particles background
function ParticlesBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {Array.from({ length: 15 }).map((_, i) => (
        <div 
          key={i}
          className="absolute rounded-full mix-blend-screen animate-float opacity-20"
          style={{
            background: i % 2 === 0 ? 
              'radial-gradient(circle, #00ffcc 0%, rgba(0,255,204,0) 70%)' : 
              'radial-gradient(circle, #a259ff 0%, rgba(162,89,255,0) 70%)',
            width: `${Math.random() * 10 + 5}px`,
            height: `${Math.random() * 10 + 5}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${Math.random() * 10 + 10}s`
          }}
        />
      ))}
    </div>
  );
}

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  
  // Tambahkan state untuk autentikasi wallet
  const [walletAuth, setWalletAuth] = useState<{
    token: string | null;
    userData: any;
    isAuthenticated: boolean;
  }>({
    token: null,
    userData: null,
    isAuthenticated: false
  });

  useEffect(() => {
    setIsMounted(true);
    
    // Periksa autentikasi wallet saat komponen mount
    if (typeof window !== 'undefined') {
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
          console.log('Navigation: Wallet auth detected', userData);
        } catch (error) {
          console.error('Navigation: Error parsing wallet user data:', error);
        }
      }
    }
  }, []);

  if (!isMounted) {
    return null;
  }

  // Gunakan session ATAU walletAuth untuk menentukan status login
  const isAuthenticated = !!session || walletAuth.isAuthenticated;
  
  // Dapatkan userRole dari keduanya
  const sessionUserRole = session?.user?.role as UserRole | undefined;
  const walletUserRole = walletAuth.userData?.role as UserRole | undefined;
  const userRole = sessionUserRole || walletUserRole;
  
  // Dapatkan userName dari keduanya
  const userName = session?.user?.name || walletAuth.userData?.name || 'Profile';

  // Check if we're on auth pages (login or register)
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname.startsWith('/register/');

  // For auth pages, only show the Home menu item
  // For other pages, filter by role and auth status as before
  const filteredNavItems = isAuthPage 
    ? navigationItems.filter(item => item.label === 'Home')
    : navigationItems.filter(
        (item) => (!item.roles || !userRole || item.roles.includes(userRole)) && 
        (!item.authRequired || (item.authRequired && isAuthenticated))
      );

  const handleSignOut = async () => {
    // Clear wallet authentication data from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('walletAuthToken');
      localStorage.removeItem('web3AuthToken');
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('walletUserData');
      sessionStorage.removeItem('session');
      
      // Reset wallet auth state
      setWalletAuth({
        token: null,
        userData: null,
        isAuthenticated: false
      });
    }

    try {
      // Use NextAuth signOut with redirect false to prevent automatic redirect
      await signOut({ redirect: false });
      
      // Manually redirect to homepage
      router.push('/');
    } catch (error) {
      console.error('Error during sign out:', error);
      // Fallback: redirect to homepage even if there's an error
      router.push('/');
    }
  };

  return (
    <nav className="relative bg-gradient-to-r from-[#18122B] to-[#0f1722] border-b border-[#a259ff]/30 backdrop-blur-lg shadow-[0_2px_20px_rgba(162,89,255,0.2)]">
      <ParticlesBackground />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center group">
              <div className="relative">
                <Layers className="h-8 w-8 text-[#00ffcc] group-hover:text-[#a259ff] transition-colors duration-300" />
                <div className="absolute inset-0 bg-[#00ffcc] rounded-full filter blur-md opacity-30 group-hover:opacity-60 group-hover:bg-[#a259ff] transition-all duration-300 scale-75 group-hover:scale-100"></div>
              </div>
              <span className="ml-2 text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00ffcc] to-[#a259ff] group-hover:from-[#a259ff] group-hover:to-[#00ffcc] transition-all duration-500">AgriChain</span>
            </Link>
            
            <div className="hidden md:ml-10 md:flex md:space-x-1">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center overflow-hidden group',
                    pathname === item.href
                      ? 'text-white' 
                      : 'text-gray-300 hover:text-white'
                  )}
                >
                  {/* Background effect */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300",
                    pathname === item.href ? "bg-gradient-to-r from-[#00ffcc] to-[#a259ff] opacity-20" : "bg-white"
                  )}></div>
                  
                  {/* Border animation */}
                  {pathname === item.href && (
                    <>
                      <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-[#00ffcc] to-[#a259ff]"></div>
                      <div className="absolute inset-0 border border-[#a259ff]/40 rounded-lg"></div>
                    </>
                  )}
                  
                  <div className={cn(
                    "relative z-10 flex items-center",
                    pathname === item.href
                      ? "text-white" 
                      : "text-gray-300 group-hover:text-white"
                  )}>
                    <div className="relative">
                      <div className={cn(
                        "absolute inset-0 rounded-full blur-sm opacity-0 group-hover:opacity-30 transition-opacity duration-300",
                        pathname === item.href ? "bg-[#00ffcc] opacity-30" : "bg-white" 
                      )}></div>
                      <div className={pathname === item.href 
                        ? "text-[#00ffcc] group-hover:text-[#a259ff] transition-colors duration-300" 
                        : "text-gray-400 group-hover:text-white transition-colors duration-300"
                      }>
                        {item.icon}
                      </div>
                    </div>
                    <span className="ml-2">{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Link
                  href="/profile"
                  className="relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[#a259ff]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                  <div className="relative z-10 flex items-center text-[#a259ff] group-hover:text-white transition-colors duration-300">
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#a259ff] rounded-full blur-sm opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                      <User className="w-5 h-5" />
                    </div>
                    <span className="ml-2">{userName}</span>
                  </div>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                  <div className="relative z-10 flex items-center text-red-400 group-hover:text-white transition-colors duration-300">
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-500 rounded-full blur-sm opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                      <LogOut className="w-5 h-5" />
                    </div>
                    <span className="ml-2">Sign out</span>
                  </div>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[#a259ff]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                  <span className="relative z-10 text-[#a259ff] group-hover:text-white transition-colors duration-300">Sign in</span>
                </Link>
                <Link
                  href="/register"
                  className="relative px-4 py-2 rounded-lg text-sm font-medium flex items-center group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00ffcc] to-[#a259ff] opacity-90 group-hover:opacity-100 transition-all duration-300 rounded-lg 
                    shadow-[0_0_15px_rgba(0,255,204,0.5)] group-hover:shadow-[0_0_20px_rgba(162,89,255,0.6)]"></div>
                  <span className="relative z-10 text-black font-bold">Register</span>
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative p-2 rounded-lg transition-all duration-300 group"
            >
              <div className="absolute inset-0 bg-[#a259ff]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
              <div className="relative">
                {mobileMenuOpen ? 
                  <X className="w-6 h-6 text-[#00ffcc] group-hover:text-white transition-colors duration-300" /> : 
                  <Menu className="w-6 h-6 text-[#00ffcc] group-hover:text-white transition-colors duration-300" />
                }
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div 
        className={`md:hidden absolute w-full bg-gradient-to-b from-[#18122B] to-[#0f1722] backdrop-blur-lg border-b border-[#a259ff]/30 z-50 
          transition-all duration-500 transform shadow-[0_10px_30px_rgba(0,0,0,0.5)]
          ${mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block px-3 py-3 rounded-lg text-base font-medium flex items-center transition-all duration-300 group',
                pathname === item.href
                  ? 'bg-gradient-to-r from-[#00ffcc]/10 to-[#a259ff]/10 text-white border border-[#a259ff]/30'
                  : 'text-gray-300 hover:bg-white/5'
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className={pathname === item.href 
                ? "text-[#00ffcc] group-hover:text-[#a259ff] transition-colors duration-300" 
                : "text-gray-400 group-hover:text-white transition-colors duration-300"
              }>
                {item.icon}
              </div>
              <span className="ml-3">{item.label}</span>
              
              {pathname === item.href && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#00ffcc] to-[#a259ff]"></div>
              )}
            </Link>
          ))}

          {isAuthenticated ? (
            <>
              <Link
                href="/profile"
                className="block px-3 py-3 rounded-lg text-base font-medium flex items-center group hover:bg-white/5 transition-all duration-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="text-[#a259ff] group-hover:text-white transition-colors duration-300">
                  <User className="w-5 h-5" />
                </div>
                <span className="ml-3 text-[#a259ff] group-hover:text-white transition-colors duration-300">{userName}</span>
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full text-left px-3 py-3 rounded-lg text-base font-medium flex items-center group hover:bg-red-500/10 transition-all duration-300"
              >
                <div className="text-red-400 group-hover:text-red-300 transition-colors duration-300">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="ml-3 text-red-400 group-hover:text-red-300 transition-colors duration-300">Sign out</span>
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                href="/login"
                className="block px-3 py-3 rounded-lg text-base font-medium text-center text-[#a259ff] border border-[#a259ff]/50 hover:bg-[#a259ff]/10 transition-all duration-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="block px-3 py-3 rounded-lg text-base font-medium text-center bg-gradient-to-r from-[#00ffcc] to-[#a259ff] text-black font-bold 
                shadow-[0_0_15px_rgba(0,255,204,0.3)] hover:shadow-[0_0_20px_rgba(0,255,204,0.5)] transition-all duration-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

// Add this to your global CSS or Tailwind config
/*
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}
.animate-float {
  animation: float 15s ease-in-out infinite;
}
*/
