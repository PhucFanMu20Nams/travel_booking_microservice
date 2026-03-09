"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitmqPublisher = void 0;
const common_1 = require("@nestjs/common");
const rabbitmq_connection_1 = require("./rabbitmq-connection");
const serilization_1 = require("../utils/serilization");
const reflection_1 = require("../utils/reflection");
const lodash_1 = require("lodash");
const uuid_1 = require("uuid");
const configs_1 = __importDefault(require("../configs/configs"));
const async_retry_1 = __importDefault(require("async-retry"));
const otel_diagnostics_provider_1 = require("../openTelemetry/otel-diagnostics-provider");
const message_envelope_contract_1 = require("../contracts/message-envelope.contract");
const publishedMessages = [];
const getServiceIdentifier = () => configs_1.default.serviceName || configs_1.default.opentelemetry.serviceName || 'unknown_service';
let RabbitmqPublisher = class RabbitmqPublisher {
    rabbitMQConnection;
    otelDiagnosticsProvider;
    constructor(rabbitMQConnection, otelDiagnosticsProvider) {
        this.rabbitMQConnection = rabbitMQConnection;
        this.otelDiagnosticsProvider = otelDiagnosticsProvider;
    }
    async publishMessage(message, options = {}) {
        try {
            await (0, async_retry_1.default)(async () => {
                const channel = await this.rabbitMQConnection.getChannel();
                const tracer = this.otelDiagnosticsProvider.getTracer();
                const exchangeName = (0, lodash_1.snakeCase)((0, reflection_1.getTypeName)(message));
                const span = tracer.startSpan(`publish_message_${exchangeName}`);
                const messageId = (0, uuid_1.v4)().toString();
                const traceId = span.spanContext().traceId || messageId;
                const useEnvelope = options.useEnvelope ?? configs_1.default.rabbitmq.useEnvelope;
                const payload = useEnvelope
                    ? (0, message_envelope_contract_1.createRabbitmqMessageEnvelope)(message, {
                        messageId,
                        traceId,
                        producer: getServiceIdentifier()
                    })
                    : message;
                const serializedMessage = (0, serilization_1.serializeObject)(payload);
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
                common_1.Logger.log(`Message: ${serializedMessage} sent with exchange name "${exchangeName}"`);
                publishedMessages.push(exchangeName);
                span.setAttributes({
                    exchange: exchangeName,
                    messageId,
                    traceId,
                    useEnvelope
                });
                span.end();
            }, {
                retries: configs_1.default.retry.count,
                factor: configs_1.default.retry.factor,
                minTimeout: configs_1.default.retry.minTimeout,
                maxTimeout: configs_1.default.retry.maxTimeout
            });
        }
        catch (error) {
            common_1.Logger.error(error);
            await this.rabbitMQConnection.closeChanel();
        }
    }
    async isPublished(message) {
        const exchangeName = (0, lodash_1.snakeCase)((0, reflection_1.getTypeName)(message));
        return Promise.resolve(publishedMessages.includes(exchangeName));
    }
};
exports.RabbitmqPublisher = RabbitmqPublisher;
exports.RabbitmqPublisher = RabbitmqPublisher = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rabbitmq_connection_1.RabbitmqConnection,
        otel_diagnostics_provider_1.OtelDiagnosticsProvider])
], RabbitmqPublisher);
//# sourceMappingURL=rabbitmq-publisher.js.map