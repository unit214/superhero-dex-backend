import { Injectable } from '@nestjs/common';

@Injectable()
export class HttpService {
  async get<T>(url: string, headers?: Headers): Promise<T> {
    return fetch(url, { method: 'GET', headers: headers }).then(async (res) => {
      if (res.ok) {
        return (await res.json()) as Promise<T>;
      } else {
        throw new Error(
          `GET ${url} failed with status ${res.status}. Response body: ${await res.text()}`,
        );
      }
    });
  }
}
