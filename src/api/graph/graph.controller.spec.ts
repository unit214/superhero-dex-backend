import { CacheModule } from '@nestjs/cache-manager';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { GraphController } from '@/api/graph/graph.controller';
import { GraphType, TimeFrame } from '@/api/graph/graph.model';
import { GraphService } from '@/api/graph/graph.service';
import { overviewMaxTVLGraph } from '@/test/mock-data/graph-mock-data';

const mockGraphService = {
  getGraph: jest.fn(),
};

describe('GraphController', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GraphController],
      providers: [
        {
          provide: GraphService,
          useValue: mockGraphService,
        },
      ],
      imports: [
        CacheModule.register({
          isGlobal: true,
        }),
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  describe('GET /graph', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return graph entries and use default value for empty timeFrame param', async () => {
      // Mocks
      mockGraphService.getGraph.mockResolvedValue(overviewMaxTVLGraph);

      // Call route
      const result = await request(app.getHttpServer()).get(
        '/graph?graphType=TVL',
      );

      // Assertions
      expect(mockGraphService.getGraph).toHaveBeenCalledWith(
        GraphType.TVL,
        TimeFrame.MAX,
        undefined,
        undefined,
      );
      expect(result.status).toBe(200);
      expect(result.body).toMatchSnapshot();
    });

    it('should parse all query params correctly', async () => {
      // Call route
      await request(app.getHttpServer()).get(
        '/graph?graphType=Volume&timeFrame=1Y&tokenAddress=ct_123&pairAddress=ct_456',
      );

      // Assertions
      expect(mockGraphService.getGraph).toHaveBeenCalledWith(
        GraphType.Volume,
        TimeFrame['1Y'],
        'ct_123',
        'ct_456',
      );
    });

    it('should validate graphType param correctly', async () => {
      // Call route
      const result = await request(app.getHttpServer()).get(
        '/graph?graphType=xyz',
      );

      // Assertions
      expect(mockGraphService.getGraph).toHaveBeenCalledTimes(0);
      expect(result.status).toBe(400);
    });

    it('should validate timeFrame query param correctly', async () => {
      // Call route
      const result = await request(app.getHttpServer()).get(
        '/graph?timeFrame=xyz',
      );

      // Assertions
      expect(mockGraphService.getGraph).toHaveBeenCalledTimes(0);
      expect(result.status).toBe(400);
    });

    it.todo('should calculate the graph data correctly');
  });
});
