import { Injectable, Logger } from '@nestjs/common';
import { RabbitmqConnection } from './rabbitmq-connection';
import { getTypeName } from '../utils/reflection';
import { snakeCase } from 'lodash';
import { deserializeObject, serializeObject } from '../utils/serilization';
import { sleep } from '../utils/time';
import configs from '../configs/configs';
import asyncRetry from 'async-retry';
import { OtelDiagnosticsProvider } from '../openTelemetry/otel-diagnostics-provider';
import {
  isRabbitmqMessageEnvelope,
  RabbitmqMessageEnvelope,
  RabbitmqMessageEnvelopeDto
} from '../contracts/message-envelope.contract';
import { validateModel } from '../validation/validation.utils';
import { ClassConstructor } from 'class-transformer';

type MessageType<T> = T | ClassConstructor<T>;
type handlerFunc<T> = (
  queue: string,
  message: T,
  envelope?: RabbitmqMessageEnvelope<T> | null
) => Promise<void> | void;
const consumedMessages: string[] = [];

export interface IRabbitmqConsumer {
  consumeMessage<T>(type: MessageType<T>, handler: handlerFunc<T>): Promise<void>;
  isConsumed<T>(message: T): Promise<boolean>;
}

const getServiceIdentifier = (): string =>
  configs.serviceName || configs.opentelemetry.serviceName || 'unknown_service';

@Injectable()
export class RabbitmqConsumer<T> implements IRabbitmqConsumer {
  constructor(
    private readonly rabbitMQConnection: RabbitmqConnection,
    private readonly otelDiagnosticsProvider: OtelDiagnosticsProvider
  ) {}

  async consumeMessage<T>(type: MessageType<T>, handler: handlerFunc<T>): Promise<void> {
    try {
      await asyncRetry(
        async () => {
          const channel = await this.rabbitMQConnection.getChannel();
          const tracer = this.otelDiagnosticsProvider.getTracer();
          const exchangeName = snakeCase(getTypeName(type));
          const queueName = `${getServiceIdentifier()}.${exchangeName}`;
          const deadLetterExchangeName = `${exchangeName}.dlx`;
          const deadLetterQueueName = `${queueName}.dlq`;

          await channel.assertExchange(exchangeName, 'fanout', {
            durable: true
          });
          await channel.assertExchange(deadLetterExchangeName, 'direct', {
            durable: true
          });
          await channel.assertQueue(deadLetterQueueName, {
            durable: true
          });
          await channel.bindQueue(deadLetterQueueName, deadLetterExchangeName, queueName);

          const q = await channel.assertQueue(queueName, {
            durable: true,
            arguments: {
              'x-dead-letter-exchange': deadLetterExchangeName,
              'x-dead-letter-routing-key': queueName
            }
          });

          await channel.bindQueue(q.queue, exchangeName, '');
          await channel.prefetch(1);

          Logger.log(
            `Waiting for messages with exchange name "${exchangeName}" on queue "${q.queue}".`
          );

          await channel.consume(
            q.queue,
            async (message) => {
              if (message === null) {
                return;
              }

              const span = tracer.startSpan(`receive_message_${exchangeName}`);
              const messageContent = message.content.toString();
              const headers = message.properties.headers || {};

              try {
                const parsedMessage = this.parseIncomingMessage(type, messageContent);
                const deathCount = Array.isArray(headers['x-death']) ? headers['x-death'].length : 0;

                await handler(q.queue, parsedMessage.payload, parsedMessage.envelope);

                Logger.log(
                  `Message delivered to queue ${q.queue} with exchange ${exchangeName}: ${messageContent}`
                );
                channel.ack(message);
                consumedMessages.push(exchangeName);

                span.setAttributes({
                  queue: q.queue,
                  exchange: exchangeName,
                  legacyPayload: parsedMessage.isLegacy,
                  deathCount,
                  messageId:
                    parsedMessage.envelope?.messageId || message.properties.messageId || 'unknown'
                });
              } catch (error) {
                Logger.error(
                  serializeObject({
                    exchange: exchangeName,
                    queue: q.queue,
                    messageId: message.properties.messageId,
                    content: messageContent,
                    error: error instanceof Error ? error.message : String(error)
                  })
                );

                channel.nack(message, false, false);
                span.recordException(error as Error);
              } finally {
                span.end();
              }
            },
            { noAck: false }
          );
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

  async isConsumed<T>(message: T): Promise<boolean> {
    const timeoutTime = 30000;
    const startTime = Date.now();
    let timeOutExpired = false;
    let isConsumed = false;

    while (true) {
      if (timeOutExpired) {
        return false;
      }
      if (isConsumed) {
        return true;
      }

      await sleep(2000);

      const exchangeName = snakeCase(getTypeName(message));

      isConsumed = consumedMessages.includes(exchangeName);
      timeOutExpired = Date.now() - startTime > timeoutTime;
    }
  }

  private parseIncomingMessage<T>(type: MessageType<T>, content: string): {
    payload: T;
    envelope: RabbitmqMessageEnvelope<T> | null;
    isLegacy: boolean;
  } {
    const rawMessage = deserializeObject<Record<string, unknown>>(content);
    const messageClass = this.getMessageClass(type);

    if (isRabbitmqMessageEnvelope(rawMessage)) {
      const envelope = validateModel(RabbitmqMessageEnvelopeDto, rawMessage);
      const payload = validateModel(messageClass, envelope.payload);

      return {
        payload,
        envelope: {
          ...envelope,
          payload
        },
        isLegacy: false
      };
    }

    const payload = validateModel(messageClass, rawMessage);

    return {
      payload,
      envelope: null,
      isLegacy: true
    };
  }

  private getMessageClass<T>(type: MessageType<T>): ClassConstructor<T> {
    if (typeof type === 'function') {
      return type as ClassConstructor<T>;
    }

    return (type as T & { constructor: ClassConstructor<T> }).constructor;
  }
}
