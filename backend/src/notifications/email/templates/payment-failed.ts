import { EmailTemplateResult } from '../../types.js';

export function paymentFailedTemplate(data: { orderId: string }): EmailTemplateResult {
    return {
        subject: `Payment Failed for Order #${data.orderId}`,
        html: `
            <h1>Payment Failed</h1>
            <p>Unfortunately, your payment could not be processed.</p>
            <p><strong>Order ID:</strong> ${data.orderId}</p>
            <p>Please try again or use a different payment method. Your order will be held for 30 minutes.</p>
        `
    };
}
