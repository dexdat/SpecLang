# Bootstrap Phase 4.14: Pipeline Format Stages

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 4.14 of the bootstrap process.

**Prerequisites**: 
- Phase 4.1-4.13 (Pipeline system) complete
- Lint stages implemented

## Your Task
Implement the format stage system for the pipeline. Format stages enforce consistent code style and formatting across the codebase.

## Read These Specs First
1. `specs/pipeline.spec.md` - Pipeline overview
2. `specs/stages.spec.md` - Stage definitions
3. `specs/format.spec.md` - Formatting specifications

## What to Build

### Files to Create
```
src/pipeline/stages/
├── format/
│   ├── index.ts           # Format stage exports
│   ├── types.ts           # Format stage types
│   ├── runner.ts         # Format runner
│   ├── config.ts         # Format configuration
│   ├── checkers.ts       # Format checkers
│   └── languages.ts      # Language-specific formatters

tests/pipeline/
└── format.test.ts
```

### Requirements

#### 1. Format Stage Types

```typescript
// src/pipeline/stages/format/types.ts

export interface FormatStageConfig {
  name: string;
  languages: LanguageConfig[];
  options?: FormatOptions;
  checkOnly?: boolean;
  depends_on?: string[];
}

export interface LanguageConfig {
  language: Language;
  patterns: string[];
  config?: Record<string, unknown>;
}

export type Language = 
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'rust'
  | 'go'
  | 'json'
  | 'yaml'
  | 'markdown'
  | 'css'
  | 'html'
  | 'shell';

export interface FormatOptions {
  printWidth?: number;
  tabWidth?: number;
  useTabs?: boolean;
  semi?: boolean;
  singleQuote?: boolean;
  trailingComma?: 'none' | 'es5' | 'all';
  bracketSpacing?: boolean;
  arrowParens?: 'always' | 'avoid';
  endOfLine?: 'lf' | 'crlf' | 'cr';
  proseWrap?: 'preserve' | 'always' | 'never';
  quoteProps?: 'as-needed' | 'consistent' | 'preserve';
  whitespace?: boolean;
}

export interface FormatResult {
  stage: string;
  status: 'success' | 'failed' | 'unchanged';
  filesFormatted: number;
  filesUnchanged: number;
  filesWithErrors: number;
  changes: FileChange[];
  duration: number;
  error?: string;
}

export interface FileChange {
  file: string;
  status: 'formatted' | 'unchanged' | 'error';
  originalSize?: number;
  formattedSize?: number;
  diff?: string;
  error?: string;
}
```

#### 2. Format Runner

