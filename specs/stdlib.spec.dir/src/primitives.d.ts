/**
 * Primitive type validators and generators
 */
export type UUID = string & {
    __brand: 'UUID';
};
export type DateTime = string & {
    __brand: 'DateTime';
};
export type Email = string & {
    __brand: 'Email';
};
export type URL = string & {
    __brand: 'URL';
};
export type Path = string & {
    __brand: 'Path';
};
export interface TypeValidator<T> {
    validate: (value: unknown) => value is T;
    default: T;
    examples?: T[];
}
export declare const Primitives: {
    String: {
        validate: (value: unknown) => value is string;
        default: string;
        examples: string[];
    };
    Number: {
        validate: (value: unknown) => value is number;
        default: number;
        examples: number[];
    };
    Boolean: {
        validate: (value: unknown) => value is boolean;
        default: boolean;
        examples: boolean[];
    };
    Null: {
        validate: (value: unknown) => value is null;
        default: null;
        examples: any[];
    };
    Undefined: {
        validate: (value: unknown) => value is undefined;
        default: undefined;
        examples: any[];
    };
    UUID: {
        validate: (value: unknown) => value is UUID;
        generate: () => UUID;
        default: UUID;
        examples: string[];
    };
    DateTime: {
        validate: (value: unknown) => value is DateTime;
        now: () => DateTime;
        parse: (value: string) => DateTime | null;
        default: DateTime;
        examples: string[];
    };
    Email: {
        validate: (value: unknown) => value is Email;
        default: Email;
        examples: string[];
    };
    URL: {
        validate: (value: unknown) => value is URL;
        default: URL;
        examples: string[];
    };
    Path: {
        validate: (value: unknown) => value is Path;
        default: Path;
        examples: string[];
    };
};
export declare const isString: (value: unknown) => value is string;
export declare const isNumber: (value: unknown) => value is number;
export declare const isBoolean: (value: unknown) => value is boolean;
export declare const isNull: (value: unknown) => value is null;
export declare const isUndefined: (value: unknown) => value is undefined;
export declare const isFunction: (value: unknown) => value is Function;
export declare const isObject: (value: unknown) => value is Record<string, unknown>;
export declare const isArray: (value: unknown) => value is unknown[];
//# sourceMappingURL=primitives.d.ts.map