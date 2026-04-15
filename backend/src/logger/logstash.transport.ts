// =============================================================
// logstash.transport.ts — Transport Winston personnalisé pour Logstash
//
// Ce fichier crée une connexion TCP vers Logstash et envoie
// chaque log en JSON sur une ligne.
//
// Si Logstash n'est pas disponible :
//   → Les logs sont mis en tampon (max 100)
//   → La connexion est retentée automatiquement toutes les 5 secondes
// =============================================================

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

  // Tampon pour stocker les logs si Logstash n'est pas encore disponible
  private buffer: string[] = [];

  constructor(opts: LogstashTransportOptions) {
    super(opts);
    this.host = opts.host;
    this.port = opts.port;
    this.connect();
  }

  // Établit la connexion TCP vers Logstash
  private connect(): void {
    this.client = new net.Socket();

    this.client.connect(this.port, this.host, () => {
      this.connected = true;
      console.log(`[Logstash] Connecté à ${this.host}:${this.port}`);

      // Vide le tampon — envoie les logs mis en attente
      if (this.buffer.length > 0) {
        console.log(`[Logstash] Envoi de ${this.buffer.length} logs en tampon...`);
        this.buffer.forEach((msg) => this.client!.write(msg));
        this.buffer = [];
      }
    });

    // Si la connexion échoue, on réessaie dans 5 secondes
    this.client.on('error', () => {
      this.connected = false;
      setTimeout(() => this.connect(), 5000);
    });

    this.client.on('close', () => {
      this.connected = false;
    });
  }

  // Appelée par Winston pour chaque log à envoyer
  log(info: any, callback: () => void): void {
    setImmediate(() => this.emit('logged', info));

    // Construit le message JSON enrichi avec les métadonnées SafeSchool
    const message =
      JSON.stringify({
        ...info,
        application: 'safeschool-backend',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
      }) + '\n'; // json_lines : une ligne = un log

    if (this.connected && this.client) {
      // Connexion active → envoi immédiat
      this.client.write(message);
    } else {
      // Pas encore connecté → mise en tampon (max 100 messages)
      if (this.buffer.length < 100) {
        this.buffer.push(message);
      }
    }

    callback();
  }
}
