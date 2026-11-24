import fs from 'fs';
import path from 'path';

function createSolidPngBuffer(width, height, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(2, 9); // color type (RGB)
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);

    let c = 0xffffffff;
    const typeAndData = buf.subarray(4, 8 + len);
    for (let i = 0; i < typeAndData.length; i++) {
      c ^= typeAndData[i];
      for (let k = 0; k < 8; k++) {
        c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
    }
    buf.writeUInt32BE((c ^ 0xffffffff) >>> 0, 8 + len);
    return buf;
  }

  const scanlines = [];
  for (let y = 0; y < height; y++) {
    scanlines.push(0);
    for (let x = 0; x < width; x++) {
      scanlines.push(r, g, b);
    }
  }

  const rawData = Buffer.from(scanlines);
  const zlibHeader = Buffer.from([0x78, 0x01]);
  const blocks = [];
  let offset = 0;
  while (offset < rawData.length) {
    const end = Math.min(offset + 65535, rawData.length);
    const chunk = rawData.subarray(offset, end);
    const isLast = end === rawData.length ? 1 : 0;
    const blockHeader = Buffer.alloc(5);
    blockHeader.writeUInt8(isLast, 0);
    blockHeader.writeUInt16LE(chunk.length, 1);
    blockHeader.writeUInt16LE(~chunk.length & 0xffff, 3);
    blocks.push(blockHeader);
    blocks.push(chunk);
    offset = end;
  }

  let a = 1, bVal = 0;
  for (let i = 0; i < rawData.length; i++) {
    a = (a + rawData[i]) % 65521;
    bVal = (bVal + a) % 65521;
  }
  const adler = Buffer.alloc(4);
  adler.writeUInt32BE(((bVal << 16) | a) >>> 0, 0);

  const idatData = Buffer.concat([zlibHeader, ...blocks, adler]);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.resolve('public/icons');
fs.mkdirSync(iconsDir, { recursive: true });

[16, 48, 128].forEach((size) => {
  const buf = createSolidPngBuffer(size, size, 14, 61, 47);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), buf);
  console.log(`Generated icon${size}.png`);
});
