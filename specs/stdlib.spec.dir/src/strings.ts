// SPECLANG-GENERATED
// Source: @speclang/stdlib/strings
// DO NOT EDIT MANUALLY

/**
 * String manipulation functions
 */

/**
 * Split string by separator
 */
export function split(str: string, separator: string | RegExp): string[] {
  return str.split(separator);
}

/**
 * Join array of strings with separator
 */
export function join(array: string[], separator: string): string {
  return array.join(separator);
}

/**
 * Trim whitespace from both ends
 */
export function trim(str: string): string {
  return str.trim();
}

/**
 * Trim start only
 */
export function trimStart(str: string): string {
  return str.trimStart();
}

/**
 * Trim end only
 */
export function trimEnd(str: string): string {
  return str.trimEnd();
}

/**
 * Format string using template and arguments
 * Uses positional placeholders {0}, {1}, etc.
 */
export function format(template: string, ...args: any[]): string {
  return template.replace(/{(\d+)}/g, (match, index) => {
    const idx = parseInt(index, 10);
    return idx < args.length ? String(args[idx]) : match;
  });
}

/**
 * Interpolate template with object properties
 * Uses {key} placeholders.
 */
export function interpolate(template: string, obj: Record<string, any>): string {
  return template.replace(/{([^{}]+)}/g, (match, key) => {
    return key in obj ? String(obj[key]) : match;
  });
}

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
  if (str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert to lowercase
 */
export function lowerCase(str: string): string {
  return str.toLowerCase();
}

/**
 * Convert to uppercase
 */
export function upperCase(str: string): string {
  return str.toUpperCase();
}

/**
 * Replace all occurrences of search with replacement
 */
export function replaceAll(str: string, search: string | RegExp, replacement: string): string {
  if (typeof search === 'string') {
    return str.split(search).join(replacement);
  }
  return str.replace(search, replacement);
}

/**
 * Pad start with character to reach target length
 */
export function padStart(str: string, targetLength: number, padChar: string = ' '): string {
  return str.padStart(targetLength, padChar);
}

/**
 * Pad end with character to reach target length
 */
export function padEnd(str: string, targetLength: number, padChar: string = ' '): string {
  return str.padEnd(targetLength, padChar);
}

/**
 * Check if string starts with prefix
 */
export function startsWith(str: string, prefix: string): boolean {
  return str.startsWith(prefix);
}

/**
 * Check if string ends with suffix
 */
export function endsWith(str: string, suffix: string): boolean {
  return str.endsWith(suffix);
}

/**
 * Check if string includes substring
 */
export function includes(str: string, substring: string): boolean {
  return str.includes(substring);
}

/**
 * Repeat string n times
 */
export function repeat(str: string, count: number): string {
  return str.repeat(count);
}

/**
 * Slice string between start and end indices
 */
export function slice(str: string, start: number = 0, end?: number): string {
  return str.slice(start, end);
}

/**
 * Substring between start and end indices
 */
export function substring(str: string, start: number = 0, end?: number): string {
  return str.substring(start, end);
}

/**
 * Template literal tag for safe interpolation
 */
export function safeTemplate(strings: TemplateStringsArray, ...values: any[]): string {
  let result = strings[0];
  for (let i = 0; i < values.length; i++) {
    result += String(values[i]) + strings[i + 1];
  }
  return result;
}