```typescript
// src/pipeline/stages/format/runner.ts

import { FormatStageConfig, FormatResult, FileChange, Language } from './types';
import { exec } from '../../utils/exec';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { diffLines } from './diff';

export class FormatRunner {
  private languageFormatters: Map<Language, FormatterRunner> = new Map();
  
  register(language: Language, runner: FormatterRunner): void {
    this.languageFormatters.set(language, runner);
  }
  
  async execute(config: FormatStageConfig): Promise<FormatResult> {
    const start = Date.now();
    
    const result: FormatResult = {
      stage: config.name,
      status: 'success',
      filesFormatted: 0,
      filesUnchanged: 0,
      filesWithErrors: 0,
      changes: [],
      duration: 0,
    };
    
    for (const langConfig of config.languages) {
      const langResult = await this.formatLanguage(langConfig, config.options, config.checkOnly);
      
      result.filesFormatted += langResult.filesFormatted;
      result.filesUnchanged += langResult.filesUnchanged;
      result.filesWithErrors += langResult.filesWithErrors;
      result.changes.push(...langResult.changes);
    }
    
    if (result.filesWithErrors > 0) {
      result.status = 'failed';
    } else if (result.filesFormatted === 0 && result.filesUnchanged > 0) {
      result.status = 'unchanged';
    }
    
    result.duration = Date.now() - start;
    return result;
  }
  
  private async formatLanguage(
    langConfig: LanguageConfig,
    options?: FormatOptions,
    checkOnly?: boolean
  ): Promise<FormatResult> {
    const formatter = this.languageFormatters.get(langConfig.language);
    
    if (!formatter) {
      return {
        stage: langConfig.language,
        status: 'success',
        filesFormatted: 0,
        filesUnchanged: 0,
        filesWithErrors: 0,
        changes: [],
        duration: 0,
        error: `No formatter for language: ${langConfig.language}`,
      };
    }
    
    const result: FormatResult = {
      stage: langConfig.language,
      status: 'success',
      filesFormatted: 0,
      filesUnchanged: 0,
      filesWithErrors: 0,
      changes: [],
      duration: 0,
    };
    
    for (const pattern of langConfig.patterns) {
      const fileResult = await formatter.format(pattern, options, checkOnly);
      result.changes.push(fileResult);
      
      if (fileResult.status === 'formatted') {
        result.filesFormatted++;
      } else if (fileResult.status === 'unchanged') {
        result.filesUnchanged++;
      } else if (fileResult.status === 'error') {
        result.filesWithErrors++;
      }
    }
    
    return result;
  }
}

export interface FormatterRunner {
  format(pattern: string, options?: FormatOptions, checkOnly?: boolean): Promise<FileChange>;
}

export class PrettierFormatter implements FormatterRunner {
  async format(pattern: string, options?: FormatOptions, checkOnly?: boolean): Promise<FileChange> {
    const args = ['prettier'];
    
    if (checkOnly) {
      args.push('--check');
    } else {
      args.push('--write');
    }
    
    if (options?.printWidth) args.push('--print-width', String(options.printWidth));
    if (options?.tabWidth) args.push('--tab-width', String(options.tabWidth));
    if (options?.useTabs) args.push('--use-tabs');
    if (options?.semi === false) args.push('--no-semi');
    if (options?.singleQuote) args.push('--single-quote');
    if (options?.trailingComma) args.push('--trailing-comma', options.trailingComma);
    if (options?.bracketSpacing === false) args.push('--no-bracket-spacing');
    if (options?.arrowParens) args.push('--arrow-parens', options.arrowParens);
    if (options?.endOfLine) args.push('--end-of-line', options.endOfLine);
    
    args.push(pattern);
    
    try {
      await exec(args.join(' '));
      
      return {
        file: pattern,
        status: 'formatted',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      
      if (message.includes('already formatted')) {
        return {
          file: pattern,
          status: 'unchanged',
        };
      }
      
      return {
        file: pattern,
        status: 'error',
        error: message,
      };
    }
  }
}

export class BlackFormatter implements FormatterRunner {
  async format(pattern: string, options?: FormatOptions, checkOnly?: boolean): Promise<FileChange> {
    const args = ['black'];
    
    if (checkOnly) args.push('--check');
    if (options?.printWidth) args.push('--line-length', String(options.printWidth));
    
    args.push(pattern);
    
    try {
      await exec(args.join(' '));
      
      return {
        file: pattern,
        status: 'formatted',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      
      if (message.includes('would be reformatted')) {
        return {
          file: pattern,
          status: 'unchanged',
        };
      }
      
      return {
        file: pattern,
        status: 'error',
        error: message,
      };
    }
  }
}

export class GoFmtFormatter implements FormatterRunner {
  async format(pattern: string, options?: FormatOptions, checkOnly?: boolean): Promise<FileChange> {
    const args = ['gofmt'];
    
    if (checkOnly) args.push('-l');
    else args.push('-w');
    
    args.push(pattern);
    
    try {
      await exec(args.join(' '));
      
      return {
        file: pattern,
        status: 'formatted',
      };
    } catch (error) {
      return {
        file: pattern,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export class RustFmtFormatter implements FormatterRunner {
  async format(pattern: string, options?: FormatOptions, checkOnly?: boolean): Promise<FileChange> {
    const args = ['rustfmt'];
    
    if (checkOnly) args.push('--check');
    if (options?.printWidth) args.push('--max-width', String(options.printWidth));
    if (options?.tabWidth) args.push('--tab-width', String(options.tabWidth));
    
    args.push(pattern);
    
    try {
      await exec(args.join(' '));
      
      return {
        file: pattern,
        status: 'formatted',
      };
    } catch (error) {
      return {
        file: pattern,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export class JsonFormatterRunner implements FormatterRunner {
  async format(pattern: string, options?: FormatOptions, checkOnly?: boolean): Promise<FileChange> {
    try {
      const content = readFileSync(pattern, 'utf-8');
      const formatted = JSON.stringify(JSON.parse(content), null, options?.tabWidth || 2);
      
      if (!checkOnly) {
        writeFileSync(pattern, formatted + '\n');
      }
      
      return {
        file: pattern,
        status: content === formatted ? 'unchanged' : 'formatted',
        originalSize: content.length,
        formattedSize: formatted.length,
      };
    } catch (error) {
      return {
        file: pattern,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export class YamlFormatterRunner implements FormatterRunner {
  async format(pattern: string, options?: FormatOptions, checkOnly?: boolean): Promise<FileChange> {
    const args = ['prettier', '--parser', 'yaml'];
    
    if (!checkOnly) args.push('--write');
    
    args.push(pattern);
    
    try {
      await exec(args.join(' '));
      
      return {
        file: pattern,
        status: 'formatted',
      };
    } catch (error) {
      return {
        file: pattern,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
```

