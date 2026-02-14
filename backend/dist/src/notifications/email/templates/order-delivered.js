export function orderDeliveredTemplate(data) {
    return {
        subject: `Order #${data.orderId} Delivered`,
        html: `
            <h1>Order Delivered</h1>
            <p>Your order has been delivered.</p>
            <p>Enjoy your purchase!</p>
        `
    };
}
//# sourceMappingURL=order-delivered.js.map