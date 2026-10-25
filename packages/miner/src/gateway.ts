import { NodeClient } from '@pearl/node';
import { TemplateScheduler } from './scheduler';
import { MinerRpcServer } from './rpc';

export interface PearlGatewayOptions {
  nodeClient: NodeClient;
  scheduler: TemplateScheduler;
  rpcServer: MinerRpcServer;
}

export class PearlGateway {
  private nodeClient: NodeClient;
  private scheduler: TemplateScheduler;
  private rpcServer: MinerRpcServer;
  private running = false;

  constructor(options: PearlGatewayOptions) {
    this.nodeClient = options.nodeClient;
    this.scheduler = options.scheduler;
    this.rpcServer = options.rpcServer;
  }

  public async start(): Promise<void> {
    if (this.running) {
      return;
    }

    const cleanupSteps: Array<() => Promise<void> | void> = [];

    try {
      await this.nodeClient.open();
      cleanupSteps.push(async () => {
        await this.nodeClient.close();
      });

      await this.scheduler.start();
      cleanupSteps.push(async () => {
        await this.scheduler.stop();
      });

      await this.rpcServer.start();
      cleanupSteps.push(async () => {
        await this.rpcServer.stop();
      });

      this.running = true;
    } catch (error) {
      for (let i = cleanupSteps.length - 1; i >= 0; i--) {
        try {
          await cleanupSteps[i]();
        } catch (cleanupError) {
          // Ignore cleanup errors during rollback
        }
      }
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    try {
      await this.rpcServer.stop();
      await this.scheduler.stop();
      await this.nodeClient.close();
    } finally {
      this.running = false;
    }
  }

  public isRunning(): boolean {
    return this.running;
  }
}
