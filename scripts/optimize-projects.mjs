import { access, mkdir, readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import sharp from "sharp";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const SOURCE_ROOT = path.join(PROJECT_ROOT, "source-media");
const OUTPUT_ROOT = path.join(PROJECT_ROOT, "public", "projects");

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);
const VIDEO_EXTENSIONS = new Set([".mov"]);
const IGNORED_FILES = new Set([".DS_Store"]);

const WEBP_OPTIONS = {
  quality: 88,
  alphaQuality: 100,
  effort: 6,
  smartSubsample: true,
};

const VIDEO_MAX_WIDTH = 1920;
const VIDEO_CRF = 20;
const VIDEO_PRESET = "slow";
const AUDIO_BITRATE = "128k";

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** unit).toFixed(unit === 0 ? 0 : 2)} ${units[unit]}`;
}

function formatReduction(sourceBytes, outputBytes) {
  const saved = sourceBytes - outputBytes;
  const percent = sourceBytes === 0 ? 0 : (saved / sourceBytes) * 100;
  return `${formatBytes(saved)} (${percent.toFixed(1)}%)`;
}

function assertProjectName(projectName) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(projectName)) {
    throw new Error(
      `Nome de projeto inválido: "${projectName}". Use apenas letras, números, hífen e underscore.`,
    );
  }
}

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listProjectNames(requestedNames) {
  if (requestedNames.length > 0) {
    requestedNames.forEach(assertProjectName);
    return [...new Set(requestedNames)];
  }

  const entries = await readdir(SOURCE_ROOT, { withFileTypes: true });
  const projects = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const files = await readdir(path.join(SOURCE_ROOT, entry.name));
    if (files.some((file) => !IGNORED_FILES.has(file) && !file.startsWith("."))) {
      projects.push(entry.name);
    }
  }

  return projects.sort((a, b) => a.localeCompare(b, "en"));
}

async function inspectProject(projectName) {
  const sourceDir = path.join(SOURCE_ROOT, projectName);
  const sourceStat = await stat(sourceDir).catch(() => null);

  if (!sourceStat?.isDirectory()) {
    throw new Error(`Pasta SOURCE não encontrada: ${path.relative(PROJECT_ROOT, sourceDir)}`);
  }

  const entries = await readdir(sourceDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && !IGNORED_FILES.has(entry.name) && !entry.name.startsWith("."))
    .map((entry) => entry.name);

  const thumbs = [];
  const slides = [];
  const invalid = [];

  for (const fileName of files) {
    const parsed = path.parse(fileName);
    const extension = parsed.ext.toLowerCase();
    const isSupportedImage = IMAGE_EXTENSIONS.has(extension);
    const isSupportedVideo = VIDEO_EXTENSIONS.has(extension);

    if (parsed.name.toLowerCase() === "thumb") {
      if (isSupportedImage) thumbs.push(fileName);
      else invalid.push(fileName);
      continue;
    }

    if (/^\d+$/.test(parsed.name) && (isSupportedImage || isSupportedVideo)) {
      const index = Number(parsed.name);
      if (!Number.isSafeInteger(index) || index < 1) {
        throw new Error(`Índice de slide inválido: ${fileName}`);
      }
      slides.push({
        fileName,
        stem: parsed.name,
        index,
        type: isSupportedImage ? "image" : "video",
      });
      continue;
    }

    invalid.push(fileName);
  }

  if (invalid.length > 0) {
    throw new Error(`Arquivos com nome ou formato inválido: ${invalid.join(", ")}`);
  }
  if (thumbs.length === 0) {
    throw new Error("Thumb ausente. Adicione thumb.png, thumb.jpg ou thumb.jpeg.");
  }
  if (thumbs.length > 1) {
    throw new Error(`Mais de uma thumb encontrada: ${thumbs.join(", ")}`);
  }
  if (slides.length === 0) {
    throw new Error("Nenhum slide numerado foi encontrado.");
  }

  slides.sort((a, b) => a.index - b.index || a.stem.localeCompare(b.stem));

  const duplicateIndices = slides
    .filter((slide, index) => index > 0 && slide.index === slides[index - 1].index)
    .map((slide) => slide.index);
  if (duplicateIndices.length > 0) {
    throw new Error(`Índices duplicados: ${[...new Set(duplicateIndices)].join(", ")}`);
  }

  const maximumIndex = slides.at(-1).index;
  const presentIndices = new Set(slides.map((slide) => slide.index));
  const missingIndices = [];
  for (let index = 1; index <= maximumIndex; index += 1) {
    if (!presentIndices.has(index)) missingIndices.push(index);
  }
  if (missingIndices.length > 0) {
    throw new Error(`Sequência incompleta. Slides ausentes: ${missingIndices.join(", ")}`);
  }

  return { sourceDir, thumb: thumbs[0], slides };
}

async function runFfmpeg(args, purpose) {
  await new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      if (stderr.length > 20_000) stderr = stderr.slice(-20_000);
    });
    child.on("error", (error) => reject(new Error(`${purpose}: ${error.message}`)));
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${purpose} (FFmpeg saiu com código ${code}):\n${stderr.trim()}`));
    });
  });
}

