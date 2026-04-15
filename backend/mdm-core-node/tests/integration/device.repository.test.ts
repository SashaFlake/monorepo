/**
 * Интеграционные тесты PrismaDeviceRepository.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Device } from '@domain/model/device.js';
import type { DeviceSerialNumber, Udid } from '@domain/model/value-objects.js';
import { newEntityId } from '@domain/model/entity.js';
import {
  startPgContainer, stopPgContainer,
  createTestPrisma, cleanDatabase,
} from './helpers/index.js';
import type { TestPrismaContext } from './helpers/index.js';
import { PrismaDeviceRepository } from '@infrastructure/persistence/prisma/repositories/device.repository.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
let counter = 0;

const makeDevice = () => {
  counter++;
  return Device.create({
    serialNumber: `SN-${counter}-${newEntityId()}` as DeviceSerialNumber,
    udid:         `UDID-${counter}-${newEntityId()}` as Udid,
    platform:     'android',
    model:        'Pixel 8',
    osVersion:    '14.0',
  });
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
let ctx: TestPrismaContext;
let repo: PrismaDeviceRepository;

beforeAll(async () => {
  const url = await startPgContainer();
  ctx  = await createTestPrisma(url);
  repo = new PrismaDeviceRepository(ctx.prisma);
});

afterAll(async () => {
  await ctx.prisma.$disconnect();
  await stopPgContainer();
});

beforeEach(async () => {
  await cleanDatabase(ctx.prisma);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('PrismaDeviceRepository', () => {
  describe('save / findById', () => {
    it('сохраняет устройство и находит его по id', async () => {
      const device = makeDevice();
      await repo.save(device);

      const result = await repo.findById(device.id);
      expect(result.isOk()).toBe(true);
      const found = result._unsafeUnwrap();
      expect(found).not.toBeNull();
      expect(found!.id).toBe(device.id);
      expect(found!.status).toBe('pending');
      expect(found!.platform).toBe('android');
    });

    it('возвращает null если не найдено', async () => {
      const result = await repo.findById(newEntityId());
      expect(result._unsafeUnwrap()).toBeNull();
    });

    it('upsert обновляет статус после enroll()', async () => {
      const device = makeDevice();
      await repo.save(device);

      device.enroll();
      await repo.save(device);

      const found = (await repo.findById(device.id))._unsafeUnwrap();
      expect(found!.status).toBe('enrolled');
      expect(found!.enrolledAt).toBeInstanceOf(Date);
    });
  });

  describe('findBySerialNumber', () => {
    it('находит устройство по serialNumber', async () => {
      const device = makeDevice();
      await repo.save(device);

      const result = await repo.findBySerialNumber(device.serialNumber);
      expect(result._unsafeUnwrap()?.id).toBe(device.id);
    });

    it('возвращает null для несуществующего serialNumber', async () => {
      const result = await repo.findBySerialNumber('SN-UNKNOWN' as DeviceSerialNumber);
      expect(result._unsafeUnwrap()).toBeNull();
    });
  });

  describe('findByUdid', () => {
    it('находит устройство по udid', async () => {
      const device = makeDevice();
      await repo.save(device);

      const result = await repo.findByUdid(device.udid);
      expect(result._unsafeUnwrap()?.id).toBe(device.id);
    });
  });

  describe('findByGroupId', () => {
    it('возвращает устройства группы', async () => {
      const groupId = newEntityId();

      // Сохраняем groupId напрямую в БД (обходим FK на DeviceGroup)
      const d1 = makeDevice();
      const d2 = makeDevice();
      const d3 = makeDevice(); // другая группа

      await ctx.prisma.device.createMany({
        data: [
          { ...toRow(d1), groupId },
          { ...toRow(d2), groupId },
          { ...toRow(d3) },
        ],
      });

      const result = await repo.findByGroupId(groupId);
      expect(result.isOk()).toBe(true);
      const ids = result._unsafeUnwrap().map(d => d.id);
      expect(ids).toContain(d1.id);
      expect(ids).toContain(d2.id);
      expect(ids).not.toContain(d3.id);
    });
  });

  describe('delete', () => {
    it('удаляет устройство', async () => {
      const device = makeDevice();
      await repo.save(device);
      await repo.delete(device.id);

      const result = await repo.findById(device.id);
      expect(result._unsafeUnwrap()).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// Util: преобразовать Device в плоский объект для createMany
// ---------------------------------------------------------------------------
import { DeviceMapper } from '@infrastructure/persistence/prisma/mappers/device.mapper.js';
const toRow = (d: Device) => DeviceMapper.toPersistence(d);
