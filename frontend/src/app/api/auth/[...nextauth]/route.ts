import NextAuth, { NextAuthOptions, Session, User, Account, Profile } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import axios from 'axios';
import { UserRole } from '@/types/user';

// Pastikan API URL benar dan konsisten
// Default jika tidak ada env variable, gunakan versi production http://localhost:5010/api
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5010/api';

console.log('NextAuth using API URL:', API_URL);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "select_account"
        }
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('Credentials missing email or password');
          return null;
        }
        
        try {
          console.log(`Authenticating: ${credentials.email}`);
          
          // Panggilan API login
          const apiResponse = await fetch(`${API_URL}/user/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          
          const data = await apiResponse.json();
          console.log('API Response:', JSON.stringify(data, null, 2));
          
          // Jika login berhasil
          if (data.success === true) {
            // Ambil data user dari respons API
            const userData = data.data?.user || data.user || data.data;
            const tokenValue = data.data?.token || data.token || '';
            
            if (!userData || !userData.id) {
              console.error('Invalid user data in API response');
              return null;
            }
            
            console.log('Login success, user data:', userData);
            
            // Konversi ke object User sesuai dengan yang diharapkan NextAuth
            return {
              id: userData.id,
              email: userData.email,
              name: userData.name,
              image: userData.profilePicture || null,
              
              // Additional custom properties
              walletAddress: userData.walletAddress || null,
              role: userData.role || UserRole.CONSUMER,
              phone: userData.phone || null,
              address: userData.address || null,
              profilePicture: userData.profilePicture || null,
              isEmailVerified: userData.isEmailVerified || false,
              token: tokenValue
            } as any; // Cast ke any agar typechecking NextAuth dilewati
          } else {
            console.error('API returned failure:', data);
            return null;
          }
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // For redirect after login with Google or sign out
      console.log('Redirect callback - URL:', url);
      console.log('Redirect callback - Base URL:', baseUrl);
      
      // If URL is a sign out URL, always redirect to home page
      if (url.includes('/signout') || url.includes('/logout')) {
        console.log('Sign out detected, redirecting to homepage');
        return baseUrl;
      }
      
      // If URL is a callback from auth provider, redirect to homepage
      if (url.startsWith(baseUrl + '/api/auth/callback')) {
        return '/';
      }
      
      // Use the URL if it's valid, otherwise use the base URL
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
    async jwt({ token, user, account }) {
      // Initial sign in - ketika user pertama kali login
      if (user) {
        console.log('Setting initial JWT from user object:', user);
        token.id = user.id;
        token.email = user.email as string;
        token.name = user.name as string;
        token.role = (user as any).role as UserRole || UserRole.CONSUMER;
        
        // Handle other user properties if they exist
        if ('walletAddress' in user) token.walletAddress = (user as any).walletAddress;
        if ('phone' in user) token.phone = (user as any).phone;
        if ('address' in user) token.address = (user as any).address;
        if ('profilePicture' in user) token.profilePicture = (user as any).profilePicture;
        if ('isEmailVerified' in user) token.isEmailVerified = (user as any).isEmailVerified;
        if ('token' in user) token.accessToken = user.token;
        
        // Khusus untuk kredensial manual
        if (account?.type === 'credentials') {
          console.log('Setting token for credentials provider');
        }
        
        // Khusus untuk login Google
        if (account?.provider === 'google') {
          console.log('Setting token for Google provider');
          try {
            // Call the backend API for Google login
            const response = await axios.post(`${API_URL}/user/google-login`, {
              googleId: account.providerAccountId,
              token: account.id_token,
              email: token.email,
              name: token.name
            });
            
            if (response.data.success) {
              let userData = response.data.data?.user || response.data.user || response.data.data;
              if (userData) {
                token.id = userData.id || token.sub;
                token.role = userData.role || UserRole.CONSUMER;
                
                // Set tanda bila perlu pilih role
                token.needsRoleSelection = !userData.role || userData.role === UserRole.CONSUMER;
                
                // Simpan token dari respons
                if (response.data.data?.token) {
                  token.accessToken = response.data.data.token;
                } else if (response.data.token) {
                  token.accessToken = response.data.token;
                }
                
                console.log('Google auth success, token data:', {
                  id: token.id,
                  role: token.role,
                  needsRoleSelection: token.needsRoleSelection
                });
              }
            } else {
              console.error('Google login API response error:', response.data);
            }
          } catch (error) {
            console.error('Error during Google OAuth verification:', error);
          }
        }
      }
      
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.accessToken) {
        session.accessToken = token.accessToken; // Simpan accessToken di root session
      }
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        if (token.walletAddress) session.user.walletAddress = token.walletAddress as string;
        if (token.accessToken) session.user.accessToken = token.accessToken as string;
        if (token.phone) session.user.phone = token.phone as string;
        if (token.address) session.user.address = token.address as string;
        if (token.profilePicture) session.user.profilePicture = token.profilePicture as string;
        if (token.isEmailVerified !== undefined) session.user.isEmailVerified = Boolean(token.isEmailVerified);
        if (token.needsRoleSelection !== undefined) session.user.needsRoleSelection = Boolean(token.needsRoleSelection);
      }
      const sanitizedSession = { 
        ...session,
        user: { 
          ...session.user,
          accessToken: session.user?.accessToken ? '[REDACTED]' : undefined
        }
      };
      console.log('Session callback returning:', JSON.stringify(sanitizedSession, null, 2));
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60 // 24 hours
  },
  debug: true, // Aktifkan debug mode di development
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };