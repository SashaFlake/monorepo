import type { Result } from '../result.js';
import type { DomainError } from '../error/index.js';

/**
 * Marker interface for all commands.
 * Commands are plain data objects describing intent.
 */
export interface Command {
  readonly _type: string;
}

/**
 * Every command handler lives in the application layer,
 * but its contract is declared here in domain.
 */
export interface CommandHandler<TCommand extends Command, TResult> {
  execute(command: TCommand): Promise<Result<TResult, DomainError>>;
}
