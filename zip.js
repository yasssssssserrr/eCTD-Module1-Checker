/* Minimal dependency-free ZIP writer for empty eCTD folder structures. */
(function attachEctdZip(global) {
  'use strict';

  const encoder = new TextEncoder();

  function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    for (const byte of bytes) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit += 1) {
        crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
      }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function dosDateTime(date) {
    const safeDate = date instanceof Date && !Number.isNaN(date.valueOf()) ? date : new Date();
    const year = Math.max(1980, safeDate.getFullYear());
    return {
      time: (safeDate.getHours() << 11) | (safeDate.getMinutes() << 5) | Math.floor(safeDate.getSeconds() / 2),
      date: ((year - 1980) << 9) | ((safeDate.getMonth() + 1) << 5) | safeDate.getDate(),
    };
  }

  function writeUint16(target, offset, value) {
    target[offset] = value & 0xFF;
    target[offset + 1] = (value >>> 8) & 0xFF;
  }

  function writeUint32(target, offset, value) {
    target[offset] = value & 0xFF;
    target[offset + 1] = (value >>> 8) & 0xFF;
    target[offset + 2] = (value >>> 16) & 0xFF;
    target[offset + 3] = (value >>> 24) & 0xFF;
  }

  function concat(parts) {
    const length = parts.reduce((sum, part) => sum + part.length, 0);
    const result = new Uint8Array(length);
    let offset = 0;
    parts.forEach(part => {
      result.set(part, offset);
      offset += part.length;
    });
    return result;
  }

  function normalizePaths(paths) {
    const directories = new Set();
    paths.forEach(path => {
      if (/^(?:[/\\]|[a-z]:)|(?:^|[/\\])\.\.(?:[/\\]|$)|\u0000/i.test(String(path))) {
        throw new Error('Unsafe archive path.');
      }
      const segments = String(path)
        .replace(/\\/g, '/')
        .split('/')
        .filter(segment => segment && segment !== '.' && segment !== '..');
      for (let depth = 1; depth <= segments.length; depth += 1) {
        directories.add(`${segments.slice(0, depth).join('/')}/`);
      }
    });
    return [...directories].sort((left, right) => left.localeCompare(right));
  }

  function createFolderZip(paths, modifiedAt = new Date(), files = {}) {
    const normalizedPaths = normalizePaths(paths);
    const entries = normalizedPaths.map(path => ({ path, data: new Uint8Array(0), directory: true }));
    for (const [path, content] of Object.entries(files)) {
      if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(path)) throw new Error('Unsafe archive filename.');
      entries.push({ path, data: encoder.encode(String(content)), directory: false });
    }
    const localParts = [];
    const centralParts = [];
    const { time, date } = dosDateTime(modifiedAt);
    let localOffset = 0;

    entries.forEach(({ path, data, directory }) => {
      const name = encoder.encode(path);
      const checksum = crc32(data);

      const localHeader = new Uint8Array(30);
      writeUint32(localHeader, 0, 0x04034B50);
      writeUint16(localHeader, 4, 20);
      writeUint16(localHeader, 6, 0x0800);
      writeUint16(localHeader, 8, 0);
      writeUint16(localHeader, 10, time);
      writeUint16(localHeader, 12, date);
      writeUint32(localHeader, 14, checksum);
      writeUint32(localHeader, 18, data.length);
      writeUint32(localHeader, 22, data.length);
      writeUint16(localHeader, 26, name.length);
      writeUint16(localHeader, 28, 0);
      localParts.push(localHeader, name, data);

      const centralHeader = new Uint8Array(46);
      writeUint32(centralHeader, 0, 0x02014B50);
      writeUint16(centralHeader, 4, 20);
      writeUint16(centralHeader, 6, 20);
      writeUint16(centralHeader, 8, 0x0800);
      writeUint16(centralHeader, 10, 0);
      writeUint16(centralHeader, 12, time);
      writeUint16(centralHeader, 14, date);
      writeUint32(centralHeader, 16, checksum);
      writeUint32(centralHeader, 20, data.length);
      writeUint32(centralHeader, 24, data.length);
      writeUint16(centralHeader, 28, name.length);
      writeUint16(centralHeader, 30, 0);
      writeUint16(centralHeader, 32, 0);
      writeUint16(centralHeader, 34, 0);
      writeUint16(centralHeader, 36, 0);
      writeUint32(centralHeader, 38, directory ? 0x10 : 0x20);
      writeUint32(centralHeader, 42, localOffset);
      centralParts.push(centralHeader, name);

      localOffset += localHeader.length + name.length + data.length;
    });

    const localData = concat(localParts);
    const centralDirectory = concat(centralParts);
    const end = new Uint8Array(22);
    writeUint32(end, 0, 0x06054B50);
    writeUint16(end, 4, 0);
    writeUint16(end, 6, 0);
    writeUint16(end, 8, entries.length);
    writeUint16(end, 10, entries.length);
    writeUint32(end, 12, centralDirectory.length);
    writeUint32(end, 16, localData.length);
    writeUint16(end, 20, 0);

    return concat([localData, centralDirectory, end]);
  }

  global.EctdZip = Object.freeze({ createFolderZip, normalizePaths, crc32 });
})(globalThis);
