import { PrismaClient } from '@prisma/client';
import { injectable } from 'tsyringe';

let instance: PrismaClient | null = null;

@injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      log: process.env['NODE_ENV'] === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    });
  }

  static getInstance(): PrismaService {
    if (!instance) {
      instance = new PrismaService();
    }
    return instance as PrismaService;
  }
}
