import { Injectable } from '@nestjs/common';

@Injectable()
export class TasksService {
  private _isRunning = false;

  get isRunning(): boolean {
    return this._isRunning;
  }

  setIsRunning(isRunning: boolean): void {
    this._isRunning = isRunning;
  }
}
