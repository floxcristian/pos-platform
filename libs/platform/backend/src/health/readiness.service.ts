import { Injectable } from '@nestjs/common';
import type { BeforeApplicationShutdown, OnApplicationBootstrap } from '@nestjs/common';

@Injectable()
export class ReadinessService implements OnApplicationBootstrap, BeforeApplicationShutdown {
  private ready = false;

  isReady(): boolean {
    return this.ready;
  }

  onApplicationBootstrap(): void {
    this.ready = true;
  }

  beforeApplicationShutdown(): void {
    this.ready = false;
  }
}
