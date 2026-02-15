/**
 * Routes Index
 * Central registry for all application routes
 */

export { authRouter } from './auth.routes.js';
export { sellerRouter } from './seller.routes.js';
export { categoryRouter } from './category.routes.js';
export { productRouter } from './product.routes.js';
export { sellerProductRouter } from './seller-product.routes.js';
export { reviewRouter } from './review.routes.js';
export { imagekitRouter } from './imagekit.routes.js';
export { bestsellerRouter } from './bestseller.routes.js';


// Address management
export { addressRouter } from './address.routes.js';

// Cart & Orders domain
export { cartRouter } from './cart.routes.js';
export { checkoutRouter } from './checkout.routes.js';
export { orderRouter } from './order.routes.js';
export { sellerOrderRouter } from './seller-order.routes.js';
export { cancellationRouter } from './cancellation.routes.js';
export { returnRouter } from './return.routes.js';

// Payment & Settlement domain
export { paymentRoutes as paymentRouter } from './payment.routes.js';
export { webhookRoutes as webhookRouter } from './webhook.routes.js';
export { sellerSettlementRoutes as sellerSettlementRouter } from './seller-settlement.routes.js';

// Shipping & Fulfillment domain
export { shipmentRoutes as shipmentRouter } from './shipment.routes.js';
export { sellerShipmentRouter } from './seller-shipment.routes.js';
export { adminShipmentRouter } from './admin-shipment.routes.js';

// Admin domain
export { adminRouter } from './admin.routes.js';
export { adminNotificationRouter } from './admin-notification.routes.js';

// User notifications
export { notificationRouter } from './notification.routes.js';

// Wishlist
export { wishlistRouter } from './wishlist.routes.js';

// Search & Personalization
export { searchRouter } from './search.routes.js';
export { personalizationRouter } from './personalization.routes.js';
