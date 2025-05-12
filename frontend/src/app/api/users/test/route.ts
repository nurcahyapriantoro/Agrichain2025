import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Get backend API URL from environment variable
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    
    // Log all environment variables for debugging
    console.log('Environment variables:', {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NODE_ENV: process.env.NODE_ENV
    });
    
    // Try to connect to the backend
    console.log(`Testing connection to backend API at: ${apiUrl}`);
    
    try {
      // Test connection without authentication
      const response = await fetch(`${apiUrl}/user/statistics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        return NextResponse.json({
          success: true,
          message: "Backend API connection successful",
          backendUrl: apiUrl,
          env: {
            NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'not set',
            NODE_ENV: process.env.NODE_ENV
          },
          apiResponse: data
        });
      } else {
        return NextResponse.json({
          success: false,
          message: "Backend API returned an error",
          backendUrl: apiUrl,
          statusCode: response.status,
          env: {
            NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'not set',
            NODE_ENV: process.env.NODE_ENV
          },
          apiResponse: data
        }, { status: 200 }); // Still return 200 so we can see the result
      }
    } catch (error: any) {
      // Attempt to ping a basic endpoint as a fallback
      try {
        console.log('Primary endpoint failed, attempting to ping backend');
        const pingResponse = await fetch(`${apiUrl}/ping`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
        });
        
        const pingStatus = pingResponse.ok ? 'successful' : 'failed';
        console.log(`Ping to backend ${pingStatus} with status ${pingResponse.status}`);
        
        return NextResponse.json({
          success: false,
          message: "Primary endpoint failed, but backend is reachable",
          backendUrl: apiUrl,
          error: error.message,
          ping: {
            status: pingResponse.status,
            ok: pingResponse.ok
          },
          env: {
            NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'not set',
            NODE_ENV: process.env.NODE_ENV
          }
        }, { status: 200 });
      } catch (pingError: any) {
        return NextResponse.json({
          success: false,
          message: "Failed to connect to backend API",
          backendUrl: apiUrl,
          error: error.message,
          pingError: pingError.message,
          env: {
            NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'not set',
            NODE_ENV: process.env.NODE_ENV
          }
        }, { status: 200 }); // Still return 200 so we can see the result
      }
    }
  } catch (error: any) {
    console.error('API test route error:', error);
    return NextResponse.json({
      success: false,
      message: "Internal server error in test route",
      error: error.message
    }, { status: 500 });
  }
} 