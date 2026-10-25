import { PearlGateway } from './gateway';
import { NodeClient } from '@pearl/node';
import { TemplateScheduler } from './scheduler';
import { MinerRpcServer } from './rpc';

describe('PearlGateway startup rollback', () => {
  it('rolls back started components when RPC start fails', async () => {
    const nodeClient = {
      open: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    } as unknown as NodeClient;

    const scheduler = {
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
    } as unknown as TemplateScheduler;

    const rpcServer = {
      start: jest.fn().mockRejectedValue(new Error('port in use')),
      stop: jest.fn().mockResolvedValue(undefined),
    } as unknown as MinerRpcServer;

    const gateway = new PearlGateway({ nodeClient, scheduler, rpcServer });

    await expect(gateway.start()).rejects.toThrow('port in use');

    expect(nodeClient.open).toHaveBeenCalled();
    expect(scheduler.start).toHaveBeenCalled();
    expect(rpcServer.start).toHaveBeenCalled();

    expect(scheduler.stop).toHaveBeenCalled();
    expect(nodeClient.close).toHaveBeenCalled();
    expect(gateway.isRunning()).toBe(false);
  });
});
