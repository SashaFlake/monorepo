import type { Repository } from './repository.js';
import type { Device } from '../model/device.js';
import type { DeviceSerialNumber, Udid } from '../model/value-objects.js';
import type { DomainError } from '../error/domain-error.js';
import type { Result } from '../result.js';

export interface DeviceRepositoryPort extends Repository<Device> {
  findBySerialNumber(serialNumber: DeviceSerialNumber): Promise<Result<Device | null, DomainError>>;
  findByUdid(udid: Udid): Promise<Result<Device | null, DomainError>>;
  findByGroupId(groupId: string): Promise<Result<Device[], DomainError>>;
}

export const DEVICE_REPOSITORY = Symbol('DeviceRepositoryPort');
