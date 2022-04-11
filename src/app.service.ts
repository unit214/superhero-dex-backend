import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  async getAllPairs(): Promise<string[]> {
    return [];
  }
}
