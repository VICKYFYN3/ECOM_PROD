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
    deactivateAccount
} from '../controllers/userController.js';
import authUser from './../middleware/auth.js';
import upload from '../middleware/multer.js';

const userRouter = express.Router();

userRouter.post('/google-auth', googleAuth);
userRouter.post('/forgot-password', forgotPassword);
userRouter.post('/reset-password', resetPassword);
userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/admin', adminLogin);
userRouter.post('/profile/get', authUser, getProfile);
userRouter.post('/profile/update', upload.single('profilePicture'), authUser, updateProfile);
userRouter.post('/profile/change-password', authUser, changePassword);
userRouter.post('/deactivate', authUser, deactivateAccount);

export default userRouter;