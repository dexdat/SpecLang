/**
 * SPECLANG-GENERATED: Lens Registry
 * Source: @speclang/lenses
 *
 * Registry for managing and detecting lenses.
 */
import { Lens, LensMatch, LensContext, LensOptions, Block } from './types';
export declare class LensRegistry {
    private lenses;
    private lensesByKind;
    private sortedLenses;
    get lensesMap(): Map<string, Lens>;
    register(lens: Lens): void;
    detect(content: string, explicitKind?: string): LensMatch;
    parse(content: string, context: LensContext): Promise<Block>;
    render(block: Block, context: LensContext): Promise<string>;
    getByKind(kind: string): Lens | undefined;
    getByName(name: string): Lens | undefined;
    list(): Lens[];
}
export declare function createDefaultContext(blockId?: string, filePath?: string, options?: Partial<LensOptions>): LensContext;
//# sourceMappingURL=registry.d.ts.map