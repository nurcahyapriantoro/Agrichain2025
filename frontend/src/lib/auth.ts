import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";
import { User } from "../types/user";

// Define the auth options with token handling
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Get API URL from environment
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
          console.log(`Calling login endpoint at ${apiUrl}/user/login`);
          
          // Call the login endpoint
          const response = await fetch(`${apiUrl}/user/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await response.json();
          console.log("Login response:", data.success ? "Success" : "Failed");

          if (!response.ok || !data.success) {
            console.error("Login error:", data.message);
            throw new Error(data.message || 'Login failed');
          }

          // Make sure the token is present
          if (!data.data.token) {
            console.error("No token in login response");
            throw new Error('No authentication token received');
          }

          // Store token in session storage
          const sessionData = {
            user: {
              id: data.data.user.id,
              email: data.data.user.email,
              name: data.data.user.name,
              role: data.data.user.role,
              walletAddress: data.data.user.walletAddress
            },
            accessToken: data.data.token
          };
          sessionStorage.setItem('session', JSON.stringify(sessionData));

          // Return the user data with token
          return {
            id: data.data.user.id,
            email: data.data.user.email,
            name: data.data.user.name,
            role: data.data.user.role,
            walletAddress: data.data.user.walletAddress,
            accessToken: data.data.token
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }: { token: JWT; user: any; account: any }) {
      // Add custom fields from user to token during initial sign in
      if (user) {
        console.log("JWT callback - Adding user data to token");
        token.id = user.id;
        token.role = user.role;
        token.walletAddress = user.walletAddress;
        token.accessToken = user.accessToken;

        // Store token in session storage
        const sessionData = {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            walletAddress: user.walletAddress
          },
          accessToken: user.accessToken
        };
        sessionStorage.setItem('session', JSON.stringify(sessionData));
      }

      // For subsequent calls, return the token
      return token;
    },
    async session({ session, token }: { session: any; token: JWT }) {
      // Add custom fields from token to session
      if (token) {
        console.log("Session callback - Adding token data to session");
        if (!session.user) session.user = {};
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.walletAddress = token.walletAddress as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
}; 