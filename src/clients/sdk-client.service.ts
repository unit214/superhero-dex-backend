import { Injectable } from '@nestjs/common';
import { AeSdk, Node } from '@aeternity/aepp-sdk';
import { nonNullable } from '../lib/utils';
import NETWORKS from '../lib/network-config';

@Injectable()
export class SdkClientService {
  private client: AeSdk;
  private node: Node;

  async getClient(): Promise<[AeSdk, Node]> {
    const NETWORK_NAME = nonNullable(process.env.NETWORK_NAME);
    if (this.client == null) {
      this.node = new Node(NETWORKS[NETWORK_NAME].nodeUrl, {
        ignoreVersion: true,
      });

      this.client = new AeSdk({
        nodes: [{ name: NETWORK_NAME, instance: this.node }],
      });
    }
    return [this.client, this.node];
  }

  async getHeight(): Promise<number> {
    return await this.getClient().then(([client]) => client.getHeight());
  }
}
