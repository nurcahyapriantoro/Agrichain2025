import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

export async function GET(req: NextRequest) {
  try {
    console.log("User trend route called");
    
    // Get the period from query params (default to monthly)
    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get('period') || 'monthly';
    
    // Validate period parameter
    if (!['weekly', 'monthly', 'yearly'].includes(period)) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid period. Must be one of: weekly, monthly, yearly" 
        },
        { status: 400 }
      );
    }
    
    console.log(`Fetching signup trend data for period: ${period}`);
    
    // Get backend API URL from environment variable
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5010/api';
    console.log(`Using backend API URL: ${apiUrl}`);
    
    // Get the session - we can still return trends even if not authenticated
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
      `${apiUrl}/user/trend?period=${period}`,    // This is the correct one per backend
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
          console.log(`Successfully retrieved trend data from ${endpoint}`);
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
      message: "Using fallback trend data",
      data: {
        period,
        trends: [] // Empty trends array as fallback
      }
    });
  } catch (error) {
    console.error('User trend API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 