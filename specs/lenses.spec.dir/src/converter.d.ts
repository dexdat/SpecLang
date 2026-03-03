/**
 * SPECLANG-GENERATED: Lens Converter
 * Source: @speclang/lenses
 *
 * Lens-to-lens transformation utilities.
 */
import { LensRegistry } from './registry';
import { LensContext, Block } from './types';
export declare class LensConverter {
    private registry;
    constructor(registry: LensRegistry);
    convert(content: string, fromLens: string, toLens: string, context: LensContext): Promise<string>;
    autoConvert(content: string, targetKind: string, context: LensContext): Promise<string>;
    detectAndParse(content: string, context: LensContext): Promise<{
        block: Block;
        lensName: string;
    }>;
}
//# sourceMappingURL=converter.d.ts.map