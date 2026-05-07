import type { CreateTryOnInput } from '../validators/tryOn.validation.js';
export type TryOnResponse = {
    predictionId: string;
    status: 'completed';
    productImage: string;
    output: string[];
};
export declare class FashnTryOnService {
    private get apiKey();
    createTryOn(input: CreateTryOnInput): Promise<TryOnResponse>;
    private startPrediction;
    private pollPrediction;
}
export declare const fashnTryOnService: FashnTryOnService;
//# sourceMappingURL=fashnTryOn.service.d.ts.map