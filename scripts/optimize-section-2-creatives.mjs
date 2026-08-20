import { access, mkdir, readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const SOURCE_DIR = path.join(PROJECT_ROOT, "source-media", "criativos-secao-2");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "public", "section-2-creatives");
const OUTPUT_ROOT = path.dirname(OUTPUT_DIR);
const EXPECTED_COUNT = 40;
const OUTPUT_WIDTH = 720;
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);
const WEBP_OPTIONS = {
  quality: 82,
  alphaQuality: 100,
  effort: 6,
  smartSubsample: true,
};

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** unit).toFixed(unit === 0 ? 0 : 2)} ${units[unit]}`;
}

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function inspectSource() {
  const entries = await readdir(SOURCE_DIR, { withFileTypes: true });
  const invalid = [];
  const images = [];

  for (const entry of entries) {
    if (!entry.isFile() || entry.name === ".DS_Store" || entry.name.startsWith(".")) continue;
    const parsed = path.parse(entry.name);
    const extension = parsed.ext.toLowerCase();

    if (!/^\d+$/.test(parsed.name) || !IMAGE_EXTENSIONS.has(extension)) {
      invalid.push(entry.name);
      continue;
    }

    images.push({
      fileName: entry.name,
      stem: parsed.name,
      index: Number(parsed.name),
    });
  }

  if (invalid.length > 0) {
    throw new Error(`Arquivos inválidos: ${invalid.join(", ")}`);
  }

  images.sort((a, b) => a.index - b.index);
  if (images.length !== EXPECTED_COUNT) {
    throw new Error(`Esperadas ${EXPECTED_COUNT} imagens, encontradas ${images.length}.`);
  }

  const sequenceValid = images.every((image, index) => image.index === index + 1);
  if (!sequenceValid) {
    const present = new Set(images.map((image) => image.index));
    const missing = Array.from({ length: EXPECTED_COUNT }, (_, index) => index + 1)
      .filter((index) => !present.has(index));
    throw new Error(`Sequência inválida. Índices ausentes: ${missing.join(", ")}`);
  }

  return images;
}

async function optimizeImage(inputPath, outputPath) {
  const inputImage = sharp(inputPath);
  const [inputMetadata, inputStats] = await Promise.all([
    inputImage.metadata(),
    sharp(inputPath).stats(),
  ]);

  await sharp(inputPath)
    .resize({ width: OUTPUT_WIDTH, withoutEnlargement: true })
    .webp(WEBP_OPTIONS)
    .toFile(outputPath);

  const outputMetadata = await sharp(outputPath).metadata();
  const expectedWidth = Math.min(inputMetadata.width, OUTPUT_WIDTH);
  const expectedHeight = Math.round(inputMetadata.height * (expectedWidth / inputMetadata.width));
  if (outputMetadata.format !== "webp") {
    throw new Error(`Output inválido: ${path.basename(outputPath)}`);
  }
  if (outputMetadata.width !== expectedWidth || outputMetadata.height !== expectedHeight) {
    throw new Error(`Dimensões inesperadas em ${path.basename(inputPath)}`);
  }
  if (!inputStats.isOpaque && !outputMetadata.hasAlpha) {
    throw new Error(`Transparência perdida em ${path.basename(inputPath)}`);
  }
}

async function publishAtomically(tempDir, backupDir) {
  const hadPreviousOutput = await pathExists(OUTPUT_DIR);
  if (hadPreviousOutput) await rename(OUTPUT_DIR, backupDir);

  try {
    await rename(tempDir, OUTPUT_DIR);
    if (hadPreviousOutput) await rm(backupDir, { recursive: true, force: true });
  } catch (error) {
    if (hadPreviousOutput && !(await pathExists(OUTPUT_DIR)) && (await pathExists(backupDir))) {
      await rename(backupDir, OUTPUT_DIR);
    }
    throw error;
  }
}

async function main() {
  const images = await inspectSource();
  const suffix = `${process.pid}-${Date.now()}`;
  const tempDir = path.join(OUTPUT_ROOT, `.section-2-creatives.tmp-${suffix}`);
  const backupDir = path.join(OUTPUT_ROOT, `.section-2-creatives.backup-${suffix}`);
  const sourcePaths = images.map((image) => path.join(SOURCE_DIR, image.fileName));
  const outputPaths = [];

  await mkdir(tempDir, { recursive: true });

  console.log("Otimizador de criativos da Seção 2");
  console.log(`SOURCE: ${path.relative(PROJECT_ROOT, SOURCE_DIR)}`);
  console.log(`OUTPUT: ${path.relative(PROJECT_ROOT, OUTPUT_DIR)}`);
  console.log(`Imagens: ${images.length}; sequência: 01–${EXPECTED_COUNT}`);
  console.log(`Resize: largura máxima=${OUTPUT_WIDTH}px`);
  console.log(`WebP: quality=${WEBP_OPTIONS.quality}, alphaQuality=${WEBP_OPTIONS.alphaQuality}, effort=${WEBP_OPTIONS.effort}, smartSubsample=${WEBP_OPTIONS.smartSubsample}`);

  try {
    for (const image of images) {
      const inputPath = path.join(SOURCE_DIR, image.fileName);
      const outputPath = path.join(tempDir, `${image.stem}.webp`);
      console.log(`→ ${image.fileName} → ${image.stem}.webp`);
      await optimizeImage(inputPath, outputPath);
      outputPaths.push(outputPath);
      console.log("  ✓ OK");
    }

    const sourceStats = await Promise.all(sourcePaths.map((filePath) => stat(filePath)));
    const outputStats = await Promise.all(outputPaths.map((filePath) => stat(filePath)));
    const sourceBytes = sourceStats.reduce((total, fileStat) => total + fileStat.size, 0);
    const outputBytes = outputStats.reduce((total, fileStat) => total + fileStat.size, 0);
    const reduction = ((sourceBytes - outputBytes) / sourceBytes) * 100;

    await publishAtomically(tempDir, backupDir);

    console.log(`✓ Concluído: ${formatBytes(sourceBytes)} → ${formatBytes(outputBytes)}`);
    console.log(`✓ Redução: ${formatBytes(sourceBytes - outputBytes)} (${reduction.toFixed(1)}%)`);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`✗ ${error.message}`);
  process.exitCode = 1;
});
