import type { Repository } from './repository.js';
import type { DeviceGroup } from '../model/device-group.js';
import type { DomainError } from '../error/domain-error.js';
import type { Result } from '../result.js';

export interface DeviceGroupRepositoryPort extends Repository<DeviceGroup> {
  findByName(name: string): Promise<Result<DeviceGroup | null, DomainError>>;
  findAll(): Promise<Result<DeviceGroup[], DomainError>>;
}

export const DEVICE_GROUP_REPOSITORY = Symbol('DeviceGroupRepositoryPort');
