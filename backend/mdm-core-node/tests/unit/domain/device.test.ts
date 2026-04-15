import { describe, it, expect } from 'vitest';
import { Device } from '../../../src/domain/model/device.js';
import { DeviceSerialNumber, Udid } from '../../../src/domain/model/value-objects.js';

const makeDevice = () => {
  const sn = DeviceSerialNumber.create('SN-TEST-001');
  const udid = Udid.create('UDID-TEST-DEVICE-001');
  if (sn.isErr() || udid.isErr()) throw new Error('VO creation failed');
  return Device.create({
    serialNumber: sn.value,
    udid: udid.value,
    platform: 'ios',
    model: 'iPhone 15 Pro',
    osVersion: '17.4',
  });
};

describe('Device', () => {
  it('creates with pending status', () => {
    const device = makeDevice();
    expect(device.status).toBe('pending');
    expect(device.enrolledAt).toBeNull();
  });

  it('enrolls from pending', () => {
    const device = makeDevice();
    const result = device.enroll();
    expect(result.isOk()).toBe(true);
    expect(device.status).toBe('enrolled');
    expect(device.enrolledAt).toBeInstanceOf(Date);
  });

  it('cannot enroll twice', () => {
    const device = makeDevice();
    device.enroll();
    const result = device.enroll();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('DEVICE_ALREADY_ENROLLED');
  });

  it('emits DeviceEnrolledEvent on enroll', () => {
    const device = makeDevice();
    device.enroll();
    const events = device.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.eventType).toBe('device.enrolled');
  });

  it('unenrolls an enrolled device', () => {
    const device = makeDevice();
    device.enroll();
    const result = device.unenroll();
    expect(result.isOk()).toBe(true);
    expect(device.status).toBe('unenrolled');
  });

  it('cannot unenroll a pending device', () => {
    const device = makeDevice();
    const result = device.unenroll();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('DEVICE_NOT_ENROLLED');
  });
});
