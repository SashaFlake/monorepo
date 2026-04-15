import type { Device as PrismaDevice } from '@prisma/client';
import { Device } from '@domain/model/device.js';
import type { DeviceStatus } from '@domain/model/device.js';
import type { DeviceSerialNumber, Platform, Udid } from '@domain/model/value-objects.js';
import type { EntityId } from '@domain/model/entity.js';

export class DeviceMapper {
  static toDomain(row: PrismaDevice): Device {
    return Device.reconstitute({
      id:           row.id           as EntityId,
      serialNumber: row.serialNumber as DeviceSerialNumber,
      udid:         row.udid         as Udid,
      platform:     row.platform     as Platform,
      model:        row.model,
      osVersion:    row.osVersion,
      status:       row.status       as DeviceStatus,
      groupId:      (row.groupId     ?? null) as EntityId | null,
      lastSeenAt:   row.lastSeenAt   ?? null,
      enrolledAt:   row.enrolledAt   ?? null,
      createdAt:    row.createdAt,
      updatedAt:    row.updatedAt,
    });
  }

  static toPersistence(device: Device): PrismaDevice {
    return {
      id:           device.id,
      serialNumber: device.serialNumber,
      udid:         device.udid,
      platform:     device.platform,
      model:        device.model,
      osVersion:    device.osVersion,
      status:       device.status,
      groupId:      device.groupId   ?? null,
      lastSeenAt:   device.lastSeenAt ?? null,
      enrolledAt:   device.enrolledAt ?? null,
      createdAt:    device.createdAt,
      updatedAt:    device.updatedAt,
    };
  }
}
