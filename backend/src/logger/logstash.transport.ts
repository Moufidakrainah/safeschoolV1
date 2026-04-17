import * as net from 'net';
import TransportStream, { TransportStreamOptions } from 'winston-transport';

interface LogstashTransportOptions extends TransportStreamOptions {
  host: string;
  port: number;
}

export class LogstashTransport extends TransportStream {
  private readonly host: string;
  private readonly port: number;
  private client: net.Socket | null = null;
  private connected = false;
  private buffer: string[] = [];

  constructor(opts: LogstashTransportOptions) {
    super(opts);
    this.host = opts.host;
    this.port = opts.port;
    this.connect();
  }

  private connect(): void {
    this.client = new net.Socket();
    this.client.connect(this.port, this.host, () => {
      this.connected = true;
      if (this.buffer.length > 0) {
        this.buffer.forEach((msg) => this.client!.write(msg));
        this.buffer = [];
      }
    });
    this.client.on('error', () => {
      this.connected = false;
      setTimeout(() => this.connect(), 5000);
    });
    this.client.on('close', () => { this.connected = false; });
  }

  log(info: any, callback: () => void): void {
    setImmediate(() => this.emit('logged', info));
    const message = JSON.stringify({
      ...info,
      application: 'safeschool-backend',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    }) + '\n';

    if (this.connected && this.client) {
      this.client.write(message);
    } else if (this.buffer.length < 100) {
      this.buffer.push(message);
    }
    callback();
  }
}
