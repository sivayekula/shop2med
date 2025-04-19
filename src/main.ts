import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  // Increase payload size
  app.use(bodyParser.json({ limit: '10mb' })); // Adjust the size as needed
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
  app.enableCors({
    origin: ['http://localhost:3000', 'http://192.168.1.6:3000'], // Allow frontend domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: false,
  });
  app.setGlobalPrefix('api/');
  await app.listen(process.env.PORT || 8000);
}
bootstrap();
