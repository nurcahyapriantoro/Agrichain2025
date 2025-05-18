import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Get the session to check if user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get backend API URL from environment variable
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5010/api';
    
    // Get token from session
    const token = session.accessToken;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication token is missing' },
        { status: 401 }
      );
    }

    // Get the form data from the request
    const formData = await req.formData();
    
    // Add user ID to the form data to ensure the backend associates the image with the correct user
    formData.append('userId', session.user.id);
    
    try {
      // Call backend API with token
      const response = await fetch(`${apiUrl}/user/profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type for multipart/form-data, let the browser set it with the boundary
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend upload error:', errorData);
        return NextResponse.json(
          { success: false, error: errorData.message || 'Failed to upload profile picture' },
          { status: response.status }
        );
      }
      
      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError) {
      console.error("Error fetching from backend:", fetchError);
      return NextResponse.json(
        { success: false, error: 'Network error when uploading profile picture' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Profile picture upload API route error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 