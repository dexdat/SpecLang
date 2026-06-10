// @spec: @sortix/cli v1.0.0
// @block: cli-entry @kind:implementation
// @source: specs/sortix/sortix-cli.spec.ts.md:31-48
import { Command } from 'commander';
import * as path from 'path';
import {
  scanDirectory,
  categorizeFile,
  organizeFiles,
  printSummary,
  FileEntry,
  Category,
} from './sortix.spec';

const program = new Command();

program
  .name('sortix')
  .description('📁 File organizer — scan, categorize, and organize files by type')
  .version('1.0.0');

// @spec: @sortix/cli v1.0.0
// @block: scan-command @kind:implementation
// @source: specs/sortix/sortix-cli.spec.ts.md:57-91
program
  .command('scan')
  .description('Scan a directory and show file categories')
  .argument('<dir>', 'Directory to scan')
  .action((dir: string) => {
    const resolvedDir = path.resolve(dir);

    console.log(`\n🔍 Scanning: ${resolvedDir}`);
    const { entries, totalFiles, totalSize } = scanDirectory(resolvedDir);

    console.log(`Found ${totalFiles} files (${formatBytes(totalSize)})`);

    const categorized: Record<Category, FileEntry[]> = {
      images: [], docs: [], code: [], archives: [], audio: [], video: [], other: [],
    };

    for (const entry of entries) {
      const cat = categorizeFile(entry);
      categorized[cat].push(entry);
    }

    console.log('\n' + '─'.repeat(50));
    console.log('📊  FILE BREAKDOWN BY CATEGORY');
    console.log('─'.repeat(50));

    for (const [cat, files] of Object.entries(categorized) as [Category, FileEntry[]][]) {
      if (files.length > 0) {
        const total = files.reduce((sum, f) => sum + f.size, 0);
        const label = getCategoryLabel(cat);
        console.log(`  ${label}  ${String(files.length).padStart(4)} files  ${formatBytes(total).padStart(10)}`);
      }
    }
    console.log('─'.repeat(50) + '\n');
  });

// @spec: @sortix/cli v1.0.0
// @block: organize-command @kind:implementation
// @source: specs/sortix/sortix-cli.spec.ts.md:100-127
program
  .command('organize')
  .description('Organize files into categorized subdirectories')
  .argument('<dir>', 'Directory to organize')
  .option('--dry-run', 'Preview what would happen without making changes')
  .action((dir: string, options: { dryRun?: boolean }) => {
    const resolvedDir = path.resolve(dir);

    console.log(`\n🔍 Scanning: ${resolvedDir}`);
    const { entries } = scanDirectory(resolvedDir);
    console.log(`Found ${entries.length} files`);

    if (options.dryRun) {
      console.log('🏁  DRY RUN — No files will be moved\n');
    }

    const results = organizeFiles(entries, {
      dryRun: options.dryRun || false,
      targetDir: resolvedDir,
    });

    printSummary(results);

    if (!options.dryRun) {
      console.log('✅  Organization complete!');
    }
  });

// @spec: @sortix/cli v1.0.0
// @block: helpers-and-entry @kind:implementation
// @source: specs/sortix/sortix-cli.spec.ts.md:136-165
function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIdx = 0;
  while (size >= 1024 && unitIdx < units.length - 1) {
    size /= 1024;
    unitIdx++;
  }
  return `${size.toFixed(1)} ${units[unitIdx]}`;
}

function getCategoryLabel(cat: Category): string {
  const labels: Record<Category, string> = {
    images: '📷 Images',
    docs: '📄 Documents',
    code: '💻 Code',
    archives: '📦 Archives',
    audio: '🎵 Audio',
    video: '🎬 Video',
    other: '📁 Other',
  };
  return labels[cat];
}

if (require.main === module) {
  program.parse(process.argv);
}

export { program };
