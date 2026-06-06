import logger from './logger.js';

const eventLogger = {
  auth: {
    registered: (data) => logger.info('User registered', { requestId: data.requestId, traceId: data.traceId, type: 'auth', event: 'user_registered', ...data }),
    loginSuccess: (data) => logger.info('Login success', { requestId: data.requestId, traceId: data.traceId, type: 'auth', event: 'login_success', ...data }),
    loginFailed: (data) => logger.warn('Login failed', { requestId: data.requestId, traceId: data.traceId, type: 'auth', event: 'login_failed', ...data }),
    logout: (data) => logger.info('User logged out', { requestId: data.requestId, traceId: data.traceId, type: 'auth', event: 'logout', ...data }),
    tokenExpired: (data) => logger.warn('Token expired', { requestId: data.requestId, traceId: data.traceId, type: 'auth', event: 'token_expired', ...data }),
    passwordReset: (data) => logger.info('Password reset', { requestId: data.requestId, traceId: data.traceId, type: 'auth', event: 'password_reset', ...data }),
    googleAuth: (data) => logger.info('Google OAuth', { requestId: data.requestId, traceId: data.traceId, type: 'auth', event: 'google_oauth', ...data }),
  },
  order: {
    placed: (data) => logger.info('Order placed', { requestId: data.requestId, traceId: data.traceId, type: 'order', event: 'order_placed', ...data }),
    paymentInitiated: (data) => logger.info('Payment initiated', { requestId: data.requestId, traceId: data.traceId, type: 'order', event: 'payment_initiated', ...data }),
    paymentSuccess: (data) => logger.info('Payment successful', { requestId: data.requestId, traceId: data.traceId, type: 'order', event: 'payment_success', ...data }),
    paymentFailed: (data) => logger.error('Payment failed', { requestId: data.requestId, traceId: data.traceId, type: 'order', event: 'payment_failed', ...data }),
    statusUpdated: (data) => logger.info('Order status updated', { requestId: data.requestId, traceId: data.traceId, type: 'order', event: 'order_status_updated', ...data }),
    cancelled: (data) => logger.info('Order cancelled', { requestId: data.requestId, traceId: data.traceId, type: 'order', event: 'order_cancelled', ...data }),
    refunded: (data) => logger.info('Order refunded', { requestId: data.requestId, traceId: data.traceId, type: 'order', event: 'order_refunded', ...data }),
  },
  product: {
    added: (data) => logger.info('Product added', { requestId: data.requestId, traceId: data.traceId, type: 'product', event: 'product_added', ...data }),
    updated: (data) => logger.info('Product updated', { requestId: data.requestId, traceId: data.traceId, type: 'product', event: 'product_updated', ...data }),
    deleted: (data) => logger.info('Product deleted', { requestId: data.requestId, traceId: data.traceId, type: 'product', event: 'product_deleted', ...data }),
    stockUpdated: (data) => logger.info('Stock updated', { requestId: data.requestId, traceId: data.traceId, type: 'product', event: 'stock_updated', ...data }),
    lowStock: (data) => logger.warn('Low stock alert', { requestId: data.requestId, traceId: data.traceId, type: 'product', event: 'low_stock', ...data }),
  },
  user: {
    profileUpdated: (data) => logger.info('Profile updated', { requestId: data.requestId, traceId: data.traceId, type: 'user', event: 'profile_updated', ...data }),
    addressAdded: (data) => logger.info('Address added', { requestId: data.requestId, traceId: data.traceId, type: 'user', event: 'address_added', ...data }),
    wishlistUpdated: (data) => logger.info('Wishlist updated', { requestId: data.requestId, traceId: data.traceId, type: 'user', event: 'wishlist_updated', ...data }),
  },
  system: {
    dbConnected: () => logger.info('MongoDB connected', { type: 'system', event: 'db_connected' }),
    dbDisconnected: () => logger.error('MongoDB disconnected', { type: 'system', event: 'db_disconnected' }),
    dbError: (data) => logger.error('MongoDB error', { type: 'system', event: 'db_error', ...data }),
    cloudinaryError: (data) => logger.error('Cloudinary error', { type: 'system', event: 'cloudinary_error', ...data }),
    emailError: (data) => logger.error('Email error', { type: 'system', event: 'email_error', ...data }),
    serverStarted: (data) => logger.info('Server started', { type: 'system', event: 'server_started', ...data }),
  },
  admin: {
    loggedIn: (data) => logger.info('Admin logged in', { requestId: data.requestId, traceId: data.traceId, type: 'admin', event: 'admin_login', ...data }),
    productManaged: (data) => logger.info('Admin product action', { requestId: data.requestId, traceId: data.traceId, type: 'admin', event: 'admin_product_action', ...data }),
    orderManaged: (data) => logger.info('Admin order action', { requestId: data.requestId, traceId: data.traceId, type: 'admin', event: 'admin_order_action', ...data }),
  },
};

export default eventLogger;
