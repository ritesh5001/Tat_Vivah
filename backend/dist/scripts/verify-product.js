import { request, LOG, ensureSeller, ensureBuyer, ensureAdminToken, prisma } from './test-utils.js';
import { generateAccessToken, Role } from '../src/utils/jwt.util.js';
async function verifyProduct() {
    LOG.info(`Starting Product Service Verification`);
    // 1. Fetch Categories
    LOG.step('1. Fetch Categories');
    const categoriesRes = await request('/v1/categories');
    let categoryId = '';
    if (categoriesRes.status === 200 && Array.isArray(categoriesRes.data.categories) && categoriesRes.data.categories.length > 0) {
        categoryId = categoriesRes.data.categories[0].id;
        LOG.success(`Fethed ${categoriesRes.data.categories.length} categories. Using ID: ${categoryId}`);
    }
    else {
        LOG.error('Failed to fetch categories or empty list', categoriesRes);
        process.exit(1);
    }
    // 2. Seller Login
    LOG.step('2. Seller Login');
    const sellerCreds = await ensureSeller();
    const loginRes = await request('/v1/auth/login', 'POST', {
        identifier: sellerCreds.email,
        password: sellerCreds.password
    });
    let sellerToken = '';
    if (loginRes.status === 200 && loginRes.data.accessToken) {
        sellerToken = loginRes.data.accessToken;
        LOG.success('Seller login successful');
    }
    else {
        LOG.error('Seller login failed', loginRes);
        process.exit(1);
    }
    // 3. Create Product
    LOG.step('3. Create Product (SELLER)');
    const productData = {
        categoryId,
        title: `Test Product ${Date.now()}`,
        description: 'Automated test product description',
        isPublished: true
    };
    const createProductRes = await request('/v1/seller/products', 'POST', productData, sellerToken);
    let productId = '';
    if (createProductRes.status === 201 && createProductRes.data.product?.id) {
        productId = createProductRes.data.product.id;
        LOG.success(`Product created with ID: ${productId}`);
    }
    else {
        LOG.error('Product creation failed', createProductRes);
        process.exit(1);
    }
    // 4. Create Variant
    LOG.step('4. Create Product Variant');
    const variantData = {
        sku: `SKU-${Date.now()}`,
        price: 999,
        compareAtPrice: 1299,
        initialStock: 0
    };
    const createVariantRes = await request(`/v1/seller/products/${productId}/variants`, 'POST', variantData, sellerToken);
    let variantId = '';
    if (createVariantRes.status === 201 && createVariantRes.data.variant?.id) {
        variantId = createVariantRes.data.variant.id;
        LOG.success(`Variant created with ID: ${variantId}`);
    }
    else {
        LOG.error('Variant creation failed', createVariantRes);
        process.exit(1);
    }
    // 5. Update Inventory
    LOG.step('5. Update Inventory Stock');
    const updateStockRes = await request(`/v1/seller/products/variants/${variantId}/stock`, 'PUT', { stock: 10 }, sellerToken);
    if (updateStockRes.status === 200 && updateStockRes.data.inventory?.stock === 10) {
        LOG.success('Stock updated to 10');
    }
    else {
        LOG.error('Stock update failed', updateStockRes);
        process.exit(1);
    }
    const adminToken = await ensureAdminToken();
    await request(`/v1/admin/products/${productId}/approve`, 'PUT', {}, adminToken);
    await request(`/v1/admin/products/${productId}/set-price`, 'PATCH', { adminListingPrice: 1099 }, adminToken);
    // 6. Fetch Product Publicly
    LOG.step('6. Fetch Product Publicly');
    const publicListRes = await request('/v1/products');
    if (publicListRes.status === 200 && Array.isArray(publicListRes.data.data)) {
        const found = publicListRes.data.data.find((p) => p.id === productId);
        if (found) {
            LOG.success('Created product found in public listing');
        }
        else {
            LOG.error('Created product NOT found in public listing', publicListRes.data);
            process.exit(1);
        }
    }
    else {
        LOG.error('Failed to fetch public products', publicListRes);
        process.exit(1);
    }
    // 7. Fetch Product Detail
    LOG.step('7. Fetch Product Detail');
    const detailRes = await request(`/v1/products/${productId}`);
    if (detailRes.status === 200 && detailRes.data.product) {
        const hasVariant = detailRes.data.product.variants.some((v) => v.id === variantId);
        if (hasVariant) {
            LOG.success('Product detail fetched with variant');
        }
        else {
            LOG.error('Product detail missing variant', detailRes.data);
            process.exit(1);
        }
    }
    else {
        LOG.error('Failed to fetch product detail', detailRes);
        process.exit(1);
    }
    // 8. Authorization Checks
    LOG.step('8. Authorization Checks');
    // 8a. Buyer cannot create product
    const buyerCreds = await ensureBuyer();
    const buyerLogin = await request('/v1/auth/login', 'POST', { identifier: buyerCreds.email, password: buyerCreds.password });
    const buyerToken = buyerLogin.data.accessToken;
    const buyerAccessRes = await request('/v1/seller/products', 'POST', productData, buyerToken);
    if (buyerAccessRes.status === 403) {
        LOG.success('Buyer blocked from creating products');
    }
    else {
        LOG.error('Buyer was able to access seller route!', buyerAccessRes);
        process.exit(1);
    }
    // 8b. Seller ownership check (cannot delete another's product)
    const email2 = `seller2-conflict-${Date.now()}@verified.com`;
    const seller2 = await prisma.user.create({
        data: {
            email: email2,
            phone: `88${Date.now().toString().slice(-8)}`,
            passwordHash: 'hash',
            status: 'ACTIVE',
            role: 'SELLER',
            isEmailVerified: true,
            isPhoneVerified: true,
        },
    });
    const seller2Token = generateAccessToken({
        userId: seller2.id,
        email: seller2.email,
        phone: seller2.phone,
        role: Role.SELLER,
        status: seller2.status,
        isEmailVerified: true,
        isPhoneVerified: true,
    });
    const unauthorizedUpdate = await request(`/v1/seller/products/${productId}`, 'DELETE', undefined, seller2Token);
    if (unauthorizedUpdate.status === 403) {
        LOG.success('Seller prevented from deleting another seller\'s product');
    }
    else {
        LOG.error('Seller 2 was able to delete Seller 1\'s product!', unauthorizedUpdate);
        process.exit(1);
    }
    console.log(`\n🎉 PRODUCT SERVICE VERIFICATION PASSED`);
}
// Allow running directly
if (import.meta.url === `file://${process.argv[1]}`) {
    verifyProduct()
        .catch(console.error)
        .finally(async () => {
        await prisma.$disconnect();
    });
}
export { verifyProduct };
//# sourceMappingURL=verify-product.js.map