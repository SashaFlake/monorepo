import 'reflect-metadata';
import { container } from 'tsyringe';
import { PrismaService } from '@infrastructure/persistence/prisma/index.js';
import { CommandBus } from '@application/command-handler/index.js';
import { TOKENS } from './tokens.js';

container.registerSingleton(TOKENS.PrismaService, PrismaService);
container.registerSingleton(TOKENS.CommandBus,    CommandBus);

// Register command handlers here:
// container.register('CreateFooHandler', { useClass: CreateFooCommandHandler });
// commandBus.register('CreateFoo', container.resolve('CreateFooHandler'));

export { container };
