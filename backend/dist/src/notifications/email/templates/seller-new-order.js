export function sellerNewOrderTemplate(data) {
    return {
        subject: `New Order Received #${data.orderId}`,
        html: `
            <h1>New Order Alert</h1>
            <p>You have received a new order.</p>
            <p><strong>Order ID:</strong> ${data.orderId}</p>
            <p><strong>Items:</strong> ${data.itemsCount}</p>
            <p>Please check your dashboard to fulfill it.</p>
        `
    };
}
//# sourceMappingURL=seller-new-order.js.map