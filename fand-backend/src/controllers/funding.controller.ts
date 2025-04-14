import { Controller, Get, Query } from '@nestjs/common';
import { ExchangeService } from '../services/exchange.service';

@Controller('fundings')
export class FundingController {
  constructor(private readonly exchangeService: ExchangeService) {}

  @Get()
  async getFundings(
    @Query('exchanges') exchanges: string = '{"binance":false,"bybit":false,"bitget":false,"mexc":false,"okx":false}',
    @Query('priority') priority: string = 'false'
  ) {
    try {
      console.log('Received exchanges parameter:', exchanges);
      const exchangeSettings = JSON.parse(exchanges);
      console.log('Parsed exchange settings:', exchangeSettings);
      return await this.exchangeService.getAllFundings(exchangeSettings, priority === 'true');
    } catch (error) {
      console.error('Error in funding controller:', error);
      throw error;
    }
  }
} 