#### 3. Language Registration

```typescript
// src/pipeline/stages/format/languages.ts

import { Language, FormatterRunner } from './types';
import { 
  PrettierFormatter, 
  BlackFormatter, 
  GoFmtFormatter, 
  RustFmtFormatter,
  JsonFormatterRunner,
  YamlFormatterRunner 
} from './runner';

export function registerAllFormatters(runner: { register: (lang: Language, r: FormatterRunner) => void }): void {
  runner.register('typescript', new PrettierFormatter());
  runner.register('javascript', new PrettierFormatter());
  runner.register('json', new JsonFormatterRunner());
  runner.register('yaml', new YamlFormatterRunner());
  runner.register('markdown', new PrettierFormatter());
  runner.register('css', new PrettierFormatter());
  runner.register('html', new PrettierFormatter());
  runner.register('python', new BlackFormatter());
  runner.register('go', new GoFmtFormatter());
  runner.register('rust', new RustFmtFormatter());
  runner.register('shell', new PrettierFormatter());
}
```

#### 4. Format Configuration

```yaml
# format.yaml (extends pipeline config)

stages:
  - name: format-code
    languages:
      - language: typescript
        patterns:
          - src/**/*.ts
          - tests/**/*.ts
      - language: javascript
        patterns:
          - scripts/**/*.js
    options:
      printWidth: 100
      tabWidth: 2
      semi: true
      singleQuote: true
      trailingComma: all

  - name: format-config
    languages:
      - language: json
        patterns:
          - "*.json"
          - package.json
      - language: yaml
        patterns:
          - "*.yaml"
          - "*.yml"
    options:
      tabWidth: 2

  - name: format-markdown
    languages:
      - language: markdown
        patterns:
          - "*.md"
          - docs/**/*.md
    options:
      proseWrap: preserve
```

#### 5. CLI Commands

```bash
# Format all files
speclang pipeline format

# Check only (no changes)
speclang pipeline format --check

# Format specific language
speclang pipeline format --language typescript

# Format specific files
speclang pipeline format --files "src/**/*.ts"

# Use config file
speclang pipeline format --config .prettierrc
```

## Test Cases
1. TypeScript files formatted correctly
2. Python files formatted with Black
3. JSON files formatted
4. YAML files formatted
5. Check mode reports unchanged files
6. Multiple languages formatted in one run
7. Options passed to formatters
8. Errors handled gracefully

## Validation
```bash
bun test tests/pipeline/format.test.ts
speclang pipeline format --check
```

## Output Format
After completing, output:
1. Format stage types defined
2. Format runner implemented
3. Language formatters working
4. Check mode implemented
5. Test results
