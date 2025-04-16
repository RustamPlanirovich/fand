import { NextResponse } from 'next/server';
import { Funding } from '@/types/funding';

export async function GET() {
  try {
    const response = await fetch('http://localhost:3001/api/funding');
    if (!response.ok) {
      throw new Error('Failed to fetch funding data');
    }
    const data: Funding[] = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching funding data:', error);
    return NextResponse.json({ error: 'Failed to fetch funding data' }, { status: 500 });
  }
} 