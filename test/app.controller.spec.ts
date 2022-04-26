import { Test, TestingModule } from '@nestjs/testing';
import { PairsController } from '../src/api/pairs/controller';
import { PairsService } from '../src/api/pairs/service';

describe('PairsController', () => {
  let appController: PairsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PairsController],
      providers: [PairsService],
    }).compile();

    appController = app.get<PairsController>(PairsController);
  });

  describe('root', () => {
    it('should return empty pairs', async () => {
      await appController.getAllPairs();
      //TODO: do sth with this
      //expect().toStrictEqual([]);
    });
  });
});
