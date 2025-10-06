import { describe, it, expect } from 'vitest';
import { OUILookup } from '../OUILookup';

describe('OUILookup', () => {
  const lookup = new OUILookup();

  it('should identify Apple devices', () => {
    expect(lookup.getManufacturer('F0:EE:7A:12:34:56')).toBe('Apple, Inc.');
    expect(lookup.getManufacturer('58:AD:12:AB:CD:EF')).toBe('Apple, Inc.');
  });

  it('should identify Samsung devices', () => {
    expect(lookup.getManufacturer('64:1B:2F:11:22:33')).toBe('Samsung Electronics Co.,Ltd');
  });

  it('should identify Huawei devices', () => {
    expect(lookup.getManufacturer('E0:06:30:AA:BB:CC')).toBe('HUAWEI TECHNOLOGIES CO.,LTD');
  });

  it('should identify Cisco devices', () => {
    expect(lookup.getManufacturer('E8:0A:B9:12:34:56')).toBe('Cisco Systems, Inc');
  });

  it('should identify Espressif (ESP32) devices', () => {
    expect(lookup.getManufacturer('10:06:1C:12:34:56')).toBe('Espressif Inc.');
    expect(lookup.getManufacturer('D4:8A:FC:AB:CD:EF')).toBe('Espressif Inc.');
  });

  it('should identify Raspberry Pi devices', () => {
    expect(lookup.getManufacturer('D8:3A:DD:12:34:56')).toBe('Raspberry Pi Trading Ltd');
  });

  it('should handle different MAC address formats', () => {
    // Colon-separated
    expect(lookup.getManufacturer('F0:EE:7A:12:34:56')).toBe('Apple, Inc.');
    // Hyphen-separated
    expect(lookup.getManufacturer('F0-EE-7A-12-34-56')).toBe('Apple, Inc.');
    // Dot-separated
    expect(lookup.getManufacturer('F0.EE.7A.12.34.56')).toBe('Apple, Inc.');
    // No separator
    expect(lookup.getManufacturer('F0EE7A123456')).toBe('Apple, Inc.');
  });

  it('should handle lowercase MAC addresses', () => {
    expect(lookup.getManufacturer('f0:ee:7a:12:34:56')).toBe('Apple, Inc.');
  });

  it('should return "Unknown" for unrecognized OUIs', () => {
    expect(lookup.getManufacturer('FF:FF:FF:12:34:56')).toBe('Unknown');
    expect(lookup.getManufacturer('00:00:00:12:34:56')).toBe('Unknown');
  });

  it('should return "Unknown" for invalid input', () => {
    expect(lookup.getManufacturer('')).toBe('Unknown');
    expect(lookup.getManufacturer('12:34')).toBe('Unknown');
  });

  it('should check if manufacturer is known', () => {
    expect(lookup.isKnownManufacturer('F0:EE:7A:12:34:56')).toBe(true);
    expect(lookup.isKnownManufacturer('FF:FF:FF:12:34:56')).toBe(false);
  });

  it('should return database size', () => {
    expect(lookup.getDatabaseSize()).toBeGreaterThan(0);
  });
});
