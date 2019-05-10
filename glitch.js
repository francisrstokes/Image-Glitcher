#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const {promisify} = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

if (process.argv.length < 2+2) {
  console.log('Usage: glitch <filename> <out filename> <glitches per frame (default = 5)>');
}

const inFile = path.join(process.cwd(), process.argv[2]);
const outFile = (ind, tmpDir) => path.join('/tmp', tmpDir, `${ind}_glitched.jpg`);
const gifOutFile = path.join(process.cwd(), process.argv[3]);
const glitchesPerFrame = process.argv[4] ? parseInt(process.argv[4]) : 5;

const rndBetween = (a, b) => Math.round(a + (Math.random() * (b - a)));

const glitchByte = n => {
  const bit = Array.from({length:8}, (_, i) => 1 << i)[(Math.random()*8)|0]

  const colorfulGlitches = [
    bit ^ (n << 1),
    bit ^ (n << 2),
    bit ^ (n << 3),
    bit ^ (n << 4),
  ]

  const darkerGlitches = [
    bit ^ (n >> 1),
    bit ^ (n >> 2),
    bit ^ (n >> 3),
    bit ^ (n >> 4),
  ]

  const powerOf2Glitches = [
    bit,
    bit - 1,
    bit + 1,
  ];

  const powerOf2FlippedGlitches = [
    ~bit,
    ~bit - 1,
    ~bit + 1,
  ];

  const glitches = [
    ...colorfulGlitches,
    ...darkerGlitches,
    ...powerOf2Glitches,
    ...powerOf2FlippedGlitches,
  ];
  return glitches[(Math.random()*glitches.length)|0]
}

(async () => {
  const tmpDir = `tmp${Math.random().toString(16).slice(2)}`;
  await mkdir(`/tmp/${tmpDir}`);

  for (let times = 0; times < 30; times++) {
    const f = await readFile(inFile);

    const dv = new DataView(f.buffer);

    for (let i = 0; i < glitchesPerFrame; i++) {
      const index = rndBetween(0, f.byteLength - 2);
      dv.setUint8(index, glitchByte(dv.getUint8(index)));
    }

    await writeFile(outFile(times, tmpDir), f);
  }

  exec(`cd /tmp/${tmpDir} && convert -loop 0 -delay 1 *_glitched.jpg ${gifOutFile}`);
})()

