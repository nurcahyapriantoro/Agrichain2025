import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

export async function GET(req: NextRequest) {
  try {
    console.log("User statistics route called");
    
    // Get backend API URL from environment variable
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5010/api';
    console.log(`Using backend API URL: ${apiUrl}`);
    
    // Get the session - we can still return statistics even if not authenticated
    const session = await getServerSession(authOptions);
    console.log("Session data:", session ? "Session exists" : "No session");
    
    // Set up headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization if we have a token
    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
    }

    // Try different endpoint paths - using only valid endpoints to avoid 404 errors
    const endpointsToTry = [
      `${apiUrl}/user/statistics`,  // This is the correct one per backend
    ];
    
    let response = null;
    let lastError = null;
    
    // Try each endpoint in sequence
    for (const endpoint of endpointsToTry) {
      try {
        console.log(`Making request to ${endpoint}`);
        response = await fetch(endpoint, {
          method: 'GET',
          headers,
          cache: 'no-store',
        });
        
        if (response.ok) {
          console.log(`Successfully retrieved user statistics from ${endpoint}`);
          break;
        } else {
          console.log(`Failed to retrieve from ${endpoint}: ${response.status}`);
          response = null;
        }
      } catch (error) {
        lastError = error;
        console.error(`Error fetching from ${endpoint}:`, error);
      }
    }

    // If any endpoint was successful
    if (response?.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }
    
    // If all requests failed, provide fallback data
    console.log("All API endpoints failed, returning fallback data");
    return NextResponse.json({
      success: true,
      message: "Using fallback statistics data",
      data: {
        totalUsers: 0,
        farmerCount: 0,
        collectorCount: 0,
        traderCount: 0,
        retailerCount: 0,
        consumerCount: 0,
        unknownCount: 0
      }
    });
  } catch (error) {
    console.error('User statistics API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 