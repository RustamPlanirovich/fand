import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const exchangesParam = searchParams.get('exchanges');
    
    if (!exchangesParam) {
      return NextResponse.json({ error: 'Missing exchanges parameter' }, { status: 400 });
    }

    let exchangeSettings;
    try {
      exchangeSettings = JSON.parse(exchangesParam);
    } catch {
      return NextResponse.json({ error: 'Invalid exchanges parameter format' }, { status: 400 });
    }

    // Убедимся, что все биржи присутствуют в настройках
    const settings = {
      binance: exchangeSettings.binance || false,
      bybit: exchangeSettings.bybit || false,
      bitget: exchangeSettings.bitget || false,
      mexc: exchangeSettings.mexc || false,
      okx: exchangeSettings.okx || false
    };

    console.log('Processing request with settings:', settings);

    const response = await fetch(`http://localhost:3001/fundings?exchanges=${JSON.stringify(settings)}`);
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in funding route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 