async function probeDuration(filePath) {
  const output = await new Promise((resolve, reject) => {
    const child = spawn(
      ffprobeStatic.path,
      ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", filePath],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => reject(new Error(`Falha ao inspecionar ${path.basename(filePath)}: ${error.message}`)));
    child.on("close", (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(`FFprobe falhou em ${path.basename(filePath)}: ${stderr.trim()}`));
    });
  });

  const duration = Number(output);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Duração de vídeo inválida em ${path.basename(filePath)}: ${output}`);
  }
  return duration;
}

async function optimizeImage(inputPath, outputPath) {
  const inputImage = sharp(inputPath);
  const [inputMetadata, inputStats] = await Promise.all([inputImage.metadata(), sharp(inputPath).stats()]);

  await sharp(inputPath).webp(WEBP_OPTIONS).toFile(outputPath);

  const outputMetadata = await sharp(outputPath).metadata();
  if (outputMetadata.format !== "webp") {
    throw new Error(`Output não é WebP válido: ${outputPath}`);
  }
  if (inputMetadata.width !== outputMetadata.width || inputMetadata.height !== outputMetadata.height) {
    throw new Error(`Dimensões alteradas inesperadamente em ${path.basename(inputPath)}`);
  }
  if (!inputStats.isOpaque && !outputMetadata.hasAlpha) {
    throw new Error(`Transparência perdida em ${path.basename(inputPath)}`);
  }
}

async function optimizeVideo(inputPath, outputPath) {
  const sourceDuration = await probeDuration(inputPath);
  const durationArgument = sourceDuration.toFixed(6);

  await runFfmpeg(
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      inputPath,
      "-map",
      "0:v:0",
      "-map",
      "0:a?",
      "-vf",
      `scale=w='min(${VIDEO_MAX_WIDTH},trunc(iw/2)*2)':h=-2,tpad=stop_mode=clone:stop_duration=${durationArgument}`,
      "-c:v",
      "libx264",
      "-preset",
      VIDEO_PRESET,
      "-crf",
      String(VIDEO_CRF),
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-c:a",
      "aac",
      "-b:a",
      AUDIO_BITRATE,
      "-sn",
      "-dn",
      "-t",
      durationArgument,
      outputPath,
    ],
    `Falha ao converter ${path.basename(inputPath)}`,
  );

  // Decodifica o arquivo inteiro para detectar truncamento, corrupção ou stream inválido.
  await runFfmpeg(
    ["-hide_banner", "-loglevel", "error", "-xerror", "-i", outputPath, "-map", "0:v:0", "-f", "null", "-"],
    `Falha ao validar ${path.basename(outputPath)}`,
  );

  const outputDuration = await probeDuration(outputPath);
  if (Math.abs(sourceDuration - outputDuration) > 0.05) {
    throw new Error(
      `Duração divergente em ${path.basename(outputPath)}: source=${sourceDuration.toFixed(3)}s, output=${outputDuration.toFixed(3)}s`,
    );
  }
}

async function getTotalSize(filePaths) {
  const stats = await Promise.all(filePaths.map((filePath) => stat(filePath)));
  return stats.reduce((total, fileStat) => total + fileStat.size, 0);
}

async function publishAtomically(tempDir, targetDir, backupDir) {
  const hadPreviousOutput = await pathExists(targetDir);
  if (hadPreviousOutput) await rename(targetDir, backupDir);

  try {
    await rename(tempDir, targetDir);
    if (hadPreviousOutput) await rm(backupDir, { recursive: true, force: true });
  } catch (error) {
    if (hadPreviousOutput && !(await pathExists(targetDir)) && (await pathExists(backupDir))) {
      await rename(backupDir, targetDir);
    }
    throw error;
  }
}

async function processProject(projectName) {
  assertProjectName(projectName);
  const { sourceDir, thumb, slides } = await inspectProject(projectName);
  const imageSlides = slides.filter((slide) => slide.type === "image");
  const videoSlides = slides.filter((slide) => slide.type === "video");
  const targetDir = path.join(OUTPUT_ROOT, projectName);
  const uniqueSuffix = `${process.pid}-${Date.now()}`;
  const tempDir = path.join(OUTPUT_ROOT, `.${projectName}.tmp-${uniqueSuffix}`);
  const backupDir = path.join(OUTPUT_ROOT, `.${projectName}.backup-${uniqueSuffix}`);

  console.log(`\n▶ ${projectName}`);
  console.log(`  SOURCE: ${path.relative(PROJECT_ROOT, sourceDir)}`);
  console.log(`  OUTPUT: ${path.relative(PROJECT_ROOT, targetDir)}`);
  console.log(`  Slides: ${slides.length} (${imageSlides.length} imagens, ${videoSlides.length} vídeos)`);
  console.log(`  Thumb: encontrada (${thumb})`);

  await mkdir(OUTPUT_ROOT, { recursive: true });
  await mkdir(tempDir, { recursive: true });

  const sourcePaths = [
    ...slides.map((slide) => path.join(sourceDir, slide.fileName)),
    path.join(sourceDir, thumb),
  ];
  const outputPaths = [];

  try {
    for (const slide of slides) {
      const inputPath = path.join(sourceDir, slide.fileName);
      const extension = slide.type === "image" ? ".webp" : ".mp4";
      const outputPath = path.join(tempDir, `${slide.stem}${extension}`);
      console.log(`  → ${slide.fileName} → ${path.basename(outputPath)}`);

      if (slide.type === "image") await optimizeImage(inputPath, outputPath);
      else await optimizeVideo(inputPath, outputPath);

      outputPaths.push(outputPath);
      console.log("    ✓ OK");
    }

    const thumbInputPath = path.join(sourceDir, thumb);
    const thumbOutputPath = path.join(tempDir, "thumb.webp");
    console.log(`  → ${thumb} → thumb.webp (thumb separada)`);
    await optimizeImage(thumbInputPath, thumbOutputPath);
    outputPaths.push(thumbOutputPath);
    console.log("    ✓ OK");

    const sourceBytes = await getTotalSize(sourcePaths);
    const outputBytes = await getTotalSize(outputPaths);
    await publishAtomically(tempDir, targetDir, backupDir);

    console.log(`  ✓ Projeto concluído: ${formatBytes(sourceBytes)} → ${formatBytes(outputBytes)}`);
    console.log(`  ✓ Redução: ${formatReduction(sourceBytes, outputBytes)}`);

    return {
      projectName,
      slides: slides.length,
      images: imageSlides.length + 1,
      imageSlides: imageSlides.length,
      videos: videoSlides.length,
      sourceBytes,
      outputBytes,
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function main() {
  if (!ffmpegPath) throw new Error("O binário FFmpeg empacotado não foi encontrado.");
  if (!ffprobeStatic.path) throw new Error("O binário FFprobe empacotado não foi encontrado.");

  const requestedProjects = process.argv.slice(2);
  const projectNames = await listProjectNames(requestedProjects);
  if (projectNames.length === 0) {
    throw new Error(`Nenhuma pasta de projeto com assets foi encontrada em ${path.relative(PROJECT_ROOT, SOURCE_ROOT)}.`);
  }

  console.log("Otimizador de assets do portfolio");
  console.log(`WebP: quality=${WEBP_OPTIONS.quality}, alphaQuality=${WEBP_OPTIONS.alphaQuality}, effort=${WEBP_OPTIONS.effort}, smartSubsample=${WEBP_OPTIONS.smartSubsample}`);
  console.log(`H.264: CRF ${VIDEO_CRF}, preset ${VIDEO_PRESET}, yuv420p, largura máxima ${VIDEO_MAX_WIDTH}px, fast start, frame rate preservado`);

  const results = [];
  const failures = [];

  for (const projectName of projectNames) {
    try {
      results.push(await processProject(projectName));
    } catch (error) {
      failures.push({ projectName, error });
      console.error(`\n✗ ${projectName}: ${error.message}`);
    }
  }

  const totals = results.reduce(
    (summary, result) => ({
      projects: summary.projects + 1,
      slides: summary.slides + result.slides,
      images: summary.images + result.images,
      videos: summary.videos + result.videos,
      sourceBytes: summary.sourceBytes + result.sourceBytes,
      outputBytes: summary.outputBytes + result.outputBytes,
    }),
    { projects: 0, slides: 0, images: 0, videos: 0, sourceBytes: 0, outputBytes: 0 },
  );

  console.log("\nResumo");
  console.log(`  Projetos: ${totals.projects} concluídos, ${failures.length} com falha`);
  console.log(`  Slides: ${totals.slides}`);
  console.log(`  Imagens: ${totals.images} (incluindo thumbs)`);
  console.log(`  Vídeos: ${totals.videos}`);
  console.log(`  Tamanho: ${formatBytes(totals.sourceBytes)} → ${formatBytes(totals.outputBytes)}`);
  console.log(`  Redução: ${formatReduction(totals.sourceBytes, totals.outputBytes)}`);

  if (failures.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`\n✗ ${error.message}`);
  process.exitCode = 1;
});
