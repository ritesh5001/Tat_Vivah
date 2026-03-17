import { renderBrandedEmail } from './layout.js';
export function sellerApprovedTemplate(data) {
    return {
        subject: 'Your TatVivah seller account is approved',
        html: renderBrandedEmail({
            preheader: 'Your seller profile is now active on TatVivah.',
            eyebrow: 'Seller Account',
            title: 'Seller Account Approved',
            message: [
                'Congratulations. Your seller account has been approved by our admin team.',
                'You can now list products and start fulfilling orders from your seller dashboard.',
            ],
            details: data.sellerEmail ? [{ label: 'Approved Account', value: data.sellerEmail }] : [],
            ctaLabel: 'Go To Seller Dashboard',
            ctaUrl: 'https://seller.tatvivahtrends.com/seller/dashboard',
        }),
    };
}
//# sourceMappingURL=seller-approved.js.map