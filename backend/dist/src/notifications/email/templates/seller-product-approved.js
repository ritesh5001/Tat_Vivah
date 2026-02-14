export function sellerProductApprovedTemplate(meta) {
    const productTitle = meta?.productTitle ?? 'your product';
    return {
        subject: 'Product Approved',
        html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="margin-bottom: 8px;">Product Approved</h2>
        <p>Your product <strong>${productTitle}</strong> has been approved and is now live in the marketplace.</p>
      </div>
    `,
    };
}
//# sourceMappingURL=seller-product-approved.js.map