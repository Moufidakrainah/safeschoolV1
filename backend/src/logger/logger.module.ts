// =============================================================
// logger.module.ts — Module NestJS du système de logging
//
// Ce module est importé dans AppModule et exporte LoggerService
// pour qu'il soit injectabledans tous les autres modules.
// =============================================================

import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';

// @Global() permet à LoggerService d'être injecté partout
// sans avoir à importer LoggerModule dans chaque module
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
