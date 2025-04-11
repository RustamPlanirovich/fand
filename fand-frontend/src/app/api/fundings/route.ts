import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const exchanges = searchParams.get('exchanges') || '{"binance":true,"bybit":true,"bitget":true,"okx":true}';
    
    console.log('Fetching fundings from backend with settings:', exchanges);
    const response = await fetch(`http://localhost:3001/fundings?exchanges=${encodeURIComponent(exchanges)}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend returned error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      return NextResponse.json({ 
        error: `Backend error: ${response.statusText}`,
        details: errorText,
      }, { 
        status: response.status 
      });
    }
    
    const data = await response.json();
    console.log('Received data length:', data.length);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching fundings:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch fundings',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { 
      status: 500 
    });
  }
} 