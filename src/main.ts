import { NestFactory } from '@nestjs/core';
import { AppModule } from './api/app.module';
import createWorker from './worker';
import { getContext } from './lib/contracts';

async function bootstrap() {
  createWorker(await getContext()).startWorker();
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
