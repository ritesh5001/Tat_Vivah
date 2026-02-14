import { Order, User, OrderItem } from '@prisma/client';
export declare enum PaymentStatus {
    INITIATED = "INITIATED",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED"
}
export declare enum PaymentProvider {
    RAZORPAY = "RAZORPAY",
    STRIPE = "STRIPE",
    MOCK = "MOCK"
}
export declare enum PaymentEventType {
    INITIATED = "INITIATED",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
    WEBHOOK = "WEBHOOK"
}
export declare enum SettlementStatus {
    PENDING = "PENDING",
    PAID = "PAID"
}
export interface IPayment {
    id: string;
    orderId: string;
    userId: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    provider: PaymentProvider;
    providerPaymentId?: string | null;
    createdAt: Date;
    updatedAt: Date;
    order?: Order;
    user?: User;
}
export interface IPaymentEvent {
    id: string;
    paymentId: string;
    type: PaymentEventType;
    payload?: any;
    createdAt: Date;
}
export interface ISellerSettlement {
    id: string;
    sellerId: string;
    orderItemId: string;
    amount: number;
    status: SettlementStatus;
    createdAt: Date;
    seller?: User;
    orderItem?: OrderItem;
}
export interface InitiatePaymentDTO {
    orderId: string;
    provider: PaymentProvider;
}
export interface PaymentWebhookDTO {
    provider: PaymentProvider;
    payload: any;
}
//# sourceMappingURL=payment.types.d.ts.map