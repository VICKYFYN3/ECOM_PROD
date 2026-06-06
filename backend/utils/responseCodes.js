const RC = {
  // AUTH
  AUTH_00: { code: 'AUTH-00', message: 'LOGIN_SUCCESS' },
  AUTH_01: { code: 'AUTH-01', message: 'USER_NOT_FOUND' },
  AUTH_02: { code: 'AUTH-02', message: 'INVALID_CREDENTIALS' },
  AUTH_03: { code: 'AUTH-03', message: 'EMAIL_NOT_VERIFIED' },
  AUTH_04: { code: 'AUTH-04', message: 'TOKEN_EXPIRED' },
  AUTH_05: { code: 'AUTH-05', message: 'TOKEN_INVALID' },
  AUTH_06: { code: 'AUTH-06', message: 'REGISTRATION_SUCCESS' },
  AUTH_07: { code: 'AUTH-07', message: 'EMAIL_ALREADY_EXISTS' },
  AUTH_08: { code: 'AUTH-08', message: 'EMAIL_VERIFIED' },
  AUTH_09: { code: 'AUTH-09', message: 'OTP_EXPIRED' },
  AUTH_10: { code: 'AUTH-10', message: 'OTP_INVALID' },
  AUTH_11: { code: 'AUTH-11', message: 'PASSWORD_RESET_SENT' },
  AUTH_12: { code: 'AUTH-12', message: 'PASSWORD_RESET_SUCCESS' },
  AUTH_13: { code: 'AUTH-13', message: 'RESET_TOKEN_EXPIRED' },
  AUTH_14: { code: 'AUTH-14', message: 'RESET_TOKEN_INVALID' },
  AUTH_15: { code: 'AUTH-15', message: 'WEAK_PASSWORD' },
  AUTH_16: { code: 'AUTH-16', message: 'GOOGLE_AUTH_SUCCESS' },
  AUTH_17: { code: 'AUTH-17', message: 'GOOGLE_AUTH_FAILED' },
  AUTH_18: { code: 'AUTH-18', message: 'LOGOUT_SUCCESS' },
  AUTH_19: { code: 'AUTH-19', message: 'PASSWORD_CHANGED' },
  AUTH_20: { code: 'AUTH-20', message: 'WRONG_CURRENT_PASSWORD' },

  // PAY
  PAY_00: { code: 'PAY-00', message: 'PAYMENT_INITIATED' },
  PAY_01: { code: 'PAY-01', message: 'PAYMENT_VERIFIED' },
  PAY_02: { code: 'PAY-02', message: 'PAYMENT_INIT_FAILED' },
  PAY_03: { code: 'PAY-03', message: 'PAYMENT_VERIFY_FAILED' },
  PAY_04: { code: 'PAY-04', message: 'PAYMENT_TIMEOUT' },
  PAY_05: { code: 'PAY-05', message: 'PAYMENT_CANCELLED' },

  // ORDER
  ORD_00: { code: 'ORD-00', message: 'ORDER_PLACED' },
  ORD_01: { code: 'ORD-01', message: 'ORDER_STATUS_UPDATED' },
  ORD_02: { code: 'ORD-02', message: 'ORDER_PLACEMENT_FAILED' },
  ORD_03: { code: 'ORD-03', message: 'ORDER_NOT_FOUND' },

  // STOCK
  STK_00: { code: 'STK-00', message: 'STOCK_UPDATED' },
  STK_01: { code: 'STK-01', message: 'STOCK_INSUFFICIENT' },
  STK_02: { code: 'STK-02', message: 'STOCK_UPDATE_FAILED' },
  STK_03: { code: 'STK-03', message: 'STOCK_LOW' },
  STK_04: { code: 'STK-04', message: 'STOCK_OUT' },

  // PRODUCT
  PRD_00: { code: 'PRD-00', message: 'PRODUCT_ADDED' },
  PRD_01: { code: 'PRD-01', message: 'PRODUCT_UPDATED' },
  PRD_02: { code: 'PRD-02', message: 'PRODUCT_DELETED' },
  PRD_03: { code: 'PRD-03', message: 'PRODUCT_NOT_FOUND' },

  // USER
  USR_00: { code: 'USR-00', message: 'PROFILE_FETCHED' },
  USR_01: { code: 'USR-01', message: 'PROFILE_UPDATED' },
  USR_02: { code: 'USR-02', message: 'ACCOUNT_DEACTIVATED' },
  USR_03: { code: 'USR-03', message: 'USER_NOT_FOUND' },
  USR_04: { code: 'USR-04', message: 'WISHLIST_UPDATED' },
  USR_05: { code: 'USR-05', message: 'ADDRESS_ADDED' },
  USR_06: { code: 'USR-06', message: 'ADDRESS_UPDATED' },
  USR_07: { code: 'USR-07', message: 'ADDRESS_DELETED' },
  USR_08: { code: 'USR-08', message: 'NEWSLETTER_SUBSCRIBED' },

  // UPLOAD
  UPL_00: { code: 'UPL-00', message: 'UPLOAD_SUCCESS' },
  UPL_01: { code: 'UPL-01', message: 'UPLOAD_FAILED' },
  UPL_02: { code: 'UPL-02', message: 'FILE_TOO_LARGE' },
  UPL_03: { code: 'UPL-03', message: 'INVALID_FILE_TYPE' },

  // DB
  DB_00: { code: 'DB-00', message: 'QUERY_SUCCESS' },
  DB_01: { code: 'DB-01', message: 'QUERY_FAILED' },
  DB_02: { code: 'DB-02', message: 'CONNECTION_LOST' },
  DB_03: { code: 'DB-03', message: 'TIMEOUT' },

  // CACHE
  CACHE_00: { code: 'CACHE-00', message: 'HIT' },
  CACHE_01: { code: 'CACHE-01', message: 'MISS' },
  CACHE_02: { code: 'CACHE-02', message: 'ERROR' },

  // VALIDATION
  VAL_01: { code: 'VAL-01', message: 'MISSING_FIELDS' },
  VAL_02: { code: 'VAL-02', message: 'INVALID_EMAIL' },
  VAL_03: { code: 'VAL-03', message: 'INVALID_INPUT' },

  // RATE
  RATE_01: { code: 'RATE-01', message: 'LIMIT_EXCEEDED' },
  RATE_02: { code: 'RATE-02', message: 'RESEND_COOLDOWN' },

  // SYSTEM
  SYS_00: { code: 'SYS-00', message: 'HEALTHY' },
  SYS_01: { code: 'SYS-01', message: 'INTERNAL_ERROR' },
  SYS_02: { code: 'SYS-02', message: 'SERVICE_UNAVAILABLE' },
  SYS_03: { code: 'SYS-03', message: 'UNHANDLED_REJECTION' },
  SYS_04: { code: 'SYS-04', message: 'UNCAUGHT_EXCEPTION' },
  SYS_05: { code: 'SYS-05', message: 'GRACEFUL_SHUTDOWN' },
};

