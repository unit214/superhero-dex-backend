import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { nonNullable } from './lib/utils';
import { PairSyncService } from './tasks/pair-sync/pair-sync.service';

const version = nonNullable(process.env.npm_package_version);
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const config = new DocumentBuilder()
    .setTitle('Dex-Backend')
    .setDescription(`API documentation for Dex-Backend v${version}`)
    .setVersion(version)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('', app, document);
  await app.listen(3000);
  app.get(PairSyncService).startSync(true, true);
}
bootstrap();
