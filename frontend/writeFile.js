const fs = require('fs');
const path = require('path');

// The content to write to route.ts
const content = `import NextAuth, { NextAuthOptions, Session, User, Account, Profile, JWT } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5010/api';

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
          return null;
        }
        
        try {
          const response = await axios.post(\`\${API_URL}/user/login\`, {
            email: credentials.email,
            password: credentials.password,
          });
          
          if (response.data.success && response.data.token) {
            return {
              id: response.data.user.id,
              email: response.data.user.email,
              name: response.data.user.name,
              role: response.data.user.role,
              walletAddress: response.data.user.walletAddress,
              phone: response.data.user.phone,
              address: response.data.user.address,
              profilePicture: response.data.user.profilePicture,
              isEmailVerified: response.data.user.isEmailVerified,
              token: response.data.token
            };
          }
          return null;
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
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        // If using Google OAuth
        if (account.provider === 'google') {
          try {
            // Adapt this to your backend API structure
            const response = await axios.post(\`\${API_URL}/user/google-login\`, {
              token: account.id_token,
            });
            
            if (response.data.success) {
              const userData = response.data.user;
              token.id = userData.id;
              token.email = userData.email;
              token.name = userData.name;
              token.role = userData.role;
              token.walletAddress = userData.walletAddress;
              token.phone = userData.phone;
              token.address = userData.address;
              token.profilePicture = userData.profilePicture;
              token.isEmailVerified = userData.isEmailVerified;
              token.accessToken = response.data.token;
            }
          } catch (error) {
            console.error('Error during Google OAuth verification:', error);
          }
        } else {
          // Regular credentials login
          token.id = user.id;
          token.email = user.email as string;
          token.name = user.name as string;
          token.role = (user as any).role;
          token.walletAddress = (user as any).walletAddress;
          token.phone = (user as any).phone;
          token.address = (user as any).address;
          token.profilePicture = (user as any).profilePicture;
          token.isEmailVerified = (user as any).isEmailVerified;
          token.accessToken = (user as any).token;
        }
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.walletAddress = token.walletAddress as string;
        session.user.accessToken = token.accessToken as string;
        session.user.phone = token.phone as string | undefined;
        session.user.address = token.address as string | undefined;
        session.user.profilePicture = token.profilePicture as string | undefined;
        session.user.isEmailVerified = token.isEmailVerified as boolean | undefined;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60 // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key'
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };`;

// The path of the route.ts file
const filePath = path.join(
  'e:', 'Cahyo', 'Blockchain Agriblock', 'agrichain2', 'agrichain', 
  'frontend', 'src', 'app', 'api', 'auth', '[...nextauth]', 'route.ts'
);

// Write the content to the file
try {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully wrote to route.ts');
} catch (error) {
  console.error('Error writing to file:', error);
}
