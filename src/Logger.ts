// Imports the Google Cloud client library for Bunyan
import bunyan from 'bunyan';
import { LoggingBunyan } from '@google-cloud/logging-bunyan';


export class StackdriverLog {
  protected logger: bunyan;

  constructor(logLevel: string) {
    const loggingBunyan = new LoggingBunyan({

    });
    this.logger = bunyan.createLogger({
      // The JSON payload of the log as it appears in Stackdriver Logging
      // will contain "name": "my-service"
      name: 'my-service',
      streams: [
        { stream: process.stdout, level: logLevel as any },
        loggingBunyan.stream(logLevel as any)
      ]
    });
  }

  debug(...args: any): void {
    this.logger.debug(args);
  }

  trace(...args: any): void {
    this.logger.trace(args);
  }

  verbose(...args: any): void {
    this.logger.trace(args);
  }

  info(...args: any): void {
    this.logger.info(args);
  }

  warn(...args: any): void {
    this.logger.warn(args);
  }

  error(...args: any): void {
    this.logger.error(args);
  }

  event(type: string, context?: any): void {
    this.logger.info({
      type,
      context
    });
  }
}
