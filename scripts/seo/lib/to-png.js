/**
 * 画像を表示用 PNG に正規化する
 *（WebP/AVIF/JPEG/SVG → PNG）
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

/**
 * @param {string|Buffer} input ファイルパスまたはバッファ
 * @param {{ width?: number, height?: number, fit?: string }} [opts]
 * @returns {Promise<Buffer>} PNG buffer
 */
export async function toPngBuffer(input, opts = {}) {
  let pipeline = sharp(input, { failOn: 'none' });

  if (opts.width || opts.height) {
    pipeline = pipeline.resize({
      width: opts.width,
      height: opts.height,
      fit: opts.fit || 'cover',
      position: 'centre',
      background: { r: 26, g: 54, b: 93, alpha: 1 },
    });
  }

  return pipeline.png({ compressionLevel: 8, adaptiveFiltering: true }).toBuffer();
}

/**
 * 入力を PNG ファイルとして書き出す
 * @returns {Promise<string>} 出力パス
 */
export async function ensurePngFile(inputPathOrBuffer, outputPath, opts = {}) {
  const buf = await toPngBuffer(inputPathOrBuffer, opts);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buf);
  return outputPath;
}

/**
 * CLI / バッチ用: ディレクトリ内の画像を PNG 化
 */
export async function convertDirToPng(dir, { outDir = null, recursive = false } = {}) {
  const target = outDir || dir;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const converted = [];

  for (const entry of entries) {
    const src = path.join(dir, entry.name);
    if (entry.isDirectory() && recursive) {
      converted.push(...(await convertDirToPng(src, { outDir: path.join(target, entry.name), recursive })));
      continue;
    }
    if (!entry.isFile()) continue;
    if (!/\.(jpe?g|webp|avif|gif|svg|tiff?)$/i.test(entry.name)) continue;

    const base = entry.name.replace(/\.[^.]+$/, '');
    const dest = path.join(target, `${base}.png`);
    await ensurePngFile(src, dest);
    converted.push(dest);
  }

  return converted;
}
