export function sellerProductRejectedTemplate(meta) {
    const productTitle = meta?.productTitle ?? 'your product';
    const reason = meta?.reason ?? 'Please review and resubmit.';
    return {
        subject: 'Product Rejected',
        html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="margin-bottom: 8px;">Product Rejected</h2>
        <p>Your product <strong>${productTitle}</strong> was rejected.</p>
        <p><strong>Reason:</strong> ${reason}</p>
      </div>
    `,
    };
}
//# sourceMappingURL=seller-product-rejected.js.map