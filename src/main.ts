import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import createWorker from './worker';
import { getContext } from './lib/contracts';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { nonNullable } from './lib/utils';
import { PairLiquidityInfoHistoryImporterService } from './tasks/pair-liquidity-info-history-importer.service';

const version = nonNullable(process.env.npm_package_version);
async function bootstrap() {
  createWorker(await getContext()).startWorker(false, true);
  const app = await NestFactory.create(AppModule);
  app.get(PairLiquidityInfoHistoryImporterService).importHistoricData();
  app.enableCors();
  const config = new DocumentBuilder()
    .setTitle('Dex-Backend')
    .setDescription(`API documentation for Dex-Backend v${version}`)
    .setVersion(version)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('', app, document);
  await app.listen(3000);
}
bootstrap();
