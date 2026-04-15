import { injectable, inject } from 'tsyringe';
import { ok, err } from 'neverthrow';
import type { PrismaClient } from '@prisma/client';
import type { DeviceRepositoryPort } from '@domain/port/device.repository.port.js';
import { DEVICE_REPOSITORY } from '@domain/port/device.repository.port.js';
import type { Device } from '@domain/model/device.js';
import type { DeviceSerialNumber, Udid } from '@domain/model/value-objects.js';
import type { EntityId } from '@domain/model/entity.js';
import type { DomainError } from '@domain/error/domain-error.js';
import { domainError } from '@domain/error/domain-error.js';
import type { Result } from '@domain/result.js';
import { DeviceMapper } from '../mappers/device.mapper.js';
import { PRISMA_CLIENT } from '../prisma-client.js';

@injectable()
export class PrismaDeviceRepository implements DeviceRepositoryPort {
  constructor(
    @inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
  ) {}

  async addDevice(device:Device): Promise<Result<Device, DomainError>> {
    return await this.save(device)
  }

  async findById(id: EntityId): Promise<Result<Device | null, DomainError>> {
    try {
      const row = await this.prisma.device.findUnique({ where: { id } });
      return ok(row ? DeviceMapper.toDomain(row) : null);
    } catch (e) {
      return err(domainError('REPOSITORY_ERROR', 'Failed to find device by id', { cause: e }));
    }
  }

  async findBySerialNumber(serialNumber: DeviceSerialNumber): Promise<Result<Device | null, DomainError>> {
    try {
      const row = await this.prisma.device.findUnique({ where: { serialNumber } });
      return ok(row ? DeviceMapper.toDomain(row) : null);
    } catch (e) {
      return err(domainError('REPOSITORY_ERROR', 'Failed to find device by serial number', { cause: e }));
    }
  }

  async findByUdid(udid: Udid): Promise<Result<Device | null, DomainError>> {
    try {
      const row = await this.prisma.device.findUnique({ where: { udid } });
      return ok(row ? DeviceMapper.toDomain(row) : null);
    } catch (e) {
      return err(domainError('REPOSITORY_ERROR', 'Failed to find device by udid', { cause: e }));
    }
  }

  async findByGroupId(groupId: string): Promise<Result<Device[], DomainError>> {
    try {
      const rows = await this.prisma.device.findMany({ where: { groupId } });
      return ok(rows.map(DeviceMapper.toDomain));
    } catch (e) {
      return err(domainError('REPOSITORY_ERROR', 'Failed to find devices by group', { cause: e }));
    }
  }

  async save(device: Device): Promise<Result<Device, DomainError>> {
    try {
      const data = DeviceMapper.toPersistence(device);
      const saved = await this.prisma.device.upsert({
        where:  { id: data.id },
        create: data,
        update: data,
      });
      return ok(DeviceMapper.toDomain(saved));
    } catch (e) {
      return err(domainError('REPOSITORY_ERROR', 'Failed to save device', { cause: e }));
    }
  }

  async delete(id: EntityId): Promise<Result<void, DomainError>> {
    try {
      await this.prisma.device.delete({ where: { id } });
      return ok(undefined);
    } catch (e) {
      return err(domainError('REPOSITORY_ERROR', 'Failed to delete device', { cause: e }));
    }
  }
}

export { DEVICE_REPOSITORY };
