const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BUILD_DIR = path.resolve(__dirname, '../build');
const COMPRESSIBLE_EXTENSIONS = new Set([
  '.html',
  '.css',
  '.js',
  '.json',
  '.svg',
  '.txt',
  '.xml',
  '.map',
]);
const MIN_BYTES = 1024;

function collectFilesRecursively(dirPath, output = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collectFilesRecursively(fullPath, output);
      continue;
    }

    if (entry.isFile()) {
      output.push(fullPath);
    }
  }

  return output;
}

function shouldCompress(filePath, sourceBuffer) {
  if (filePath.endsWith('.gz') || filePath.endsWith('.br')) return false;
  if (sourceBuffer.length < MIN_BYTES) return false;
  return COMPRESSIBLE_EXTENSIONS.has(path.extname(filePath));
}

function writeIfSmaller(targetPath, compressedBuffer, sourceSize) {
  if (compressedBuffer.length >= sourceSize) return false;
  fs.writeFileSync(targetPath, compressedBuffer);
  return true;
}

function main() {
  if (!fs.existsSync(BUILD_DIR)) {
    console.error(`[compress-build] Build directory not found: ${BUILD_DIR}`);
    process.exit(1);
  }

  const files = collectFilesRecursively(BUILD_DIR);
  let gzipCount = 0;
  let brotliCount = 0;

  for (const filePath of files) {
    const sourceBuffer = fs.readFileSync(filePath);
    if (!shouldCompress(filePath, sourceBuffer)) continue;

    const gzipBuffer = zlib.gzipSync(sourceBuffer, { level: zlib.constants.Z_BEST_COMPRESSION });
    const brotliBuffer = zlib.brotliCompressSync(sourceBuffer, {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
        [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
      },
    });

    if (writeIfSmaller(`${filePath}.gz`, gzipBuffer, sourceBuffer.length)) gzipCount += 1;
    if (writeIfSmaller(`${filePath}.br`, brotliBuffer, sourceBuffer.length)) brotliCount += 1;
  }

  console.log(`[compress-build] Generated ${gzipCount} gzip and ${brotliCount} brotli files.`);
}

main();
