import { Controller, Get, Query } from '@nestjs/common';
import { ExchangeService } from '../services/exchange.service';

@Controller('fundings')
export class FundingController {
  constructor(private readonly exchangeService: ExchangeService) {}

  @Get()
  async getFundings(
    @Query('exchanges') exchanges: string = '{"binance":true,"bybit":true,"bitget":true,"okx":true}'
  ) {
    try {
      const exchangeSettings = JSON.parse(exchanges);
      return await this.exchangeService.getAllFundings(exchangeSettings);
    } catch (error) {
      console.error('Error in funding controller:', error);
      throw error;
    }
  }
} 