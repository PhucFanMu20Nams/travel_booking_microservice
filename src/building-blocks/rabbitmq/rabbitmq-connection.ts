import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import configs from '../configs/configs';
import asyncRetry from 'async-retry';

export class RabbitmqOptions {
  host: string;
  port: number;
  password: string;
  username: string;
  constructor(partial?: Partial<RabbitmqOptions>) {
    Object.assign(this, partial);
  }
}

let connection: amqp.Connection = null;
let channel: amqp.Channel = null;
let isShuttingDown = false;

export interface IRabbitmqConnection {
  createConnection(options?: RabbitmqOptions): Promise<amqp.Connection>;

  getChannel(): Promise<amqp.Channel>;

  closeChanel(): Promise<void>;

  closeConnection(): Promise<void>;
}

@Injectable()
export class RabbitmqConnection implements OnModuleInit, IRabbitmqConnection {
  constructor(@Inject(RabbitmqOptions) private readonly options?: RabbitmqOptions) {}

  async onModuleInit(): Promise<void> {
    isShuttingDown = false;
    await this.createConnection(this.options);
  }

  async createConnection(options?: RabbitmqOptions): Promise<amqp.Connection> {
    if (isShuttingDown) {
      return connection;
    }

    if (!connection) {
      try {
        const host = options?.host ?? configs.rabbitmq.host;
        const port = options?.port ?? configs.rabbitmq.port;

        await asyncRetry(
          async () => {
            connection = await amqp.connect(`amqp://${host}:${port}`, {
              username: options?.username ?? configs.rabbitmq.username,
              password: options?.password ?? configs.rabbitmq.password
            });
          },
          {
            retries: configs.retry.count,
            factor: configs.retry.factor,
            minTimeout: configs.retry.minTimeout,
            maxTimeout: configs.retry.maxTimeout
          }
        );

        connection.on('error', async (error): Promise<void> => {
          if (isShuttingDown) {
            Logger.warn(`Connection error observed during shutdown: ${error}`);
            return;
          }

          Logger.error(`Error occurred on connection: ${error}`);

          await this.closeConnectionInternal(false);

          await this.createConnection();
        });

        connection.on('close', (): void => {
          connection = null;
          channel = null;
        });
      } catch (error) {
        throw new Error('Rabbitmq connection is failed!');
      }
    }
    return connection;
  }
  async getChannel(): Promise<amqp.Channel> {
    try {
      if (!connection) {
        throw new Error('Rabbitmq connection is failed!');
      }

      if (!channel) {
        await asyncRetry(
          async () => {
            channel = await connection.createChannel();
            Logger.log('Channel Created successfully');
          },
          {
            retries: configs.retry.count,
            factor: configs.retry.factor,
            minTimeout: configs.retry.minTimeout,
            maxTimeout: configs.retry.maxTimeout
          }
        );

        channel.on('error', async (error): Promise<void> => {
          if (isShuttingDown) {
            Logger.warn(`Error occurred on channel during shutdown: ${error}`);
            return;
          }

          Logger.error(`Error occurred on channel: ${error}`);
          await this.closeChannelInternal(false);
          await this.getChannel();
        });
      }

      return channel;
    } catch (error) {
      if (isShuttingDown) {
        Logger.warn('Failed to get channel during shutdown');
        return;
      }

      Logger.error('Failed to get channel!');
    }
  }

  async closeChanel(): Promise<void> {
    await this.closeChannelInternal(isShuttingDown);
  }

  async closeConnection(): Promise<void> {
    await this.closeConnectionInternal(true);
  }

  private isExpectedCloseError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error ?? '');
    const normalizedMessage = message.toLowerCase();

    return (
      normalizedMessage.includes('closed') ||
      normalizedMessage.includes('closing') ||
      normalizedMessage.includes('unexpected close')
    );
  }

  private async closeChannelInternal(shutdownMode: boolean): Promise<void> {
    try {
      if (channel) {
        const activeChannel = channel;
        channel = null;
        await activeChannel.close();
        Logger.log('Channel closed successfully');
      }
    } catch (error) {
      if (shutdownMode && this.isExpectedCloseError(error)) {
        Logger.warn('Channel was already closed during shutdown');
        return;
      }

      Logger.error('Channel close failed!');
    } finally {
      channel = null;
    }
  }

  private async closeConnectionInternal(shutdownMode: boolean): Promise<void> {
    if (shutdownMode) {
      isShuttingDown = true;
    }

    await this.closeChannelInternal(shutdownMode || isShuttingDown);

    try {
      if (connection) {
        const activeConnection = connection;
        connection = null;
        await activeConnection.close();
        Logger.log('Connection Rabbitmq closed gracefully');
      }
    } catch (error) {
      if ((shutdownMode || isShuttingDown) && this.isExpectedCloseError(error)) {
        Logger.warn('Connection Rabbitmq was already closed during shutdown');
        return;
      }

      Logger.error('Connection Rabbitmq close failed!');
    } finally {
      connection = null;
    }
  }
}
