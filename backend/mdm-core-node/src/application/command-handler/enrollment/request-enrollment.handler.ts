import 'reflect-metadata';
import { injectable, inject } from 'tsyringe';
import { ok, err } from 'neverthrow';
import type { CommandHandler } from '@domain/command/index.js';
import type { DomainError } from '@domain/error/domain-error.js';
import { domainError } from '@domain/error/domain-error.js';
import type { Result } from '@domain/result.js';
import type { DeviceRepositoryPort } from '@domain/port/device.repository.port.js';
import { DEVICE_REPOSITORY } from '@domain/port/device.repository.port.js';
import type { TokenRepositoryPort } from '@domain/port/token.repository.port.js';
import { TOKEN_REPOSITORY } from '@domain/port/token.repository.port.js';
import type { NonceGeneratorPort } from '@domain/port/nonce.generator.port.js';
import { NONCE_GENERATOR } from '@domain/port/nonce.generator.port.js';
import { Token } from '@domain/model/token.js';
import type { TokenValue } from '@domain/model/value-objects.js';
import type { RequestEnrollmentCommand } from './request-enrollment.command.js';

/** Что возвращает хендлер: nonce для подписи сертификатом и TTL валидности. */
export interface RequestEnrollmentResult {
  /** Hex-строка. Устройство должно подписать её своим сертификатом и вернуть signed nonce. */
  nonce: string;
  /** Время истечения nonce (5 минут). */
  expiresAt: Date;
}

/** Длина nonce в байтах (256-бит, отповечает Android Keystore / Apple CryptoKit). */
const NONCE_BYTES = 32;
/** TTL nonce: 5 минут — достаточно для ручной отправки, недостаточно для replay-атаки. */
const NONCE_TTL_SECONDS = 5 * 60;

@injectable()
export class RequestEnrollmentHandler
  implements CommandHandler<RequestEnrollmentCommand, RequestEnrollmentResult>
{
  constructor(
    @inject(DEVICE_REPOSITORY)  private readonly devices: DeviceRepositoryPort,
    @inject(TOKEN_REPOSITORY)   private readonly tokens: TokenRepositoryPort,
    @inject(NONCE_GENERATOR)    private readonly nonceGen: NonceGeneratorPort,
  ) {}

  async execute(
    cmd: RequestEnrollmentCommand,
  ): Promise<Result<RequestEnrollmentResult, DomainError>> {

    // 1. Проверяем enrollment-токен
    const tokenResult = await this.tokens.findByValue(cmd.enrollmentToken);
    if (tokenResult.isErr()) return err(tokenResult.error);

    const token = tokenResult.value;
    if (!token)
      return err(domainError('TOKEN_NOT_FOUND', 'Enrollment token not found'));
    if (!token.isValid())
      return err(domainError('TOKEN_NOT_ACTIVE', 'Enrollment token is expired or already used'));
    if (token.purpose !== 'enrollment')
      return err(domainError('TOKEN_WRONG_PURPOSE', 'Provided token is not an enrollment token'));

    // 2. Находим устройство
    const deviceResult = await this.devices.findById(cmd.deviceId);
    if (deviceResult.isErr()) return err(deviceResult.error);

    const device = deviceResult.value;
    if (!device)
      return err(domainError('DEVICE_NOT_FOUND', 'Device not found', { deviceId: cmd.deviceId }));
    if (device.status !== 'pending')
      return err(domainError('DEVICE_INVALID_STATE',
        'Device is not in pending state', { status: device.status }));

    // 3. Генерируем nonce
    const nonceResult = await this.nonceGen.generate(NONCE_BYTES);
    if (nonceResult.isErr()) return err(nonceResult.error);
    const nonce = nonceResult.value;

    // 4. Сохраняем nonce как Token(purpose=certificate_challenge)
    //    чтобы на следующем шаге VerifyCertificateHandler мог проверить signed nonce
    const nonceToken = Token.issue({
      value:      nonce as TokenValue,
      purpose:    'certificate_challenge' as never, // будет добавлено в TOKEN_PURPOSES
      issuedToId: device.id,
      ttlSeconds: NONCE_TTL_SECONDS,
    });
    const saveResult = await this.tokens.save(nonceToken);
    if (saveResult.isErr()) return err(saveResult.error);

    return ok({ nonce, expiresAt: nonceToken.expiresAt });
  }
}
