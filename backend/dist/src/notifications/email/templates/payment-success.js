export function paymentSuccessTemplate(data) {
    return {
        subject: `Payment Confirmed for Order #${data.orderId}`,
        html: `
            <h1>Payment Successful</h1>
            <p>Your payment has been confirmed!</p>
            <p><strong>Order ID:</strong> ${data.orderId}</p>
            <p><strong>Amount Paid:</strong> ₹${data.amount}</p>
            <p>Your order is now being processed and will ship soon.</p>
        `
    };
}
//# sourceMappingURL=payment-success.js.map