import { NextResponse } from 'next/server';
import { Bitget } from '@/types/bitget';

export async function GET() {
  try {
    const response = await fetch('http://localhost:3001/api/bitget');
    if (!response.ok) {
      throw new Error('Failed to fetch Bitget data');
    }
    const data: Bitget[] = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Bitget data:', error);
    return NextResponse.json({ error: 'Failed to fetch Bitget data' }, { status: 500 });
  }
} 