import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

export async function GET(req: NextRequest) {
  try {
    console.log("Profile route called");
    
    // Get the session to check if user is authenticated
    const session = await getServerSession(authOptions);
    console.log("Session data:", session ? "Session exists" : "No session");
    
    if (!session?.user) {
      console.log("No user in session");
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No user in session' },
        { status: 401 }
      );
    }

    // Get backend API URL from environment variable
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5010/api';
    console.log(`Using backend API URL: ${apiUrl}`);
    
    // Get token from session
    const token = session.accessToken;
    
    if (!token) {
      console.log("No access token in session");
      
      // Return basic user data from session even without token
      return NextResponse.json({
        success: true,
        message: "Using session data (no token)",
        data: {
          id: session.user.id,
          name: session.user.name || '',
          email: session.user.email || '',
          role: session.user.role || '',
          walletAddress: session.user.walletAddress || '',
        }
      });
    }

    console.log(`Making request to ${apiUrl}/user/profile with token`);
    
    try {
      // Call backend API with token
      const response = await fetch(`${apiUrl}/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
  
      console.log(`Backend response status: ${response.status}`);
      
      // If successful, return the backend data
      if (response.ok) {
        const data = await response.json();
        console.log("Successfully retrieved user profile from backend");
        return NextResponse.json(data);
      }
      
      // If backend request fails, fall back to session data
      console.log(`Error from backend (${response.status}), using session data as fallback`);
      return NextResponse.json({
        success: true,
        message: "Using session data (backend error)",
        data: {
          id: session.user.id,
          name: session.user.name || '',
          email: session.user.email || '',
          role: session.user.role || '',
          walletAddress: session.user.walletAddress || '',
        }
      });
    } catch (fetchError) {
      console.error("Error fetching from backend:", fetchError);
      
      // Network error - fall back to session data
      return NextResponse.json({
        success: true,
        message: "Using session data (network error)",
        data: {
          id: session.user.id,
          name: session.user.name || '',
          email: session.user.email || '',
          role: session.user.role || '',
          walletAddress: session.user.walletAddress || '',
        }
      });
    }
  } catch (error) {
    console.error('Profile API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 