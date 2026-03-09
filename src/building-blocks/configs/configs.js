"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const joi_1 = __importDefault(require("joi"));
const nodeEnv = process.env.NODE_ENV || 'development';
dotenv_1.default.config({ path: path_1.default.join(process.cwd(), `.env.${nodeEnv}`) });
dotenv_1.default.config({ override: true });
const envVarsSchema = joi_1.default.object()
    .keys({
    NODE_ENV: joi_1.default.string().required(),
    SERVICE_NAME: joi_1.default.string(),
    PORT: joi_1.default.number().default(3000),
    JWT_SECRET: joi_1.default.string().trim().min(16).required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: joi_1.default.number()
        .default(30)
        .description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: joi_1.default.number()
        .integer()
        .min(1)
        .default(1)
        .description('days after which refresh tokens expire'),
    IDENTITY_SERVICE_BASE_URL: joi_1.default.string()
        .uri({ scheme: ['http', 'https'] })
        .default('http://localhost:3333')
        .description('Identity service base URL for access-token introspection'),
    POSTGRES_HOST: joi_1.default.string().default('localhost').description('Postgres host'),
    POSTGRES_PORT: joi_1.default.number().default(5432).description('Postgres host'),
    POSTGRES_USERNAME: joi_1.default.string().default('postgres').description('Postgres username'),
    POSTGRES_PASSWORD: joi_1.default.string().default('postgres').description('Postgres password'),
    POSTGRES_Database: joi_1.default.string()
        .default('default_database')
        .description('Postgres database name'),
    POSTGRES_SYNCHRONIZE: joi_1.default.boolean()
        .default(false)
        .description('Synchronize if true it dosent use migrations'),
    POSTGRES_AUTO_LOAD_ENTITIES: joi_1.default.boolean()
        .default(true)
        .description('For loading all entities automatically'),
    POSTGRES_ENTITIES: joi_1.default.string().description('Postgres entities'),
    POSTGRES_MIGRATIONS: joi_1.default.string().description('Postgres migrations'),
    POSTGRES_LOGGING: joi_1.default.boolean().default(false).description('Postgres logging'),
    POSTGRES_MIGRATIONS_RUN: joi_1.default.boolean()
        .default(false)
        .description('Run migrations after running project'),
    POSTGRES_SSL: joi_1.default.boolean().default(false).description('Use SSL for Postgres connection'),
    POSTGRES_SSL_REJECT_UNAUTHORIZED: joi_1.default.boolean()
        .default(true)
        .description('Reject unauthorized SSL certificates'),
    RABBITMQ_Host: joi_1.default.string().default('localhost').description('Rabbitmq host'),
    RABBITMQ_PORT: joi_1.default.number().default(5672).description('Rabbitmq port'),
    RABBITMQ_USERNAME: joi_1.default.string().default('guest').description('Rabbitmq username'),
    RABBITMQ_PASSWORD: joi_1.default.string().default('guest').description('Rabbitmq password'),
    RABBITMQ_EXCHANGE: joi_1.default.string().description('Rabbitmq exchange'),
    RABBITMQ_USE_MESSAGE_ENVELOPE: joi_1.default.boolean()
        .default(false)
        .description('Publish events using the shared message envelope'),
    RETRY_COUNT: joi_1.default.number().default(3).description('Number of retries'),
    RETRY_FACTOR: joi_1.default.number().default(2).description('Exponential backoff factor'),
    RETRY_MIN_TIMEOUT: joi_1.default.number()
        .default(1000)
        .description('Minimum time before retrying (1 second)'),
    RETRY_MAX_TIMEOUT: joi_1.default.number()
        .default(60000)
        .description('Maximum time before retrying (60 seconds)'),
    OPEN_TELEMETRY_COLLECTOR_URL: joi_1.default.string()
        .default('http://localhost:4317')
        .description('Collector URL'),
    OPEN_TELEMETRY_SERVICE_VERSION: joi_1.default.string().default("1.0.0").description('Service Version'),
    OPEN_TELEMETRY_SERVICE_NAME: joi_1.default.string()
        .default('default_service_name')
        .description('Service Name')
})
    .unknown();
const { value: envVars, error } = envVarsSchema
    .prefs({ errors: { label: 'key' } })
    .validate(process.env);
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}
exports.default = {
    env: envVars.NODE_ENV,
    serviceName: envVars.SERVICE_NAME,
    port: envVars.PORT,
    rabbitmq: {
        host: envVars.RABBITMQ_Host,
        port: envVars.RABBITMQ_PORT,
        username: envVars.RABBITMQ_USERNAME,
        password: envVars.RABBITMQ_PASSWORD,
        exchange: envVars.RABBITMQ_EXCHANGE,
        useEnvelope: envVars.RABBITMQ_USE_MESSAGE_ENVELOPE
    },
    postgres: {
        host: envVars.POSTGRES_HOST,
        port: envVars.POSTGRES_PORT,
        username: envVars.POSTGRES_USERNAME,
        password: envVars.POSTGRES_PASSWORD,
        database: envVars.POSTGRES_Database,
        synchronize: envVars.POSTGRES_SYNCHRONIZE,
        autoLoadEntities: envVars.POSTGRES_AUTO_LOAD_ENTITIES,
        entities: envVars.POSTGRES_ENTITIES,
        migrations: envVars.POSTGRES_MIGRATIONS,
        logging: envVars.POSTGRES_LOGGING,
        migrationsRun: envVars.POSTGRES_MIGRATIONS_RUN,
        ssl: envVars.POSTGRES_SSL,
        sslRejectUnauthorized: envVars.POSTGRES_SSL_REJECT_UNAUTHORIZED
    },
    jwt: {
        secret: envVars.JWT_SECRET,
        accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
        refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS
    },
    identity: {
        serviceBaseUrl: envVars.IDENTITY_SERVICE_BASE_URL
    },
    retry: {
        count: envVars.RETRY_COUNT,
        factor: envVars.RETRY_FACTOR,
        minTimeout: envVars.RETRY_MIN_TIMEOUT,
        maxTimeout: envVars.RETRY_MAX_TIMEOUT
    },
    opentelemetry: {
        serviceName: envVars.OPEN_TELEMETRY_SERVICE_NAME,
        serviceVersion: envVars.OPEN_TELEMETRY_SERVICE_VERSION,
        collectorUrl: envVars.OPEN_TELEMETRY_COLLECTOR_URL
    }
};
//# sourceMappingURL=configs.js.map