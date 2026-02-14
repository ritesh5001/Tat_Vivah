export const openApiSpec = {
    openapi: "3.0.3",
    info: {
        title: "Auth Service API",
        description: "Authentication & Authorization microservice",
        version: "1.0.0",
    },
    servers: [
        {
            url: "http://localhost:3000",
            description: "Local",
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
    },
    security: [{ bearerAuth: [] }],
    paths: {
        "/v1/auth/register": {
            post: {
                tags: ["Auth"],
                summary: "Register User",
                security: [], // Public endpoint
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["fullName", "email", "phone", "password"],
                                properties: {
                                    fullName: { type: "string", example: "John Doe" },
                                    email: { type: "string", example: "john@test.com" },
                                    phone: { type: "string", example: "9876543210" },
                                    password: { type: "string", example: "SecurePass123" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "User registered successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string", example: "User registered successfully" }
                                    }
                                }
                            }
                        }
                    },
                    "409": {
                        description: "Email or phone already exists",
                    },
                },
            },
        },
        "/v1/auth/admin/register": {
            post: {
                tags: ["Auth"],
                summary: "Register Admin",
                security: [], // Public endpoint
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["firstName", "lastName", "email", "password"],
                                properties: {
                                    firstName: { type: "string", example: "Jane" },
                                    lastName: { type: "string", example: "Smith" },
                                    email: { type: "string", example: "admin@test.com" },
                                    phone: { type: "string", example: "9876543210" },
                                    department: { type: "string", example: "IT" },
                                    designation: { type: "string", example: "Manager" },
                                    password: { type: "string", example: "SecureAdminPass123" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Admin registered successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string", example: "Admin registered successfully" }
                                    }
                                }
                            }
                        }
                    },
                    "409": {
                        description: "Email or phone already exists",
                    },
                },
            },
        },
        "/v1/seller/register": {
            post: {
                tags: ["Auth"],
                summary: "Register Seller",
                security: [], // Public endpoint
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email", "phone", "password"],
                                properties: {
                                    email: { type: "string", example: "seller@test.com" },
                                    phone: { type: "string", example: "9876543211" },
                                    password: { type: "string", example: "SecureSellerPass123" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Seller registered successfully (Pending Approval)",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string", example: "Seller registration submitted for approval" }
                                    }
                                }
                            }
                        }
                    },
                    "409": {
                        description: "Email or phone already exists",
                    },
                },
            },
        },
        "/v1/auth/login": {
            post: {
                tags: ["Auth"],
                summary: "Login",
                security: [], // Public endpoint
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["identifier", "password"],
                                properties: {
                                    identifier: { type: "string", example: "john@test.com" },
                                    password: { type: "string", example: "SecurePass123" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Login successful",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        user: {
                                            type: "object",
                                            properties: {
                                                id: { type: "string" },
                                                email: { type: "string" },
                                                phone: { type: "string" },
                                                role: { type: "string" },
                                                status: { type: "string" }
                                            }
                                        },
                                        accessToken: { type: "string" },
                                        refreshToken: { type: "string" }
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        description: "Invalid credentials",
                    },
                },
            },
        },
        "/v1/auth/refresh": {
            post: {
                tags: ["Auth"],
                summary: "Refresh Token",
                security: [], // Public endpoint
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["refreshToken"],
                                properties: {
                                    refreshToken: { type: "string" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Token refreshed",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        accessToken: { type: "string" },
                                        refreshToken: { type: "string" }
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        description: "Invalid refresh token",
                    },
                },
            },
        },
        "/v1/auth/logout": {
            post: {
                tags: ["Auth"],
                summary: "Logout",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Logged out successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string", example: "Logged out successfully" }
                                    }
                                }
                            }
                        }
                    },
                },
            },
        },
        "/v1/auth/sessions": {
            get: {
                tags: ["Auth"],
                summary: "List active sessions",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Sessions list",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        sessions: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    sessionId: { type: "string" },
                                                    userAgent: { type: "string" },
                                                    ipAddress: { type: "string" },
                                                    createdAt: { type: "string" },
                                                    updatedAt: { type: "string" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                },
            },
        },
        "/v1/auth/sessions/{sessionId}": {
            delete: {
                tags: ["Auth"],
                summary: "Revoke session",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "sessionId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": {
                        description: "Session revoked",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string", example: "Session revoked successfully" }
                                    }
                                }
                            }
                        }
                    },
                    "404": {
                        description: "Session not found",
                    },
                },
            },
        },
        // =====================================================================
        // CATEGORY ENDPOINTS (PUBLIC)
        // =====================================================================
        "/v1/categories": {
            get: {
                tags: ["Categories"],
                summary: "List all categories",
                security: [],
                responses: {
                    "200": {
                        description: "Categories list (cached)",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        categories: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "string" },
                                                    name: { type: "string" },
                                                    slug: { type: "string" },
                                                    isActive: { type: "boolean" },
                                                    createdAt: { type: "string" },
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                },
            },
        },
        // =====================================================================
        // PRODUCT ENDPOINTS (PUBLIC)
        // =====================================================================
        "/v1/products": {
            get: {
                tags: ["Products"],
                summary: "List published products (paginated, cached)",
                security: [],
                parameters: [
                    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
                    { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
                    { name: "categoryId", in: "query", schema: { type: "string" } },
                    { name: "search", in: "query", schema: { type: "string" } },
                ],
                responses: {
                    "200": {
                        description: "Paginated products list",
                    },
                },
            },
        },
        "/v1/products/{id}": {
            get: {
                tags: ["Products"],
                summary: "Get product details (cached)",
                security: [],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                ],
                responses: {
                    "200": { description: "Product with variants and inventory" },
                    "404": { description: "Product not found" },
                },
            },
        },
        // =====================================================================
        // SELLER PRODUCT ENDPOINTS (PROTECTED)
        // =====================================================================
        "/v1/seller/products": {
            post: {
                tags: ["Seller Products"],
                summary: "Create product (SELLER only)",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["categoryId", "title"],
                                properties: {
                                    categoryId: { type: "string" },
                                    title: { type: "string" },
                                    description: { type: "string" },
                                    isPublished: { type: "boolean", default: false },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "201": { description: "Product created" },
                    "400": { description: "Invalid category ID" },
                    "403": { description: "Not a seller" },
                },
            },
            get: {
                tags: ["Seller Products"],
                summary: "List my products (SELLER only)",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": { description: "Seller's products" },
                },
            },
        },
        "/v1/seller/products/{id}": {
            put: {
                tags: ["Seller Products"],
                summary: "Update my product (SELLER only)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                ],
                requestBody: {
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    categoryId: { type: "string" },
                                    title: { type: "string" },
                                    description: { type: "string" },
                                    isPublished: { type: "boolean" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": { description: "Product updated" },
                    "403": { description: "Not product owner" },
                },
            },
            delete: {
                tags: ["Seller Products"],
                summary: "Delete my product (SELLER only)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                ],
                responses: {
                    "200": { description: "Product deleted" },
                    "403": { description: "Not product owner" },
                },
            },
        },
        "/v1/seller/products/{id}/variants": {
            post: {
                tags: ["Seller Products"],
                summary: "Add variant to product (SELLER only)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["sku", "price"],
                                properties: {
                                    sku: { type: "string" },
                                    price: { type: "number" },
                                    compareAtPrice: { type: "number" },
                                    initialStock: { type: "integer", default: 0 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "201": { description: "Variant created" },
                    "403": { description: "Not product owner" },
                    "409": { description: "SKU already exists" },
                },
            },
        },
        "/v1/seller/products/variants/{id}": {
            put: {
                tags: ["Seller Products"],
                summary: "Update variant (SELLER only)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                ],
                requestBody: {
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    price: { type: "number" },
                                    compareAtPrice: { type: "number" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": { description: "Variant updated" },
                    "403": { description: "Not product owner" },
                },
            },
        },
        "/v1/seller/products/variants/{id}/stock": {
            put: {
                tags: ["Seller Products"],
                summary: "Update stock (SELLER only)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["stock"],
                                properties: {
                                    stock: { type: "integer", minimum: 0 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": { description: "Stock updated" },
                    "403": { description: "Not product owner" },
                },
            },
        },
        // =====================================================================
        // CART ENDPOINTS (BUYER ONLY)
        // =====================================================================
        "/v1/cart": {
            get: {
                tags: ["Cart"],
                summary: "Get shopping cart (cached)",
                description: "Returns the buyer's shopping cart with all items and current prices",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Cart with items",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        cart: {
                                            type: "object",
                                            properties: {
                                                id: { type: "string" },
                                                userId: { type: "string" },
                                                items: {
                                                    type: "array",
                                                    items: {
                                                        type: "object",
                                                        properties: {
                                                            id: { type: "string" },
                                                            productId: { type: "string" },
                                                            variantId: { type: "string" },
                                                            quantity: { type: "integer" },
                                                            priceSnapshot: { type: "number" },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "403": { description: "Not a buyer (USER role required)" },
                },
            },
        },
        "/v1/cart/items": {
            post: {
                tags: ["Cart"],
                summary: "Add item to cart",
                description: "Adds a product variant to cart. Price is snapshotted at add time. Validates stock availability.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["productId", "variantId", "quantity"],
                                properties: {
                                    productId: { type: "string" },
                                    variantId: { type: "string" },
                                    quantity: { type: "integer", minimum: 1, maximum: 100 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "201": { description: "Item added to cart" },
                    "400": { description: "Insufficient stock or invalid data" },
                    "403": { description: "Not a buyer" },
                    "404": { description: "Product or variant not found" },
                },
            },
        },
        "/v1/cart/items/{id}": {
            put: {
                tags: ["Cart"],
                summary: "Update cart item quantity",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["quantity"],
                                properties: {
                                    quantity: { type: "integer", minimum: 1, maximum: 100 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": { description: "Cart item updated" },
                    "400": { description: "Insufficient stock" },
                    "404": { description: "Cart item not found" },
                },
            },
            delete: {
                tags: ["Cart"],
                summary: "Remove item from cart",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                ],
                responses: {
                    "200": { description: "Item removed from cart" },
                    "404": { description: "Cart item not found" },
                },
            },
        },
        // =====================================================================
        // CHECKOUT ENDPOINT
        // =====================================================================
        "/v1/checkout": {
            post: {
                tags: ["Checkout"],
                summary: "Process checkout",
                description: "Validates inventory, reserves stock, creates order, and clears cart. This is a transactional operation.",
                security: [{ bearerAuth: [] }],
                responses: {
                    "201": {
                        description: "Order placed successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        order: {
                                            type: "object",
                                            properties: {
                                                id: { type: "string" },
                                                userId: { type: "string" },
                                                status: { type: "string", enum: ["PLACED", "CONFIRMED", "CANCELLED"] },
                                                totalAmount: { type: "number" },
                                                createdAt: { type: "string", format: "date-time" },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "400": { description: "Cart empty or insufficient stock" },
                    "403": { description: "Not a buyer" },
                },
            },
        },
        // =====================================================================
        // BUYER ORDER ENDPOINTS
        // =====================================================================
        "/v1/orders": {
            get: {
                tags: ["Orders (Buyer)"],
                summary: "List buyer's orders (cached)",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "List of orders",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        orders: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "string" },
                                                    status: { type: "string" },
                                                    totalAmount: { type: "number" },
                                                    createdAt: { type: "string" },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/v1/orders/{id}": {
            get: {
                tags: ["Orders (Buyer)"],
                summary: "Get order details (cached)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                ],
                responses: {
                    "200": { description: "Order with items" },
                    "404": { description: "Order not found" },
                },
            },
        },
        // =====================================================================
        // SELLER ORDER ENDPOINTS
        // =====================================================================
        "/v1/seller/orders": {
            get: {
                tags: ["Orders (Seller)"],
                summary: "List seller's order items",
                description: "Returns all order items that belong to this seller across all orders",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "List of order items for seller",
                    },
                    "403": { description: "Not a seller" },
                },
            },
        },
        "/v1/seller/orders/{id}": {
            get: {
                tags: ["Orders (Seller)"],
                summary: "Get seller's view of order",
                description: "Returns only the order items belonging to this seller for a specific order",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                ],
                responses: {
                    "200": { description: "Order items belonging to seller" },
                    "403": { description: "No items in this order belong to you" },
                    "404": { description: "Order not found" },
                },
            },
        },
        // =====================================================================
        // PAYMENT ENDPOINTS
        // =====================================================================
        "/v1/payments/initiate": {
            post: {
                tags: ["Payments"],
                summary: "Initiate payment flow",
                description: "Starts a payment for an order. Creates a pending payment record and returns provider-specific checkout info. For RAZORPAY, returns order ID and key for frontend checkout.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["orderId", "provider"],
                                properties: {
                                    orderId: { type: "string", description: "Order ID to pay for" },
                                    provider: {
                                        type: "string",
                                        enum: ["MOCK", "RAZORPAY", "STRIPE"],
                                        description: "Payment provider to use"
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Payment initiated successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                paymentId: { type: "string", description: "Internal payment ID" },
                                                orderId: { type: "string", description: "For RAZORPAY: Razorpay order ID (order_xxx). For MOCK: mock provider ID" },
                                                amount: { type: "number", description: "Amount in smallest currency unit (paise for INR)" },
                                                currency: { type: "string", example: "INR" },
                                                key: { type: "string", description: "RAZORPAY only: Public key ID for frontend" },
                                                provider: { type: "string", enum: ["RAZORPAY", "MOCK"] },
                                                checkoutUrl: { type: "string", description: "MOCK only: URL for test checkout" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "400": { description: "Order already paid, provider not supported, or invalid request" },
                    "404": { description: "Order not found" },
                    "500": { description: "Razorpay not configured or provider error" },
                },
            },
        },
        "/v1/payments/{orderId}": {
            get: {
                tags: ["Payments"],
                summary: "Get payment details",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "orderId", in: "path", required: true, schema: { type: "string" } },
                ],
                responses: {
                    "200": {
                        description: "Payment details including status and provider IDs",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                id: { type: "string" },
                                                orderId: { type: "string" },
                                                status: { type: "string", enum: ["INITIATED", "PENDING", "SUCCESS", "FAILED"] },
                                                provider: { type: "string", enum: ["MOCK", "RAZORPAY", "STRIPE"] },
                                                providerOrderId: { type: "string", description: "Razorpay order_id" },
                                                providerPaymentId: { type: "string", description: "Razorpay payment_id" },
                                                amount: { type: "number" },
                                                currency: { type: "string" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "403": { description: "Unauthorized" },
                    "404": { description: "Payment not found" },
                },
            },
        },
        "/v1/payments/webhook/{provider}": {
            post: {
                tags: ["Payments"],
                summary: "Handle payment webhook",
                description: `Receives status updates from payment providers. Public endpoint - NO authentication required.

**Security Notes:**
- RAZORPAY: Signature verified via x-razorpay-signature header using HMAC SHA256
- MOCK: No signature verification (testing only)

**Razorpay Events Handled:**
- payment.captured → Payment SUCCESS, Order CONFIRMED, Settlements created
- payment.failed → Payment FAILED

**Idempotency:** Duplicate webhooks are safely ignored.`,
                security: [], // Public - verified by signature
                parameters: [
                    {
                        name: "provider",
                        in: "path",
                        required: true,
                        schema: { type: "string", enum: ["RAZORPAY", "MOCK"] },
                        description: "Payment provider name"
                    },
                    {
                        name: "x-razorpay-signature",
                        in: "header",
                        required: false,
                        schema: { type: "string" },
                        description: "RAZORPAY only: Webhook signature for verification"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                description: "Provider-specific webhook payload",
                                example: {
                                    event: "payment.captured",
                                    payload: {
                                        payment: {
                                            entity: {
                                                id: "pay_xxx",
                                                order_id: "order_xxx",
                                                amount: 100000,
                                                status: "captured"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    "200": { description: "Webhook processed successfully" },
                    "400": { description: "Invalid provider" },
                    "401": { description: "Invalid webhook signature" },
                },
            },
        },
        // =====================================================================
        // SETTLEMENT ENDPOINTS (SELLER)
        // =====================================================================
        "/v1/seller/settlements": {
            get: {
                tags: ["Settlements"],
                summary: "List seller settlements",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "List of settlements",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "string" },
                                                    amount: { type: "number" },
                                                    status: { type: "string", enum: ["PENDING", "PAID", "FAILED"] },
                                                    createdAt: { type: "string", format: "date-time" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "403": { description: "Not a seller" },
                },
            },
        },
        // =====================================================================
        // ADMIN ENDPOINTS
        // =====================================================================
        "/v1/admin/sellers": {
            get: {
                tags: ["Admin"],
                summary: "List all sellers",
                description: "List all sellers with their status. Requires ADMIN or SUPER_ADMIN role.",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "List of sellers",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        sellers: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "string" },
                                                    email: { type: "string" },
                                                    phone: { type: "string" },
                                                    role: { type: "string" },
                                                    status: { type: "string", enum: ["PENDING", "ACTIVE", "SUSPENDED"] },
                                                    createdAt: { type: "string", format: "date-time" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "401": { description: "Unauthorized" },
                    "403": { description: "Forbidden - requires ADMIN role" },
                },
            },
        },
        "/v1/admin/sellers/{id}/approve": {
            put: {
                tags: ["Admin"],
                summary: "Approve a pending seller",
                description: "Approves a seller and sets their status to ACTIVE. Requires ADMIN or SUPER_ADMIN role.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        description: "Seller user ID"
                    }
                ],
                responses: {
                    "200": {
                        description: "Seller approved successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string", example: "Seller approved successfully" },
                                        seller: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    "400": { description: "Seller is not pending approval" },
                    "404": { description: "Seller not found" },
                },
            },
        },
        "/v1/admin/sellers/{id}/suspend": {
            put: {
                tags: ["Admin"],
                summary: "Suspend a seller",
                description: "Suspends a seller account. Requires ADMIN or SUPER_ADMIN role.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        description: "Seller user ID"
                    }
                ],
                responses: {
                    "200": {
                        description: "Seller suspended successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string", example: "Seller suspended successfully" },
                                        seller: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    "400": { description: "Seller is already suspended" },
                    "404": { description: "Seller not found" },
                },
            },
        },
        "/v1/admin/products/pending": {
            get: {
                tags: ["Admin"],
                summary: "List products pending moderation",
                description: "Lists all products waiting for admin approval. Requires ADMIN or SUPER_ADMIN role.",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "List of pending products",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        products: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "string" },
                                                    title: { type: "string" },
                                                    sellerId: { type: "string" },
                                                    isPublished: { type: "boolean" },
                                                    moderation: {
                                                        type: "object",
                                                        properties: {
                                                            status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
                                                            reason: { type: "string" },
                                                            reviewedAt: { type: "string", format: "date-time" }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                },
            },
        },
        "/v1/admin/products/{id}/approve": {
            put: {
                tags: ["Admin"],
                summary: "Approve a product",
                description: "Approves a product and publishes it. Requires ADMIN or SUPER_ADMIN role.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        description: "Product ID"
                    }
                ],
                responses: {
                    "200": {
                        description: "Product approved and published",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string", example: "Product approved and published" },
                                        product: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    "404": { description: "Product not found" },
                },
            },
        },
        "/v1/admin/products/{id}/reject": {
            put: {
                tags: ["Admin"],
                summary: "Reject a product",
                description: "Rejects a product with a reason. Requires ADMIN or SUPER_ADMIN role.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        description: "Product ID"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["reason"],
                                properties: {
                                    reason: { type: "string", example: "Product violates content policy" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    "200": {
                        description: "Product rejected",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string", example: "Product rejected" },
                                        product: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    "404": { description: "Product not found" },
                },
            },
        },
        "/v1/admin/orders": {
            get: {
                tags: ["Admin"],
                summary: "List all orders",
                description: "Lists all orders in the system. Requires ADMIN or SUPER_ADMIN role.",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "List of orders",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        orders: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "string" },
                                                    userId: { type: "string" },
                                                    status: { type: "string" },
                                                    totalAmount: { type: "number" },
                                                    createdAt: { type: "string", format: "date-time" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                },
            },
        },
        "/v1/admin/orders/{id}/cancel": {
            put: {
                tags: ["Admin"],
                summary: "Cancel an order",
                description: "Cancels an order (not for delivered orders). Requires ADMIN or SUPER_ADMIN role.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        description: "Order ID"
                    }
                ],
                responses: {
                    "200": {
                        description: "Order cancelled successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string", example: "Order cancelled successfully" },
                                        order: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    "400": { description: "Cannot cancel delivered order" },
                    "404": { description: "Order not found" },
                },
            },
        },
        "/v1/admin/orders/{id}/force-confirm": {
            put: {
                tags: ["Admin"],
                summary: "Force confirm an order",
                description: "Force confirms an order bypassing payment. Requires SUPER_ADMIN role only.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        description: "Order ID"
                    }
                ],
                responses: {
                    "200": {
                        description: "Order force-confirmed (payment bypassed)",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string", example: "Order force-confirmed (payment bypassed)" },
                                        order: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    "400": { description: "Cannot force confirm this order" },
                    "403": { description: "Requires SUPER_ADMIN role" },
                    "404": { description: "Order not found" },
                },
            },
        },
        "/v1/admin/payments": {
            get: {
                tags: ["Admin"],
                summary: "List all payments",
                description: "Lists all payments in the system (read-only). Requires ADMIN or SUPER_ADMIN role.",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "List of payments",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        payments: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "string" },
                                                    orderId: { type: "string" },
                                                    amount: { type: "number" },
                                                    status: { type: "string", enum: ["INITIATED", "SUCCESS", "FAILED"] },
                                                    provider: { type: "string" },
                                                    createdAt: { type: "string", format: "date-time" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                },
            },
        },
        "/v1/admin/settlements": {
            get: {
                tags: ["Admin"],
                summary: "List all settlements",
                description: "Lists all seller settlements (read-only). Requires ADMIN or SUPER_ADMIN role.",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "List of settlements",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        settlements: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "string" },
                                                    sellerId: { type: "string" },
                                                    amount: { type: "number" },
                                                    status: { type: "string", enum: ["PENDING", "PAID"] },
                                                    createdAt: { type: "string", format: "date-time" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                },
            },
        },
        "/v1/admin/audit-logs": {
            get: {
                tags: ["Admin"],
                summary: "List audit logs",
                description: "Lists admin action audit logs with optional filters. Requires ADMIN or SUPER_ADMIN role.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "entityType",
                        in: "query",
                        schema: { type: "string", enum: ["USER", "PRODUCT", "ORDER", "PAYMENT"] },
                        description: "Filter by entity type"
                    },
                    {
                        name: "entityId",
                        in: "query",
                        schema: { type: "string" },
                        description: "Filter by entity ID"
                    },
                    {
                        name: "actorId",
                        in: "query",
                        schema: { type: "string" },
                        description: "Filter by admin user ID who performed the action"
                    },
                    {
                        name: "startDate",
                        in: "query",
                        schema: { type: "string", format: "date-time" },
                        description: "Filter logs after this date"
                    },
                    {
                        name: "endDate",
                        in: "query",
                        schema: { type: "string", format: "date-time" },
                        description: "Filter logs before this date"
                    }
                ],
                responses: {
                    "200": {
                        description: "List of audit logs",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        auditLogs: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "string" },
                                                    actorId: { type: "string" },
                                                    action: { type: "string" },
                                                    entityType: { type: "string" },
                                                    entityId: { type: "string" },
                                                    metadata: { type: "object" },
                                                    createdAt: { type: "string", format: "date-time" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                },
            },
        },
        // =====================================================================
        // SHIPPING ENDPOINTS
        // =====================================================================
        "/v1/orders/{orderId}/tracking": {
            get: {
                tags: ["Shipping (Buyer)"],
                summary: "Get shipment tracking",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "orderId", in: "path", required: true, schema: { type: "string" } },
                ],
                responses: {
                    "200": {
                        description: "Tracking info",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        orderId: { type: "string" },
                                        status: { type: "string" },
                                        shipments: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    shipmentId: { type: "string" },
                                                    trackingNumber: { type: "string" },
                                                    carrier: { type: "string" },
                                                    status: { type: "string" },
                                                    estimatedDelivery: { type: "string", format: "date-time" },
                                                    events: { type: "array", items: { type: "object" } }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "403": { description: "Not owner of order" },
                },
            },
        },
        "/v1/seller/shipments": {
            get: {
                tags: ["Shipping (Seller)"],
                summary: "List seller's shipments",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": { description: "List of shipments" },
                    "403": { description: "Not a seller" },
                },
            },
        },
        "/v1/seller/shipments/{orderId}/create": {
            post: {
                tags: ["Shipping (Seller)"],
                summary: "Create shipment",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "orderId", in: "path", required: true, schema: { type: "string" } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["carrier", "trackingNumber"],
                                properties: {
                                    carrier: { type: "string" },
                                    trackingNumber: { type: "string" },
                                    estimatedDeliveryDate: { type: "string", format: "date-time" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "201": { description: "Shipment created" },
                    "400": { description: "Order not confirmed or all items shipped" },
                },
            },
        },
        "/v1/seller/shipments/{id}/ship": {
            put: {
                tags: ["Shipping (Seller)"],
                summary: "Mark as SHIPPED",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                ],
                requestBody: {
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    note: { type: "string" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": { description: "Status updated to SHIPPED" },
                },
            },
        },
        "/v1/seller/shipments/{id}/deliver": {
            put: {
                tags: ["Shipping (Seller)"],
                summary: "Mark as DELIVERED",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                ],
                requestBody: {
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    note: { type: "string" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": { description: "Status updated to DELIVERED" },
                },
            },
        },
        "/v1/admin/shipments/{id}/override-status": {
            put: {
                tags: ["Shipping (Admin)"],
                summary: "Override shipment status",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["status", "note"],
                                properties: {
                                    status: { type: "string", enum: ["CREATED", "SHIPPED", "DELIVERED", "CANCELLED"] },
                                    note: { type: "string" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": { description: "Status overridden" },
                    "403": { description: "Not an admin" },
                },
            },
        },
        // =====================================================================
        // ADMIN NOTIFICATION ENDPOINTS
        // =====================================================================
        "/v1/admin/notifications": {
            get: {
                tags: ["Notifications (Admin)"],
                summary: "List notifications",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "page", in: "query", schema: { type: "integer" } },
                    { name: "limit", in: "query", schema: { type: "integer" } }
                ],
                responses: {
                    "200": {
                        description: "List of notifications",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "string" },
                                                    type: { type: "string" },
                                                    channel: { type: "string" },
                                                    status: { type: "string" },
                                                    userId: { type: "string" },
                                                    subject: { type: "string" },
                                                    content: { type: "string" },
                                                    createdAt: { type: "string", format: "date-time" }
                                                }
                                            }
                                        },
                                        meta: {
                                            type: "object",
                                            properties: {
                                                total: { type: "integer" },
                                                page: { type: "integer" },
                                                limit: { type: "integer" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v1/admin/notifications/{id}": {
            get: {
                tags: ["Notifications (Admin)"],
                summary: "Get notification details",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } }
                ],
                responses: {
                    "200": {
                        description: "Notification details",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                id: { type: "string" },
                                                type: { type: "string" },
                                                content: { type: "string" },
                                                metadata: { type: "object" },
                                                events: { type: "array", items: { type: "object" } }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v1/imagekit/auth": {
            get: {
                tags: ["Utils"],
                summary: "Get ImageKit Authenticator",
                security: [],
                responses: {
                    "200": {
                        description: "ImageKit Auth Parameters",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        token: { type: "string" },
                                        expire: { type: "integer" },
                                        signature: { type: "string" }
                                    }
                                }
                            }
                        }
                    },
                    "500": {
                        description: "ImageKit configuration missing"
                    }
                }
            }
        },
    },
};
//# sourceMappingURL=openapi.js.map