import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

export async function GET(req: NextRequest) {
  try {
    console.log("Token refresh endpoint called");
    
    // Get the session to check if user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log("No user in session for token refresh");
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No user in session' },
        { status: 401 }
      );
    }

    // Get backend API URL from environment variable
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5010/api';
    
    // Get token from session
    const token = session.accessToken;
    
    if (!token) {
      console.log("No token in session for token refresh");
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No token in session' },
        { status: 401 }
      );
    }    // Verify token with backend
    try {
      console.log("Verifying token with backend");
      const response = await fetch(`${apiUrl}/auth/form/verify-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      // If token is valid, return success
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          success: true,
          message: 'Token is valid',
          data: {
            user: session.user,
            token
          }
        });
      }      // If we get here, token is invalid or expired - attempt to get a new one
      console.log("Token invalid, attempting refresh");
      
      // Call our refresh token endpoint
      const refreshResponse = await fetch(`${apiUrl}/auth/form/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: session.user.id,
          refreshToken: token
        })
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        if (refreshData.success && refreshData.data?.token) {
          return NextResponse.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
              user: session.user,
              token: refreshData.data.token
            }
          });
        }
      }

      // If we can't refresh, return error
      return NextResponse.json(
        { error: 'Token expired and could not be refreshed' },
        { status: 401 }
      );
    } catch (error) {
      console.error("Error verifying/refreshing token:", error);
      return NextResponse.json(
        { error: 'Failed to verify or refresh token' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Token refresh route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 