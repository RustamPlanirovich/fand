import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FundingController } from './controllers/funding.controller';
import { ExchangeService } from './services/exchange.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
  ],
  controllers: [FundingController],
  providers: [ExchangeService],
})
export class AppModule {}
