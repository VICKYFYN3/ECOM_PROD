import express from 'express';
import {
    registerUser,
    loginUser,
    adminLogin,
    googleAuth,
    forgotPassword,
    resetPassword,
    getProfile,
    updateProfile,
    changePassword,
    deactivateAccount,
    subscribeToNewsletter,
    sendNewsletter,
    getSubscribersCount,
    uploadNewsletterImage,
    getUserSessions,
    signOutAllDevices,
    signOutDevice,
    verifyEmail,
    resendVerificationCode,
    addToWishlist,
    removeFromWishlist,
    getWishlist
} from '../controllers/userController.js';
import authUser from './../middleware/auth.js';
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';

const userRouter = express.Router();

userRouter.post('/google-auth', googleAuth);
userRouter.post('/forgot-password', forgotPassword);
userRouter.post('/reset-password', resetPassword);
userRouter.post('/register', registerUser);
userRouter.post('/verify-email', verifyEmail);
userRouter.post('/resend-verification-code', resendVerificationCode);
userRouter.post('/login', loginUser);
userRouter.post('/admin', adminLogin);
userRouter.post('/subscribe', authUser, subscribeToNewsletter);
userRouter.post('/profile/get', authUser, getProfile);

// Middleware to catch Multer file size errors
function multerFileSizeErrorHandler(err, req, res, next) {
    if (err && err.code === 'LIMIT_FILE_SIZE') {
        req.fileSizeError = true;
        // Call next so controller can handle the error and return a custom message
        return next();
    }
    // If it's another error, pass it along
    if (err) return next(err);
    next();
}

userRouter.post('/profile/update', upload.single('profilePicture'), multerFileSizeErrorHandler, authUser, updateProfile);
userRouter.post('/profile/change-password', authUser, changePassword);
userRouter.post('/deactivate', authUser, deactivateAccount);

// Session management routes
userRouter.post('/sessions/get', authUser, getUserSessions);
userRouter.post('/sessions/signout-all', authUser, signOutAllDevices);
userRouter.post('/sessions/signout-device', authUser, signOutDevice);

// Wishlist routes
userRouter.post('/wishlist/:productId', authUser, addToWishlist);
userRouter.delete('/wishlist/:productId', authUser, removeFromWishlist);
userRouter.get('/wishlist', authUser, getWishlist);

// Admin newsletter routes
userRouter.post('/newsletter/send', adminAuth, sendNewsletter);
userRouter.post('/upload/newsletter-image', upload.single('image'), multerFileSizeErrorHandler, adminAuth, uploadNewsletterImage);
userRouter.get('/subscribers/count', adminAuth, getSubscribersCount);

export default userRouter;