import userModel from "../models/userModel.js";
import sessionModel from "../models/sessionModel.js";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { OAuth2Client } from 'google-auth-library';
import { v2 as cloudinary } from 'cloudinary';
import transporter from "../config/nodemailer.js";
import { getEmailTemplate } from "../utils/emailTemplates.js";
import { getDeviceInfo } from "../utils/deviceInfo.js";
import eventLogger from "../utils/eventLogger.js";
import logger from "../utils/logger.js";
import { redis } from "../config/redis.js";
import { KEYS, TTL, cacheGet, cacheSet, cacheDel } from "../utils/cache.js";
import { sendEmail } from "../queues/emailQueue.js";
import svc from "../utils/serviceLogger.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateResetToken = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const createSession = async (userId, token, req, traceId = null) => {
    const deviceInfo = getDeviceInfo(req.headers['user-agent'], req.ip);
    const session = await svc.db(traceId, 'save', 'sessions', async () => {
        const s = new sessionModel({ userId, token, deviceInfo });
        await s.save();
        return s;
    });
    await cacheSet(KEYS.session(token), session, TTL.SESSION);
    return session;
};

const googleAuth = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { token } = req.body;
        const ticket = await svc.external(traceId, 'google', 'verifyIdToken', () =>
            client.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID })
        );
        const payload = ticket.getPayload();
        let user = await svc.db(traceId, 'findOne', 'users', () =>
            userModel.findOne({ email: payload.email })
        );
        const isNewUser = !user;
        if (!user) {
            user = await svc.db(traceId, 'save', 'users', async () => {
                const u = new userModel({ name: payload.name, email: payload.email, password: 'google-auth' });
                await u.save();
                return u;
            });
        }
        const authToken = createToken(user._id);
        await createSession(user._id, authToken, req, traceId);
        eventLogger.auth.googleAuth({ requestId, traceId, userId: user._id, email: payload.email, isNewUser, ip: req.ip });
        res.json({ success: true, token: authToken });
    } catch (error) {
        logger.error('Google auth failed', { traceId, error: error.message, ip: req.ip });
        res.json({ success: false, message: error.message });
    }
};

