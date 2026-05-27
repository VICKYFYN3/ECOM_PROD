import logger from './logger.js';

const eventLogger = {
  auth: {
    registered: (data) => logger.info('User registered', { type: 'auth', event: 'user_registered', ...data }),
    loginSuccess: (data) => logger.info('Login success', { type: 'auth', event: 'login_success', ...data }),
    loginFailed: (data) => logger.warn('Login failed', { type: 'auth', event: 'login_failed', ...data }),
    logout: (data) => logger.info('User logged out', { type: 'auth', event: 'logout', ...data }),
    tokenExpired: (data) => logger.warn('Token expired', { type: 'auth', event: 'token_expired', ...data }),
    passwordReset: (data) => logger.info('Password reset', { type: 'auth', event: 'password_reset', ...data }),
    googleAuth: (data) => logger.info('Google OAuth', { type: 'auth', event: 'google_oauth', ...data }),
  },
  order: {
    placed: (data) => logger.info('Order placed', { type: 'order', event: 'order_placed', ...data }),
    paymentInitiated: (data) => logger.info('Payment initiated', { type: 'order', event: 'payment_initiated', ...data }),
    paymentSuccess: (data) => logger.info('Payment successful', { type: 'order', event: 'payment_success', ...data }),
    paymentFailed: (data) => logger.error('Payment failed', { type: 'order', event: 'payment_failed', ...data }),
    statusUpdated: (data) => logger.info('Order status updated', { type: 'order', event: 'order_status_updated', ...data }),
    cancelled: (data) => logger.info('Order cancelled', { type: 'order', event: 'order_cancelled', ...data }),
    refunded: (data) => logger.info('Order refunded', { type: 'order', event: 'order_refunded', ...data }),
  },
  product: {
    added: (data) => logger.info('Product added', { type: 'product', event: 'product_added', ...data }),
    updated: (data) => logger.info('Product updated', { type: 'product', event: 'product_updated', ...data }),
    deleted: (data) => logger.info('Product deleted', { type: 'product', event: 'product_deleted', ...data }),
    stockUpdated: (data) => logger.info('Stock updated', { type: 'product', event: 'stock_updated', ...data }),
    lowStock: (data) => logger.warn('Low stock alert', { type: 'product', event: 'low_stock', ...data }),
  },
  user: {
    profileUpdated: (data) => logger.info('Profile updated', { type: 'user', event: 'profile_updated', ...data }),
    addressAdded: (data) => logger.info('Address added', { type: 'user', event: 'address_added', ...data }),
    wishlistUpdated: (data) => logger.info('Wishlist updated', { type: 'user', event: 'wishlist_updated', ...data }),
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
    loggedIn: (data) => logger.info('Admin logged in', { type: 'admin', event: 'admin_login', ...data }),
    productManaged: (data) => logger.info('Admin product action', { type: 'admin', event: 'admin_product_action', ...data }),
    orderManaged: (data) => logger.info('Admin order action', { type: 'admin', event: 'admin_order_action', ...data }),
  },
};

export default eventLogger;
