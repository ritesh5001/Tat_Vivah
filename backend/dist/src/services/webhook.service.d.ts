export declare class WebhookService {
    processWebhook(provider: string, payload: any, signature: string, rawBody?: string): Promise<void>;
    private handleMockWebhook;
    private handleRazorpayWebhook;
    private handleRazorpayPaymentCaptured;
    private handleRazorpayPaymentFailed;
    private mapProvider;
}
export declare const webhookService: WebhookService;
//# sourceMappingURL=webhook.service.d.ts.map