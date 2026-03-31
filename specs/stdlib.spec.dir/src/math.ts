// SPECLANG-GENERATED
// Source: @speclang/stdlib/math
// DO NOT EDIT MANUALLY

/**
 * Mathematical functions
 */

/**
 * Add two numbers
 */
export function add(a: number, b: number): number {
  return a + b;
}

/**
 * Subtract b from a
 */
export function subtract(a: number, b: number): number {
  return a - b;
}

/**
 * Multiply two numbers
 */
export function multiply(a: number, b: number): number {
  return a * b;
}

/**
 * Divide a by b
 */
export function divide(a: number, b: number): number {
  return a / b;
}

/**
 * Modulo operation
 */
export function modulo(a: number, b: number): number {
  return a % b;
}

/**
 * Power a^b
 */
export function pow(a: number, b: number): number {
  return Math.pow(a, b);
}

/**
 * Square root
 */
export function sqrt(a: number): number {
  return Math.sqrt(a);
}

/**
 * Absolute value
 */
export function abs(a: number): number {
  return Math.abs(a);
}

/**
 * Round to nearest integer
 */
export function round(a: number): number {
  return Math.round(a);
}

/**
 * Floor to nearest integer less than or equal
 */
export function floor(a: number): number {
  return Math.floor(a);
}

/**
 * Ceil to nearest integer greater than or equal
 */
export function ceil(a: number): number {
  return Math.ceil(a);
}

/**
 * Truncate decimal part
 */
export function trunc(a: number): number {
  return Math.trunc(a);
}

/**
 * Minimum of numbers
 */
export function min(...numbers: number[]): number {
  return Math.min(...numbers);
}

/**
 * Maximum of numbers
 */
export function max(...numbers: number[]): number {
  return Math.max(...numbers);
}

/**
 * Sum of numbers
 */
export function sum(...numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}

/**
 * Product of numbers
 */
export function product(...numbers: number[]): number {
  return numbers.reduce((acc, n) => acc * n, 1);
}

/**
 * Mean (average) of numbers
 */
export function mean(...numbers: number[]): number {
  if (numbers.length === 0) return NaN;
  return sum(...numbers) / numbers.length;
}

/**
 * Median of numbers
 */
export function median(...numbers: number[]): number {
  if (numbers.length === 0) return NaN;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Mode of numbers (most frequent)
 */
export function mode(...numbers: number[]): number[] {
  const freq = new Map<number, number>();
  let maxFreq = 0;
  for (const n of numbers) {
    const f = (freq.get(n) || 0) + 1;
    freq.set(n, f);
    if (f > maxFreq) maxFreq = f;
  }
  const result: number[] = [];
  for (const [n, f] of freq) {
    if (f === maxFreq) result.push(n);
  }
  return result;
}

/**
 * Standard deviation of numbers
 */
export function stdDev(...numbers: number[]): number {
  if (numbers.length === 0) return NaN;
  const m = mean(...numbers);
  const variance = numbers.reduce((acc, n) => acc + Math.pow(n - m, 2), 0) / numbers.length;
  return Math.sqrt(variance);
}

/**
 * Random number between min (inclusive) and max (exclusive)
 */
export function random(min: number = 0, max: number = 1): number {
  return Math.random() * (max - min) + min;
}

/**
 * Random integer between min (inclusive) and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Clamp value between lower and upper bounds
 */
export function clamp(value: number, lower: number, upper: number): number {
  return Math.max(lower, Math.min(upper, value));
}

/**
 * Linear interpolation between start and end by factor t (0-1)
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Check if number is within range [min, max]
 */
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Factorial of non-negative integer
 */
export function factorial(n: number): number {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/**
 * Greatest common divisor using Euclidean algorithm
 */
export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

/**
 * Least common multiple
 */
export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}