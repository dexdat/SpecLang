class ValidatorClassImpl<T> {
  private rules: Array<{
    predicate: (value: T) => boolean;
    message: string;
    code: string;
  }> = [];

  private constructor() {}

  static create<T>(): ValidatorClass<T> {
    return new ValidatorClassImpl<T>() as unknown as ValidatorClass<T>;
  }

  addRule(predicate: (value: T) => boolean, message: string, code: string): this {
    this.rules.push({ predicate, message, code });
    return this;
  }

  validate(
    value: T
  ): { ok: true; value: T } | { ok: false; error: Array<{ message: string; code: string }> } {
    const errors: Array<{ message: string; code: string }> = [];
    for (const rule of this.rules) {
      if (!rule.predicate(value)) {
        errors.push({ message: rule.message, code: rule.code });
      }
    }
    if (errors.length > 0) {
      return { ok: false, error: errors };
    }
    return { ok: true, value };
  }

  isValid(value: T): boolean {
    for (const rule of this.rules) {
      if (!rule.predicate(value)) return false;
    }
    return true;
  }

  getRuleCount(): number {
    return this.rules.length;
  }
}

type ValidatorClass<T> = ValidatorClassImpl<T>;
const ValidatorClass = ValidatorClassImpl;

export { ValidatorClass };
