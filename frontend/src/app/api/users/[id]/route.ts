import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`User [id] route called for id: ${params.id}`);
    
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

    const userId = params.id;
    
    if (!userId) {
      console.log("No user ID provided in params");
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // If requesting the current user's own data and we have session data
    if (userId === session.user.id) {
      console.log("Requested ID matches current user, using session data");
      return NextResponse.json({
        success: true,
        message: "User data retrieved from session",
        data: {
          id: session.user.id,
          name: session.user.name || '',
          email: session.user.email || '',
          role: session.user.role || '',
          walletAddress: session.user.walletAddress || '',
        }
      });
    }

    // Get backend API URL from environment variable
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5010/api';
    console.log(`Using backend API URL: ${apiUrl}`);
    
    // Get token from session
    const token = session.accessToken;
    
    if (!token) {
      console.log("No access token in session");
      return NextResponse.json(
        { error: 'Authentication token is missing' },
        { status: 401 }
      );
    }

    try {
      console.log(`Making request to ${apiUrl}/user/profile/${userId} with token`);
      
      // Call backend API with token
      const response = await fetch(`${apiUrl}/user/profile/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log(`Backend response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Successfully retrieved user profile from backend");
        return NextResponse.json(data);
      }
      
      // Try alternative endpoint if the first one fails
      console.log(`Trying alternative endpoint: ${apiUrl}/user/${userId}`);
      const altResponse = await fetch(`${apiUrl}/user/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (altResponse.ok) {
        const altData = await altResponse.json();
        console.log("Successfully retrieved user profile from alternative endpoint");
        return NextResponse.json(altData);
      }
      
      console.log("All backend endpoints failed");
      return NextResponse.json(
        { error: 'Failed to fetch user data', status: response.status },
        { status: 404 }
      );
    } catch (fetchError) {
      console.error("Error fetching from backend:", fetchError);
      return NextResponse.json(
        { error: 'Network error when fetching user data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('User API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 