// User-facing messages — what customers see
const USER_MESSAGES = {
  'AUTH-01': 'Invalid credentials',
  'AUTH-02': 'Invalid credentials',
  'AUTH-03': 'Please verify your email before logging in',
  'AUTH-07': 'An account with this email already exists',
  'AUTH-09': 'Code expired. Please request a new one',
  'AUTH-10': 'Invalid verification code',
  'AUTH-13': 'Reset code expired. Please request a new one',
  'AUTH-14': 'Invalid reset code',
  'AUTH-15': 'Password must be at least 8 characters',
  'AUTH-17': 'Google sign-in failed. Please try again',
  'AUTH-20': 'Current password is incorrect',
  'PAY-02': 'Payment could not be processed. Please try again',
  'PAY-03': 'Payment verification failed. Please contact support',
  'PAY-04': 'Payment service timed out. Please try again',
  'STK-01': 'Item is out of stock',
  'UPL-02': 'File is too large. Maximum size is 2MB',
  'UPL-03': 'Invalid file type',
  'VAL-01': 'Please fill all required fields',
  'VAL-02': 'Please enter a valid email',
  'USR-03': 'User not found',
  'PRD-03': 'Product not found',
  DEFAULT: 'Something went wrong. Please try again',
};

// Get user-facing message for a response code
const getUserMessage = (code) => USER_MESSAGES[code] || USER_MESSAGES.DEFAULT;

export { RC, getUserMessage };
