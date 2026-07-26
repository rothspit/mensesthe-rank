#!/usr/bin/env node
/**
 * 任意画像を PNG に変換（表示互換用）
 *
 *   node scripts/seo/convert-to-png.js path/to/image.webp
 *   node scripts/seo/convert-to-png.js path/to/dir --dir
 */

import fs from 'fs';
import path from 'path';
import { convertDirToPng, ensurePngFile } from './lib/to-png.js';

async function main() {
  const args = process.argv.slice(2);
  const asDir = args.includes('--dir');
  const input = args.find((a) => !a.startsWith('--'));
  if (!input) {
    console.error('使い方: node scripts/seo/convert-to-png.js <file|dir> [--dir]');
    process.exit(1);
  }

  const abs = path.resolve(input);
  if (!fs.existsSync(abs)) {
    console.error(`見つかりません: ${abs}`);
    process.exit(1);
  }

  if (asDir || fs.statSync(abs).isDirectory()) {
    const files = await convertDirToPng(abs);
    console.log(`✅ ${files.length} 件 PNG 化`);
    files.forEach((f) => console.log(`  ${f}`));
    return;
  }

  const out = abs.replace(/\.[^.]+$/, '.png');
  await ensurePngFile(abs, out);
  console.log(`✅ ${out}`);
}

main().catch((err) => {
  console.error('❌', err.message || err);
  process.exit(1);
});
