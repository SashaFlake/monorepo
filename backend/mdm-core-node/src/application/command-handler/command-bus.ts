import 'reflect-metadata';
import { injectable } from 'tsyringe';
import type { Command, CommandHandler } from '@domain/command/index.js';
import type { DomainError } from '@domain/error/index.js';
import type { Result } from '@domain/result.js';

type AnyCommandHandler = CommandHandler<Command, unknown>;

@injectable()
export class CommandBus {
  private readonly handlers = new Map<string, AnyCommandHandler>();

  register<TCommand extends Command, TResult>(
    commandType: string,
    handler: CommandHandler<TCommand, TResult>,
  ): void {
    this.handlers.set(commandType, handler as AnyCommandHandler);
  }

  async execute<TCommand extends Command, TResult>(
    command: TCommand,
  ): Promise<Result<TResult, DomainError>> {
    const handler = this.handlers.get(command._type);
    if (!handler) {
      throw new Error(`No handler registered for command: ${command._type}`);
    }
    return handler.execute(command) as Promise<Result<TResult, DomainError>>;
  }
}
