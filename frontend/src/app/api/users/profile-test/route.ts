import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

export async function GET(req: NextRequest) {
  try {
    console.log("Profile test route called");
    
    // Get the session to check if user is authenticated
    const session = await getServerSession(authOptions);
    
    // Prepare a safe version of the session to return (filter out sensitive data)
    const safeSession = session ? {
      user: {
        id: session.user?.id,
        name: session.user?.name,
        email: session.user?.email,
        role: session.user?.role,
        walletAddress: session.user?.walletAddress,
        // Remove sensitive fields but indicate if they exist
        accessTokenExists: !!session.accessToken,
      },
      expires: session.expires,
    } : null;

    // Get backend API URL from environment variable
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5010/api';
    
    // Simple backend connectivity test
    let backendStatus = "unknown";
    try {
      const response = await fetch(`${apiUrl}/health`, { 
        method: 'GET',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      });
      backendStatus = response.ok ? "accessible" : `error: ${response.status}`;
    } catch (error) {
      backendStatus = `error: ${error instanceof Error ? error.message : String(error)}`;
    }

    // Test backend API endpoints for statistics and trend
    const endpointTests = {
      statistics: { status: "untested", data: null },
      trend: { status: "untested", data: null }
    };

    // Test the statistics endpoint
    try {
      const statsResponse = await fetch(`${apiUrl}/user/statistics`, {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      });
      
      endpointTests.statistics.status = statsResponse.ok 
        ? "success" 
        : `error: ${statsResponse.status}`;
      
      if (statsResponse.ok) {
        endpointTests.statistics.data = await statsResponse.json();
      }
    } catch (error) {
      endpointTests.statistics.status = `exception: ${error instanceof Error ? error.message : String(error)}`;
    }

    // Test the trend endpoint
    try {
      const trendResponse = await fetch(`${apiUrl}/user/trend?period=monthly`, {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      });
      
      endpointTests.trend.status = trendResponse.ok 
        ? "success" 
        : `error: ${trendResponse.status}`;
      
      if (trendResponse.ok) {
        endpointTests.trend.data = await trendResponse.json();
      }
    } catch (error) {
      endpointTests.trend.status = `exception: ${error instanceof Error ? error.message : String(error)}`;
    }

    // Return detailed diagnostic information
    return NextResponse.json({
      success: true,
      message: "Profile test endpoint",
      data: {
        authenticated: !!session,
        sessionExists: !!session,
        session: safeSession,
        environment: {
          apiUrl,
          nodeEnv: process.env.NODE_ENV,
        },
        backend: {
          status: backendStatus,
          endpointTests
        },
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Profile test API route error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
} 