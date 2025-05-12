import { UserRole } from './user';
import { Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    expires: string;
    user?: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: UserRole;
      accessToken?: string;
      walletAddress?: string | null;
      phone?: string | null;
      address?: string | null;
      profilePicture?: string | null;
      isEmailVerified?: boolean;
      needsRoleSelection?: boolean;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: UserRole;
    accessToken?: string;
    walletAddress?: string | null;
    phone?: string | null;
    address?: string | null;
    profilePicture?: string | null;
    isEmailVerified?: boolean;
    needsRoleSelection?: boolean;
    token?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    exp?: number;
    iat?: number;
    jti?: string;
    user?: {
      id: string;
      name?: string;
      email?: string;
      role?: UserRole;
      walletAddress?: string | null;
      phone?: string | null;
      address?: string | null;
      profilePicture?: string | null;
      isEmailVerified?: boolean;
      needsRoleSelection?: boolean;
    };
  }
}