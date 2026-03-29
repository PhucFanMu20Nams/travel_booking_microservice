import { Injectable, ConsoleLogger, LoggerService, LogLevel } from '@nestjs/common';
import { SeverityNumber } from '@opentelemetry/api-logs';
import { logs } from '@opentelemetry/api-logs';
import configs from '../configs/configs';

@Injectable()
export class OtelLogger implements LoggerService {
  private readonly consoleLogger = new ConsoleLogger('OtelLogger');

  debug(message: any, ...optionalParams: any[]): void {
    this.logWithOtel(SeverityNumber.DEBUG, 'DEBUG', message, optionalParams);
  }

  verbose(message: any, ...optionalParams: any[]): void {
    this.logWithOtel(SeverityNumber.TRACE, 'VERBOSE', message, optionalParams);
  }

  log(message: any, ...optionalParams: any[]): void {
    this.logWithOtel(SeverityNumber.INFO, 'INFO', message, optionalParams);
  }

  warn(message: any, ...optionalParams: any[]): void {
    this.logWithOtel(SeverityNumber.WARN, 'WARN', message, optionalParams);
  }

  error(message: any, ...optionalParams: any[]): void {
    this.logWithOtel(SeverityNumber.ERROR, 'ERROR', message, optionalParams);
  }

  fatal(message: any, ...optionalParams: any[]): void {
    this.logWithOtel(SeverityNumber.FATAL, 'FATAL', message, optionalParams);
  }

  setLogLevels(_levels: LogLevel[]): void {
    // Optional: implement filtering if needed
  }


  private logWithOtel(
    severityNumber: SeverityNumber,
    severityText: string,
    message: any,
    optionalParams: any[] = []
  ): void {
    const formattedMessage = this.formatMessage(message, optionalParams);

    // Use Nest Logger for console output
    switch (severityText) {
      case 'ERROR':
        this.consoleLogger.error(formattedMessage, ...optionalParams);
        break;
      case 'WARN':
        this.consoleLogger.warn(formattedMessage, ...optionalParams);
        break;
      case 'DEBUG':
        this.consoleLogger.debug(formattedMessage, ...optionalParams);
        break;
      case 'VERBOSE':
        this.consoleLogger.verbose(formattedMessage, ...optionalParams);
        break;
      case 'FATAL':
        this.consoleLogger.error(`[FATAL] ${formattedMessage}`, ...optionalParams);
        break;
      default:
        this.consoleLogger.log(formattedMessage, ...optionalParams);
    }

    // OTLP export
    this.emit(severityNumber, severityText, message, optionalParams);
  }

  private formatMessage(message: any, optionalParams: any[]): string {
    let msgText =
      message instanceof Error
        ? `${message.message}\n${message.stack}`
        : typeof message === 'string'
          ? message
          : JSON.stringify(message);

    if (optionalParams?.length > 0) {
      msgText +=
        ' ' +
        optionalParams
          .map((param) =>
            param instanceof Error
              ? `${param.message}\n${param.stack}`
              : typeof param === 'string'
                ? param
                : JSON.stringify(param)
          )
          .join(' ');
    }
    return msgText;
  }

  private emit(
    severityNumber: SeverityNumber,
    severityText: string,
    message: any,
    optionalParams: any[]
  ): void {
    try {
      const logger = logs.getLogger(
        configs.opentelemetry?.serviceName || 'default-service',
        configs.opentelemetry?.serviceVersion || '1.0.0'
      );

      const body = this.formatMessage(message, optionalParams);

      // Structured attributes
      const attributes = optionalParams.reduce(
        (attrs, param, idx) => {
          if (param === null || param === undefined) {
            attrs[`meta_${idx}`] = 'null';
          } else if (param instanceof Error) {
            attrs[`meta_${idx}`] = `${param.message}\n${param.stack}`;
          } else if (typeof param === 'object') {
            Object.entries(param).forEach(([k, v]) => {
              attrs[k] =
                v === null || v === undefined
                  ? 'null'
                  : typeof v === 'object'
                    ? JSON.stringify(v)
                    : String(v);
            });
          } else {
            attrs[`meta_${idx}`] = String(param);
          }
          return attrs;
        },
        {} as Record<string, string>
      );

      logger.emit({
        severityNumber,
        severityText,
        body,
        attributes
      });
    } catch (err) {
      this.consoleLogger.error('OpenTelemetry log emission failed:', err);
    }
  }
}