const forgotPassword = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { email } = req.body;
        const user = await svc.db(traceId, 'findOne', 'users', () =>
            userModel.findOne({ email })
        );
        if (!user) {
            logger.warn('Password reset for non-existent email', { traceId, email, ip: req.ip });
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const resetToken = generateResetToken();
        await cacheSet(KEYS.resetToken(email), resetToken, TTL.RESET_TOKEN);
        await svc.db(traceId, 'findByIdAndUpdate', 'users', () =>
            userModel.findByIdAndUpdate(user._id, { $unset: { resetToken: 1, resetTokenExpiry: 1 } })
        );
        eventLogger.auth.passwordReset({ requestId, traceId, userId: user._id, email, ip: req.ip, stage: 'requested' });
        const mailTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });
        await svc.email(traceId, email, 'Password Reset Code - FYN3', () =>
            mailTransporter.sendMail({
                from: `"FYN3" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Password Reset Code - FYN3',
                html: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f8f9fa;">
                <div style="max-width:600px;margin:0 auto;background-color:#ffffff;">
                <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 20px;text-align:center;">
                <h2 style="color:white;margin:0;">Password Reset Request</h2></div>
                <div style="padding:40px 30px;text-align:center;">
                <h3>Security Code</h3>
                <p>Hello <strong>${user.name}</strong>, use the code below to reset your password:</p>
                <div style="background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);border-radius:15px;padding:30px;margin:30px 0;">
                <div style="background:white;border-radius:10px;padding:20px;">
                <span style="font-size:36px;font-weight:bold;letter-spacing:8px;">${resetToken}</span>
                </div>
                <p style="color:white;margin:10px 0 0 0;font-size:12px;">Valid for 60 seconds</p>
                </div>
                <p style="color:#666;">If you didn't request this, please ignore this email.</p>
                </div></div></body></html>`,
            }),
            { emailType: 'password_reset' }
        );
        res.json({ success: true, message: "Reset code sent to your email" });
    } catch (error) {
        logger.error('Forgot password failed', { traceId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const resetPassword = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { token, newPassword, email } = req.body;
        if (!token || !newPassword || !email) {
            return res.status(400).json({ success: false, message: "Email, token and new password are required" });
        }
        const storedToken = await cacheGet(KEYS.resetToken(email));
        if (!storedToken) {
            logger.warn('Expired or invalid reset token', { traceId, email, ip: req.ip });
            return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
        }
        if (storedToken !== token) {
            logger.warn('Wrong reset token', { traceId, email, ip: req.ip });
            return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
        }
        const user = await svc.db(traceId, 'findOne', 'users', () =>
            userModel.findOne({ email })
        );
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        if (newPassword.length < 8) return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
        const salt = await bcrypt.genSalt(10);
        user.password = await svc.internal(traceId, 'bcrypt.hash', () =>
            bcrypt.hash(newPassword, salt)
        );
        await svc.db(traceId, 'save', 'users', () => user.save());
        await cacheDel(KEYS.resetToken(email));
        eventLogger.auth.passwordReset({ requestId, traceId, userId: user._id, ip: req.ip, stage: 'completed' });
        res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        logger.error('Reset password failed', { traceId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const loginUser = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { email, password } = req.body;
        const user = await svc.db(traceId, 'findOne', 'users', () =>
            userModel.findOne({ email })
        );
        if (!user) {
            eventLogger.auth.loginFailed({ requestId, traceId, email, reason: 'user_not_found', ip: req.ip });
            return res.status(404).json({ success: false, message: "User does not exist" });
        }
        if (!user.isVerified && user.password !== 'google-auth') {
            eventLogger.auth.loginFailed({ requestId, traceId, email, userId: user._id, reason: 'email_not_verified', ip: req.ip });
            return res.status(403).json({ success: false, message: "Please verify your email before logging in." });
        }
        const isMatch = await svc.internal(traceId, 'bcrypt.compare', () =>
            bcrypt.compare(password, user.password)
        );
        if (isMatch) {
            const token = createToken(user._id);
            await createSession(user._id, token, req, traceId);
            eventLogger.auth.loginSuccess({ requestId, traceId, userId: user._id, email, method: 'email', ip: req.ip });
            res.json({ success: true, token });
        } else {
            eventLogger.auth.loginFailed({ requestId, traceId, email, userId: user._id, reason: 'invalid_password', ip: req.ip });
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        logger.error('Login failed', { traceId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const registerUser = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { name, email, password } = req.body;
        const exists = await svc.db(traceId, 'findOne', 'users', () =>
            userModel.findOne({ email })
        );
        if (exists) {
            logger.warn('Registration with existing email', { traceId, email, ip: req.ip });
            return res.status(400).json({ success: false, message: "User already exists" });
        }
        if (!validator.isEmail(email)) return res.status(400).json({ success: false, message: "Please enter a valid email" });
        if (password.length < 8) return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
        const hashedPassword = await svc.internal(traceId, 'bcrypt.hash', async () => {
            const salt = await bcrypt.genSalt(10);
            return bcrypt.hash(password, salt);
        });
        const verificationCode = generateResetToken();
        await cacheSet(KEYS.otp(email), { code: verificationCode, resendAt: Date.now() + 4 * 60 * 1000 }, TTL.OTP);
        const newUser = await svc.db(traceId, 'save', 'users', async () => {
            const u = new userModel({ name, email, password: hashedPassword, isVerified: false });
            await u.save();
            return u;
        });
        eventLogger.auth.registered({ requestId, traceId, userId: newUser._id, email, method: 'email', ip: req.ip });
        const subject = 'Verify Your Email - FYN3';
        const message = `<div style="text-align:center;">
            <h2>Welcome, ${name}!</h2>
            <p>Thank you for signing up. Please verify your email using the code below:</p>
            <div style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:20px 0;">${verificationCode}</div>
            <p>This code will expire in 20 minutes.</p>
        </div>`;
        await sendEmail(email, subject, getEmailTemplate(subject, message), 'verification');
        res.status(201).json({ success: true, message: "Verification code sent to your email. Please verify to complete registration." });
    } catch (error) {
        logger.error('Registration failed', { traceId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const verifyEmail = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { email, code } = req.body;
        const user = await svc.db(traceId, 'findOne', 'users', () =>
            userModel.findOne({ email })
        );
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        if (user.isVerified) return res.status(400).json({ success: false, message: "Email already verified" });
        const otpData = await cacheGet(KEYS.otp(email));
        if (!otpData) return res.status(400).json({ success: false, message: "Verification code expired. Please request a new one." });
        if (otpData.code !== code) {
            logger.warn('Invalid verification code', { traceId, email, ip: req.ip });
            return res.status(400).json({ success: false, message: "Invalid verification code" });
        }
        user.isVerified = true;
        await svc.db(traceId, 'save', 'users', () => user.save());
        await cacheDel(KEYS.otp(email));
        const token = createToken(user._id);
        await createSession(user._id, token, req, traceId);
        logger.info('Email verified', { traceId, userId: user._id, email, ip: req.ip });
        res.json({ success: true, token, message: "Email verified successfully" });
    } catch (error) {
        logger.error('Email verification failed', { traceId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const resendVerificationCode = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { email } = req.body;
        const user = await svc.db(traceId, 'findOne', 'users', () =>
            userModel.findOne({ email })
        );
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        if (user.isVerified) return res.status(400).json({ success: false, message: "Email already verified" });
        const existing = await cacheGet(KEYS.otp(email));
        if (existing && existing.resendAt > Date.now()) {
            const wait = Math.ceil((existing.resendAt - Date.now()) / 1000);
            return res.status(429).json({ success: false, message: `Please wait ${wait} seconds before requesting another code.` });
        }
        const verificationCode = generateResetToken();
        await cacheSet(KEYS.otp(email), { code: verificationCode, resendAt: Date.now() + 4 * 60 * 1000 }, TTL.OTP);
        logger.info('Verification code resent', { traceId, userId: user._id, email, ip: req.ip });
        const subject = 'Verify Your Email - FYN3';
        const message = `<div style="text-align:center;">
            <h2>Hello, ${user.name}!</h2>
            <p>Your new verification code is:</p>
            <div style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:20px 0;">${verificationCode}</div>
            <p>This code will expire in 20 minutes.</p>
        </div>`;
        await sendEmail(email, subject, getEmailTemplate(subject, message), 'resend_verification');
        res.json({ success: true, message: "Verification code resent to your email." });
    } catch (error) {
        logger.error('Resend verification failed', { traceId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const adminLogin = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { email, password } = req.body;
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign({ email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '30d' });
            eventLogger.admin.loggedIn({ requestId, traceId, email, ip: req.ip });
            res.json({ success: true, token });
        } else {
            logger.warn('Failed admin login', { traceId, email, ip: req.ip });
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        logger.error('Admin login error', { traceId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const getProfile = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const userId = req.body.userId;
        const cached = await cacheGet(KEYS.profile(userId));
        if (cached) return res.json({ success: true, profile: cached });
        const user = await svc.db(traceId, 'findById', 'users', () =>
            userModel.findById(userId).select('-password')
        );
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        const profileData = {
            fullName: user.name, email: user.email,
            phoneNumber: user.phoneNumber, profilePicture: user.profilePicture,
            subscribed: user.subscribed
        };
        await cacheSet(KEYS.profile(userId), profileData, TTL.PROFILE);
        res.json({ success: true, profile: profileData });
    } catch (error) {
        logger.error('Get profile failed', { traceId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const updateProfile = async (req, res) => {
    const { requestId, traceId } = req;
    if (req.fileSizeError) return res.status(400).json({ success: false, message: "Profile image is too large. Maximum allowed size is 2MB." });
    try {
        const { fullName, phoneNumber } = req.body;
        const updateData = { name: fullName, phoneNumber };
        if (req.file) {
            const result = await svc.cloudinary(traceId, 'upload', () =>
                cloudinary.uploader.upload(req.file.path, { resource_type: 'image' }),
                { context: 'profile_picture' }
            );
            updateData.profilePicture = result.secure_url;
        }
        const updatedUser = await svc.db(traceId, 'findByIdAndUpdate', 'users', () =>
            userModel.findByIdAndUpdate(req.body.userId, updateData, { new: true }).select('-password')
        );
        if (!updatedUser) return res.status(404).json({ success: false, message: "User not found" });
        await cacheDel(KEYS.profile(req.body.userId));
        eventLogger.user.profileUpdated({ requestId, traceId, userId: req.body.userId, updatedFields: Object.keys(updateData) });
        res.json({ success: true, profile: {
            fullName: updatedUser.name, email: updatedUser.email,
            phoneNumber: updatedUser.phoneNumber, profilePicture: updatedUser.profilePicture,
        }});
    } catch (error) {
        logger.error('Update profile failed', { traceId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const changePassword = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await svc.db(traceId, 'findById', 'users', () =>
            userModel.findById(req.body.userId)
        );
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        const isMatch = await svc.internal(traceId, 'bcrypt.compare', () =>
            bcrypt.compare(currentPassword, user.password)
        );
        if (!isMatch) {
            logger.warn('Wrong current password', { traceId, userId: req.body.userId, ip: req.ip });
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }
        if (newPassword.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
        user.password = await svc.internal(traceId, 'bcrypt.hash', () =>
            bcrypt.hash(newPassword, 10)
        );
        await svc.db(traceId, 'save', 'users', () => user.save());
        logger.info('Password changed', { traceId, userId: req.body.userId, ip: req.ip });
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        logger.error('Change password failed', { traceId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const deactivateAccount = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const user = await svc.db(traceId, 'findByIdAndDelete', 'users', () =>
            userModel.findByIdAndDelete(req.body.userId)
        );
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        await cacheDel(KEYS.profile(req.body.userId));
        await cacheDel(KEYS.wishlist(req.body.userId));
        await cacheDel(KEYS.cart(req.body.userId));
        const sessions = await sessionModel.find({ userId: req.body.userId });
        for (const s of sessions) await cacheDel(KEYS.session(s.token));
        logger.info('Account deactivated', { traceId, userId: req.body.userId, email: user.email, ip: req.ip });
        res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        logger.error('Account deactivation failed', { traceId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const subscribeToNewsletter = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const user = await svc.db(traceId, 'findById', 'users', () =>
            userModel.findById(req.body.userId)
        );
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        user.subscribed = true;
        await svc.db(traceId, 'save', 'users', () => user.save());
        await cacheDel(KEYS.profile(req.body.userId));
        logger.info('Newsletter subscribed', { traceId, userId: req.body.userId });
        res.json({ success: true, message: "Subscribed to newsletter successfully" });
    } catch (error) {
        logger.error('Newsletter subscription failed', { traceId, error: error.message });
        res.json({ success: false, message: "An error occurred while subscribing to the newsletter" });
    }
};

const sendNewsletter = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { subject, message, imageUrl } = req.body;
        if (!subject || !message) return res.status(400).json({ success: false, message: 'Subject and message are required' });
        const subscribedUsers = await svc.db(traceId, 'find', 'users', () =>
            userModel.find({ subscribed: true })
        );
        if (subscribedUsers.length === 0) return res.status(404).json({ success: false, message: 'No subscribed users found' });
        const newsletterHtml = getEmailTemplate(subject, message, '', imageUrl);
        let sent = 0, failed = 0;
        for (const user of subscribedUsers) {
            try {
                await sendEmail(user.email, subject, newsletterHtml, 'newsletter');
                sent++;
            } catch (error) {
                failed++;
                eventLogger.system.emailError({ requestId, traceId, error: error.message, type: 'newsletter', recipient: user.email });
            }
        }
        logger.info('Newsletter queued', { traceId, total: subscribedUsers.length, sent, failed });
        res.json({ success: true, message: 'Newsletter sent successfully' });
    } catch (error) {
        logger.error('Newsletter send failed', { traceId, error: error.message });
        res.json({ success: false, message: 'An error occurred while sending the newsletter' });
    }
};

const uploadNewsletterImage = async (req, res) => {
    const { requestId, traceId } = req;
    if (req.fileSizeError) return res.status(400).json({ success: false, message: "Newsletter image is too large. Maximum allowed size is 2MB." });
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No image file provided' });
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            eventLogger.system.cloudinaryError({ requestId, traceId, error: 'Cloudinary configuration missing' });
            return res.status(500).json({ success: false, message: 'Image upload service not configured' });
        }
        const result = await svc.cloudinary(traceId, 'upload', () =>
            cloudinary.uploader.upload(req.file.path, { resource_type: 'image', folder: 'newsletter-images' }),
            { context: 'newsletter_image' }
        );
        logger.info('Newsletter image uploaded', { traceId, url: result.secure_url });
        res.json({ success: true, imageUrl: result.secure_url, message: 'Image uploaded successfully' });
    } catch (error) {
        eventLogger.system.cloudinaryError({ requestId, traceId, error: error.message, context: 'newsletter_image_upload' });
        let errorMessage = 'An error occurred while uploading the image';
        if (error.message.includes('Invalid API credentials')) errorMessage = 'Image upload service configuration error';
        else if (error.message.includes('File too large')) errorMessage = 'Image file is too large';
        else if (error.message.includes('Invalid file type')) errorMessage = 'Invalid image file type';
        res.status(500).json({ success: false, message: errorMessage });
    }
};

const getSubscribersCount = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const count = await svc.db(traceId, 'countDocuments', 'users', () =>
            userModel.countDocuments({ subscribed: true })
        );
        res.json({ success: true, count });
    } catch (error) {
        logger.error('Get subscribers count failed', { traceId, error: error.message });
        res.json({ success: false, message: 'An error occurred while fetching the subscribers count' });
    }
};

const getUserSessions = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const userId = req.body.userId;
        const sessions = await svc.db(traceId, 'find', 'sessions', () =>
            sessionModel.find({ userId, isActive: true }).sort({ lastActivity: -1 })
        );
        const formattedSessions = sessions.map(session => ({
            id: session._id, deviceInfo: session.deviceInfo,
            lastActivity: session.lastActivity, createdAt: session.createdAt,
            isCurrentSession: session.token === req.headers.token
        }));
        res.json({ success: true, sessions: formattedSessions });
    } catch (error) {
        logger.error('Get user sessions failed', { traceId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const signOutAllDevices = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const userId = req.body.userId;
        const sessions = await svc.db(traceId, 'find', 'sessions', () =>
            sessionModel.find({ userId, isActive: true })
        );
        for (const session of sessions) await cacheDel(KEYS.session(session.token));
        await svc.db(traceId, 'updateMany', 'sessions', () =>
            sessionModel.updateMany({ userId, isActive: true }, { isActive: false })
        );
        eventLogger.auth.logout({ requestId, traceId, userId, type: 'all_devices', ip: req.ip });
        res.json({ success: true, message: 'Signed out from all devices successfully' });
    } catch (error) {
        logger.error('Sign out all devices failed', { traceId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const signOutDevice = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { sessionId } = req.body;
        const userId = req.body.userId;
        const session = await svc.db(traceId, 'findOneAndUpdate', 'sessions', () =>
            sessionModel.findOneAndUpdate(
                { _id: sessionId, userId, isActive: true },
                { isActive: false }, { new: true }
            )
        );
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
        await cacheDel(KEYS.session(session.token));
        eventLogger.auth.logout({ requestId, traceId, userId, sessionId, type: 'single_device', ip: req.ip });
        res.json({ success: true, message: 'Signed out from device successfully' });
    } catch (error) {
        logger.error('Sign out device failed', { traceId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const addToWishlist = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const userId = req.body.userId;
        const { productId } = req.params;
        if (!productId) return res.status(400).json({ success: false, message: 'Product ID is required' });
        const user = await svc.db(traceId, 'findById', 'users', () =>
            userModel.findById(userId)
        );
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.wishlist.includes(productId)) return res.status(400).json({ success: false, message: 'Product already in wishlist' });
        user.wishlist.push(productId);
        await svc.db(traceId, 'save', 'users', () => user.save());
        await cacheDel(KEYS.wishlist(userId));
        eventLogger.user.wishlistUpdated({ requestId, traceId, userId, productId, action: 'added' });
        return res.json({ success: true, message: 'Product added to wishlist' });
    } catch (error) {
        logger.error('Add to wishlist failed', { traceId, error: error.message });
        return res.status(500).json({ success: false, message: error.message });
    }
};

const removeFromWishlist = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const userId = req.body.userId;
        const { productId } = req.params;
        if (!productId) return res.status(400).json({ success: false, message: 'Product ID is required' });
        const user = await svc.db(traceId, 'findById', 'users', () =>
            userModel.findById(userId)
        );
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
        await svc.db(traceId, 'save', 'users', () => user.save());
        await cacheDel(KEYS.wishlist(userId));
        eventLogger.user.wishlistUpdated({ requestId, traceId, userId, productId, action: 'removed' });
        return res.json({ success: true, message: 'Product removed from wishlist' });
    } catch (error) {
        logger.error('Remove from wishlist failed', { traceId, error: error.message });
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getWishlist = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const userId = req.body.userId;
        const cached = await cacheGet(KEYS.wishlist(userId));
        if (cached) return res.json({ success: true, wishlist: cached });
        const user = await svc.db(traceId, 'findById', 'users', () =>
            userModel.findById(userId).populate('wishlist')
        );
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        await cacheSet(KEYS.wishlist(userId), user.wishlist, TTL.WISHLIST);
        return res.json({ success: true, wishlist: user.wishlist });
    } catch (error) {
        logger.error('Get wishlist failed', { traceId, error: error.message });
        return res.status(500).json({ success: false, message: error.message });
    }
};

export {
    loginUser, registerUser, adminLogin, googleAuth, forgotPassword, resetPassword,
    updateProfile, changePassword, getProfile, deactivateAccount, subscribeToNewsletter,
    sendNewsletter, uploadNewsletterImage, getSubscribersCount, getUserSessions,
    signOutAllDevices, signOutDevice, createSession, verifyEmail, resendVerificationCode,
    addToWishlist, removeFromWishlist, getWishlist
};
