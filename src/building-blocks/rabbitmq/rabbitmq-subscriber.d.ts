import { RabbitmqConnection } from './rabbitmq-connection';
import { OtelDiagnosticsProvider } from '../openTelemetry/otel-diagnostics-provider';
import { RabbitmqMessageEnvelope } from '../contracts/message-envelope.contract';
import { ClassConstructor } from 'class-transformer';
type MessageType<T> = T | ClassConstructor<T>;
type handlerFunc<T> = (queue: string, message: T, envelope?: RabbitmqMessageEnvelope<T> | null) => Promise<void> | void;
export interface IRabbitmqConsumer {
    consumeMessage<T>(type: MessageType<T>, handler: handlerFunc<T>): Promise<void>;
    isConsumed<T>(message: T): Promise<boolean>;
}
export declare class RabbitmqConsumer<T> implements IRabbitmqConsumer {
    private readonly rabbitMQConnection;
    private readonly otelDiagnosticsProvider;
    constructor(rabbitMQConnection: RabbitmqConnection, otelDiagnosticsProvider: OtelDiagnosticsProvider);
    consumeMessage<T>(type: MessageType<T>, handler: handlerFunc<T>): Promise<void>;
    isConsumed<T>(message: T): Promise<boolean>;
    private parseIncomingMessage;
    private getMessageClass;
}
export {};
