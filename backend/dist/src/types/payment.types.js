export var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["INITIATED"] = "INITIATED";
    PaymentStatus["SUCCESS"] = "SUCCESS";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (PaymentStatus = {}));
export var PaymentProvider;
(function (PaymentProvider) {
    PaymentProvider["RAZORPAY"] = "RAZORPAY";
    PaymentProvider["STRIPE"] = "STRIPE";
    PaymentProvider["MOCK"] = "MOCK";
})(PaymentProvider || (PaymentProvider = {}));
export var PaymentEventType;
(function (PaymentEventType) {
    PaymentEventType["INITIATED"] = "INITIATED";
    PaymentEventType["SUCCESS"] = "SUCCESS";
    PaymentEventType["FAILED"] = "FAILED";
    PaymentEventType["WEBHOOK"] = "WEBHOOK";
})(PaymentEventType || (PaymentEventType = {}));
export var SettlementStatus;
(function (SettlementStatus) {
    SettlementStatus["PENDING"] = "PENDING";
    SettlementStatus["PAID"] = "PAID";
})(SettlementStatus || (SettlementStatus = {}));
//# sourceMappingURL=payment.types.js.map