import express from 'express';
import {
    registerUser,
    loginUser,
    adminLogin,
    googleAuth,
    forgotPassword,
    resetPassword
} from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.post('/google-auth', googleAuth);
userRouter.post('/forgot-password', forgotPassword);
userRouter.post('/reset-password', resetPassword);
userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/admin', adminLogin);

export default userRouter;