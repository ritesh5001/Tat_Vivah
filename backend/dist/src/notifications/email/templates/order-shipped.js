export function orderShippedTemplate(data) {
    return {
        subject: `Your Order #${data.orderId} has Shipped!`,
        html: `
            <h1>Order Shipped</h1>
            <p>Your order is on the way.</p>
            <p><strong>Carrier:</strong> ${data.carrier}</p>
            <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
        `
    };
}
//# sourceMappingURL=order-shipped.js.map