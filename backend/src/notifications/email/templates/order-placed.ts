import { EmailTemplateResult } from '../../types.js';
import { renderBrandedEmail } from './layout.js';

export function orderPlacedTemplate(data: { orderId: string, totalAmount: number }): EmailTemplateResult {
    return {
        subject: `Order Confirmed #${data.orderId}`,
        html: renderBrandedEmail({
            preheader: `Order #${data.orderId} is confirmed and being prepared.`,
            eyebrow: 'Order Confirmation',
            title: 'Your Order Is Confirmed',
            greeting: 'Thank you for choosing TatVivah.',
            message: [
                'We have successfully received your order and our partner seller has started processing it.',
                'You will receive another update as soon as your shipment is dispatched.',
            ],
            details: [
                { label: 'Order ID', value: data.orderId },
                { label: 'Total Amount', value: `INR ${Number(data.totalAmount).toLocaleString('en-IN')}` },
            ],
            ctaLabel: 'Track Orders',
            ctaUrl: 'https://tatvivahtrends.com/user/orders',
            accentText: 'Please keep this confirmation for your records.',
        }),
    };
}
