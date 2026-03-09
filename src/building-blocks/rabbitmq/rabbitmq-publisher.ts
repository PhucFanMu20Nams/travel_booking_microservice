import { Injectable, Logger } from '@nestjs/common';
import { RabbitmqConnection } from './rabbitmq-connection';
import { serializeObject } from '../utils/serilization';
import { getTypeName } from '../utils/reflection';
import { snakeCase } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import configs from '../configs/configs';
import asyncRetry from 'async-retry';
import { OtelDiagnosticsProvider } from '../openTelemetry/otel-diagnostics-provider';
import { createRabbitmqMessageEnvelope } from '../contracts/message-envelope.contract';

const publishedMessages: string[] = [];

export interface PublishMessageOptions {
  useEnvelope?: boolean;
}

export interface IRabbitmqPublisher {
  publishMessage<T>(message: T, options?: PublishMessageOptions): Promise<void>;
  isPublished<T>(message: T): Promise<boolean>;
}

const getServiceIdentifier = (): string =>
  configs.serviceName || configs.opentelemetry.serviceName || 'unknown_service';

@Injectable()
export class RabbitmqPublisher implements IRabbitmqPublisher {
  constructor(
    private readonly rabbitMQConnection: RabbitmqConnection,
    private readonly otelDiagnosticsProvider: OtelDiagnosticsProvider
  ) {}

  async publishMessage<T>(message: T, options: PublishMessageOptions = {}): Promise<void> {
    try {
      await asyncRetry(
        async () => {
          const channel = await this.rabbitMQConnection.getChannel();

          const tracer = this.otelDiagnosticsProvider.getTracer();
          const exchangeName = snakeCase(getTypeName(message));
          const span = tracer.startSpan(`publish_message_${exchangeName}`);

          const messageId = uuidv4().toString();
          const traceId = span.spanContext().traceId || messageId;
          const useEnvelope = options.useEnvelope ?? configs.rabbitmq.useEnvelope;
          const payload = useEnvelope
            ? createRabbitmqMessageEnvelope(message, {
                messageId,
                traceId,
                producer: getServiceIdentifier()
              })
            : message;
          const serializedMessage = serializeObject(payload);

          await channel.assertExchange(exchangeName, 'fanout', {
            durable: true
          });

          const messageProperties = {
            appId: getServiceIdentifier(),
            contentType: 'application/json',
            messageId,
            persistent: true,
            timestamp: Date.now(),
            type: exchangeName,
            headers: {
              exchange: exchangeName,
              traceId,
              schemaVersion: useEnvelope ? 1 : undefined
            }
          };

          channel.publish(exchangeName, '', Buffer.from(serializedMessage), messageProperties);

          Logger.log(`Message: ${serializedMessage} sent with exchange name "${exchangeName}"`);

          publishedMessages.push(exchangeName);

          span.setAttributes({
            exchange: exchangeName,
            messageId,
            traceId,
            useEnvelope
          });
          span.end();
        },
        {
          retries: configs.retry.count,
          factor: configs.retry.factor,
          minTimeout: configs.retry.minTimeout,
          maxTimeout: configs.retry.maxTimeout
        }
      );
    } catch (error) {
      Logger.error(error);
      await this.rabbitMQConnection.closeChanel();
    }
  }

  async isPublished<T>(message: T): Promise<boolean> {
    const exchangeName = snakeCase(getTypeName(message));

    return Promise.resolve(publishedMessages.includes(exchangeName));
  }
}
