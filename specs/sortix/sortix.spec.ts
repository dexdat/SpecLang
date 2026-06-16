// @spec: @sortix/master v1.0.0
// @block: types @kind:implementation
// @source: specs/sortix/sortix.spec.ts.md:46-75
import * as fs from 'fs';
import * as path from 'path';

export type Category = 'images' | 'docs' | 'code' | 'archives' | 'audio' | 'video' | 'fonts' | 'other';

export interface FileEntry {
  filePath: string;
  name: string;
  ext: string;
  size: number;
}

export interface OrganizeOptions {
  dryRun: boolean;
  targetDir: string;
}

export interface OrganizeResult {
  category: Category;
  moved: number;
  failed: number;
  totalSize: number;
}

export interface ScanResult {
  entries: FileEntry[];
  totalSize: number;
  totalFiles: number;
}

// @spec: @sortix/master v1.0.0
// @block: category-maps @kind:implementation
// @source: specs/sortix/sortix.spec.ts.md:84-118
const EXTENSION_MAP: Record<string, Category> = {
  '.jpg': 'images', '.jpeg': 'images', '.png': 'images', '.gif': 'images',
  '.webp': 'images', '.svg': 'images', '.bmp': 'images', '.ico': 'images',
  '.tiff': 'images', '.tif': 'images',
  '.pdf': 'docs', '.doc': 'docs', '.docx': 'docs', '.xls': 'docs',
  '.xlsx': 'docs', '.ppt': 'docs', '.pptx': 'docs', '.txt': 'docs',
  '.md': 'docs', '.csv': 'docs', '.rtf': 'docs', '.odt': 'docs',
  '.ts': 'code', '.tsx': 'code', '.js': 'code', '.jsx': 'code',
  '.py': 'code', '.rs': 'code', '.go': 'code', '.java': 'code',
  '.c': 'code', '.cpp': 'code', '.h': 'code', '.hpp': 'code',
  '.rb': 'code', '.php': 'code', '.swift': 'code', '.kt': 'code',
  '.sh': 'code', '.bash': 'code', '.yaml': 'code', '.yml': 'code',
  '.json': 'code', '.xml': 'code', '.toml': 'code', '.sql': 'code',
  '.css': 'code', '.scss': 'code', '.less': 'code', '.html': 'code',
  '.zip': 'archives', '.tar': 'archives', '.gz': 'archives',
  '.bz2': 'archives', '.xz': 'archives', '.7z': 'archives',
  '.rar': 'archives', '.tgz': 'archives',
  '.mp3': 'audio', '.wav': 'audio', '.flac': 'audio', '.ogg': 'audio',
  '.aac': 'audio', '.wma': 'audio', '.m4a': 'audio',
  '.mp4': 'video', '.avi': 'video', '.mkv': 'video', '.mov': 'video',
  '.wmv': 'video', '.flv': 'video', '.webm': 'video',
  '.ttf': 'fonts', '.otf': 'fonts', '.woff': 'fonts', '.woff2': 'fonts',
};

const CATEGORY_LABELS: Record<Category, string> = {
  images: '📷 Images',
  docs: '📄 Documents',
  code: '💻 Code',
  archives: '📦 Archives',
  audio: '🎵 Audio',
  video: '🎬 Video',
  fonts: '🔤 Fonts',
  other: '📁 Other',
};

// @spec: @sortix/master v1.0.0
// @block: scanDirectory @kind:implementation
// @source: specs/sortix/sortix.spec.ts.md:127-166
export function scanDirectory(dir: string): ScanResult {
  const entries: FileEntry[] = [];
  let totalSize = 0;

  function walk(currentDir: string) {
    let items: string[];
    try {
      items = fs.readdirSync(currentDir);
    } catch {
      return;
    }

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      let stat: fs.Stats;
      try {
        stat = fs.statSync(fullPath);
      } catch {
        continue;
      }

      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        entries.push({
          filePath: fullPath,
          name: item,
          ext,
          size: stat.size,
        });
        totalSize += stat.size;
      }
    }
  }

  walk(dir);
  return { entries, totalSize, totalFiles: entries.length };
}

// @spec: @sortix/master v1.0.0
// @block: categorizeFile @kind:implementation
// @source: specs/sortix/sortix.spec.ts.md:175-178
export function categorizeFile(entry: FileEntry): Category {
  return EXTENSION_MAP[entry.ext] || 'other';
}

// @spec: @sortix/master v1.0.0
// @block: organizeFiles @kind:implementation
// @source: specs/sortix/sortix.spec.ts.md:187-227
export function organizeFiles(
  entries: FileEntry[],
  options: OrganizeOptions
): Record<Category, OrganizeResult> {
  const results: Record<Category, OrganizeResult> = {
    images: { category: 'images', moved: 0, failed: 0, totalSize: 0 },
    docs: { category: 'docs', moved: 0, failed: 0, totalSize: 0 },
    code: { category: 'code', moved: 0, failed: 0, totalSize: 0 },
    archives: { category: 'archives', moved: 0, failed: 0, totalSize: 0 },
    audio: { category: 'audio', moved: 0, failed: 0, totalSize: 0 },
    video: { category: 'video', moved: 0, failed: 0, totalSize: 0 },
    other: { category: 'other', moved: 0, failed: 0, totalSize: 0 },
  };

  for (const entry of entries) {
    const cat = categorizeFile(entry);
    const result = results[cat];
    result.totalSize += entry.size;

    const targetDir = path.join(options.targetDir, cat);
    const destPath = path.join(targetDir, entry.name);

    if (options.dryRun) {
      result.moved++;
      continue;
    }

    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.renameSync(entry.filePath, destPath);
      result.moved++;
    } catch {
      result.failed++;
    }
  }

  return results;
}

// @spec: @sortix/master v1.0.0
// @block: printSummary @kind:implementation
// @source: specs/sortix/sortix.spec.ts.md:236-276
function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIdx = 0;
  while (size >= 1024 && unitIdx < units.length - 1) {
    size /= 1024;
    unitIdx++;
  }
  return `${size.toFixed(1)} ${units[unitIdx]}`;
}

export function printSummary(results: Record<Category, OrganizeResult>): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊  SORTIX — Organization Summary');
  console.log('='.repeat(60));

  let totalMoved = 0;
  let totalFailed = 0;
  let totalBytes = 0;

  for (const cat of Object.keys(results) as Category[]) {
    const r = results[cat];
    if (r.moved > 0 || r.failed > 0) {
      const label = CATEGORY_LABELS[cat] || cat;
      console.log(
        `  ${label.padEnd(20)}  ${String(r.moved).padStart(4)} files  ${formatSize(r.totalSize).padStart(10)}`
      );
      totalMoved += r.moved;
      totalFailed += r.failed;
      totalBytes += r.totalSize;
    }
  }

  console.log('-'.repeat(60));
  console.log(`  ${'TOTAL'.padEnd(20)}  ${String(totalMoved).padStart(4)} files  ${formatSize(totalBytes).padStart(10)}`);
  if (totalFailed > 0) {
    console.log(`  ⚠️  ${totalFailed} file(s) failed to move`);
  }
  console.log('='.repeat(60) + '\n');
}
