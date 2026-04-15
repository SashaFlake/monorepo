import 'reflect-metadata';
import { container } from 'tsyringe';
import { PrismaService } from '@infrastructure/persistence/prisma/index.js';
import { CommandBus } from '@application/command-handler/index.js';
import { CryptoNonceGenerator } from '@infrastructure/crypto/crypto-nonce-generator.js';
import { RequestEnrollmentHandler } from '@application/command-handler/enrollment/request-enrollment.handler.js';
import { REQUEST_ENROLLMENT } from '@application/command-handler/enrollment/request-enrollment.command.js';
import { DEVICE_REPOSITORY } from '@domain/port/device.repository.port.js';
import { TOKEN_REPOSITORY } from '@domain/port/token.repository.port.js';
import { NONCE_GENERATOR } from '@domain/port/nonce.generator.port.js';
import { PrismaDeviceRepository } from '@infrastructure/persistence/prisma/repositories/device.repository.js';
import { PrismaTokenRepository } from '@infrastructure/persistence/prisma/repositories/token.repository.js';
import { TOKENS } from './tokens.js';

// --- Infrastructure singletons ---
container.registerSingleton(TOKENS.PrismaService, PrismaService);
container.registerSingleton(TOKENS.CommandBus,    CommandBus);

// --- Domain port bindings ---
container.registerSingleton(DEVICE_REPOSITORY, PrismaDeviceRepository);
container.registerSingleton(TOKEN_REPOSITORY,  PrismaTokenRepository);
container.registerSingleton(NONCE_GENERATOR,   CryptoNonceGenerator);

// --- Command handlers ---
container.registerSingleton(RequestEnrollmentHandler, RequestEnrollmentHandler);

// Wire handlers into CommandBus after container is ready
const commandBus = container.resolve(CommandBus);
commandBus.register(
  REQUEST_ENROLLMENT,
  container.resolve(RequestEnrollmentHandler),
);

export { container };
