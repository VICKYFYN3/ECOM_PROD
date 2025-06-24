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
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate a random 6-digit token
const generateResetToken = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Google Authentication
const googleAuth = async (req, res) => {
    try {
        const { token } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        // Check if user exists
        let user = await userModel.findOne({ email: payload.email });

        if (!user) {
            // Create new user if doesn't exist
            user = new userModel({
                name: payload.name,
                email: payload.email,
                password: 'google-auth', // Dummy password
            });
            await user.save();
        }

        const authToken = createToken(user._id);
        
        // Create session for this Google login
        await createSession(user._id, authToken, req);
        
        res.json({ success: true, token: authToken });

    } catch (error) {
        res.json({success:false, message: error.message})
    }
};

// Forgot Password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Generate 6-digit reset token
        const resetToken = generateResetToken();
        const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

        // Store token and expiry in user document
        user.resetToken = resetToken;
        user.resetTokenExpiry = tokenExpiry;
        await user.save();

        // Configure nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Enhanced email template
        const mailOptions = {
            from: `"Forever" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset Code - Forever',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Password Reset - Forever</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f8f9fa;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                        <!-- Header -->
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                            <div style="background-color: white; display: inline-block; padding: 20px; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                                <img src="https://res.cloudinary.com/duvxwhiho/image/upload/v1749069069/logo_vl94iv.png" alt="Forever Logo" style="max-width: 120px; height: auto;">
                            </div>
                            <h2 style="color: white; margin: 0; font-size: 24px; font-weight: 300;">Password Reset Request</h2>
                        </div>

                        <!-- Content -->
                        <div style="padding: 40px 30px;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                                    <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
                                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                                        <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" fill="none"/>
                                    </svg>
                                </div>
                                <h3 style="color: #333; margin: 0 0 10px 0; font-size: 20px;">Security Code</h3>
                                <p style="color: #666; margin: 0; font-size: 16px; line-height: 1.5;">
                                    Hello <strong>${user.name}</strong>,<br>
                                    We received a request to reset your password. Use the code below to reset your password:
                                </p>
                            </div>

                            <!-- Reset Code -->
                            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 15px; padding: 30px; text-align: center; margin: 30px 0; box-shadow: 0 10px 30px rgba(240, 147, 251, 0.3);">
                                <p style="color: white; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Reset Code</p>
                                <div style="background: white; border-radius: 10px; padding: 20px; margin: 15px 0;">
                                    <span style="font-size: 36px; font-weight: bold; color: #333; letter-spacing: 8px; font-family: 'Courier New', monospace;">${resetToken}</span>
                                </div>
                                <p style="color: white; margin: 10px 0 0 0; font-size: 12px; opacity: 0.9;">Valid for 1 hour</p>
                            </div>

                            <!-- Instructions -->
                            <div style="background-color: #f8f9ff; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                                <h4 style="color: #333; margin: 0 0 10px 0; font-size: 16px;">How to reset your password:</h4>
                                <ol style="color: #666; margin: 0; padding-left: 20px; line-height: 1.6;">
                                    <li>Go to the password reset page on our website</li>
                                    <li>Enter the 6-digit code above</li>
                                    <li>Create your new password</li>
                                    <li>You're all set!</li>
                                </ol>
                            </div>

                            <!-- Security Notice -->
                            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 25px 0;">
                                <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.5;">
                                    <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email and consider changing your password as a precaution.
                                </p>
                            </div>

                            <div style="text-align: center; margin-top: 30px;">
                                <p style="color: #666; font-size: 14px; margin: 0;">
                                    Need help? Contact our support team at 
                                    <a href="mailto:support@forever.com" style="color: #667eea; text-decoration: none;">support@forever.com</a>
                                </p>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div style="background-color: #2c3e50; padding: 30px; text-align: center;">
                            <div style="margin-bottom: 20px;">
                                <img src="https://res.cloudinary.com/duvxwhiho/image/upload/v1749069069/logo_vl94iv.png" alt="Forever Logo" style="max-width: 80px; height: auto; margin-bottom: 10px; filter: brightness(0) invert(1);">
                                <p style="color: #95a5a6; margin: 5px 0 0 0; font-size: 12px;">Making fashion accessible forever</p>
                            </div>
                            
                            <div style="margin: 20px 0;">
                                <a href="#" style="display: inline-block; margin: 0 10px; width: 35px; height: 35px; background-color: #34495e; border-radius: 50%; text-decoration: none; line-height: 35px;">
                                    <span style="color: white; font-size: 16px;">f</span>
                                </a>
                                <a href="#" style="display: inline-block; margin: 0 10px; width: 35px; height: 35px; background-color: #34495e; border-radius: 50%; text-decoration: none; line-height: 35px;">
                                    <span style="color: white; font-size: 16px;">t</span>
                                </a>
                                <a href="#" style="display: inline-block; margin: 0 10px; width: 35px; height: 35px; background-color: #34495e; border-radius: 50%; text-decoration: none; line-height: 35px;">
                                    <span style="color: white; font-size: 16px;">@</span>
                                </a>
                            </div>

                            <hr style="border: none; border-top: 1px solid #34495e; margin: 20px 0;">
                            
                            <p style="color: #95a5a6; font-size: 12px; margin: 0; line-height: 1.5;">
                                © ${new Date().getFullYear()} Forever. All rights reserved.<br>
                                This email was sent to ${email}
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: "Reset code sent to your email" });

    } catch (error) {
        res.json({success:false, message: error.message})
    }
};

// Reset Password
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ success: false, message: "Token and new password are required" });
        }

        // Find user with matching reset token
        const user = await userModel.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
        }

        // Validate new password
        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear reset token
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.json({ success: true, message: "Password updated successfully" });

    } catch (error) {
        res.json({success:false, message: error.message})
    }
};

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

//Route to handle user login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User does not exist" });
        }
        // Block login if not verified and not Google Auth
        if (!user.isVerified && user.password !== 'google-auth') {
            return res.status(403).json({ success: false, message: "Please verify your email before logging in." });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = createToken(user._id);
            // Create session for this login
            await createSession(user._id, token, req);
            res.json({ success: true, token });
        }
        else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        res.json({success:false, message: error.message})
    }
}

//Route to handle user registration
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        //Check if user already exists
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        // validate the user data
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email" });
        }
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
        }
        //Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate verification code and expiry
        const verificationCode = generateResetToken();
        const verificationCodeExpiry = new Date(Date.now() + 20 * 60 * 1000); // 20 mins
        const verificationCodeResendAt = new Date(Date.now() + 4 * 60 * 1000); // 4 mins

        //Create a new user (unverified)
        const newUser = new userModel({
            name,
            email,
            password: hashedPassword,
            isVerified: false,
            verificationCode,
            verificationCodeExpiry,
            verificationCodeResendAt
        })

        await newUser.save();

        // Send verification email
        const subject = 'Verify Your Email - Forever';
        const message = `<div style="text-align:center;">
            <h2>Welcome, ${name}!</h2>
            <p>Thank you for signing up. Please verify your email address using the code below:</p>
            <div style="font-size:32px; font-weight:bold; letter-spacing:8px; margin:20px 0;">${verificationCode}</div>
            <p>This code will expire in 20 minutes.</p>
        </div>`;
        const html = getEmailTemplate(subject, message);
        await transporter.sendMail({
            from: `"Forever" <${process.env.EMAIL_USER}>`,
            to: email,
            subject,
            html
        });

        res.status(201).json({ success: true, message: "Verification code sent to your email. Please verify to complete registration." })

    } catch (error) {
        res.json({success:false, message: error.message})
    }
}

// Email verification endpoint
const verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (user.isVerified) {
            return res.status(400).json({ success: false, message: "Email already verified" });
        }
        if (!user.verificationCode || !user.verificationCodeExpiry) {
            return res.status(400).json({ success: false, message: "No verification code found. Please request a new one." });
        }
        if (user.verificationCode !== code) {
            return res.status(400).json({ success: false, message: "Invalid verification code" });
        }
        if (user.verificationCodeExpiry < new Date()) {
            return res.status(400).json({ success: false, message: "Verification code expired" });
        }
        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpiry = undefined;
        user.verificationCodeResendAt = undefined;
        await user.save();

        // Create token/session
        const token = createToken(user._id);
        await createSession(user._id, token, req);
        res.json({ success: true, token, message: "Email verified successfully" });
    } catch (error) {
        res.json({success:false, message: error.message})
    }
}

// Resend verification code endpoint
const resendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (user.isVerified) {
            return res.status(400).json({ success: false, message: "Email already verified" });
        }
        if (user.verificationCodeResendAt && user.verificationCodeResendAt > new Date()) {
            const wait = Math.ceil((user.verificationCodeResendAt - new Date()) / 1000);
            return res.status(429).json({ success: false, message: `Please wait ${wait} seconds before requesting another code.` });
        }
        // Generate new code and expiry
        const verificationCode = generateResetToken();
        const verificationCodeExpiry = new Date(Date.now() + 20 * 60 * 1000); // 20 mins
        const verificationCodeResendAt = new Date(Date.now() + 4 * 60 * 1000); // 4 mins
        user.verificationCode = verificationCode;
        user.verificationCodeExpiry = verificationCodeExpiry;
        user.verificationCodeResendAt = verificationCodeResendAt;
        await user.save();

        // Send verification email
        const subject = 'Verify Your Email - Forever';
        const message = `<div style="text-align:center;">
            <h2>Hello, ${user.name}!</h2>
            <p>Your new verification code is:</p>
            <div style="font-size:32px; font-weight:bold; letter-spacing:8px; margin:20px 0;">${verificationCode}</div>
            <p>This code will expire in 20 minutes.</p>
        </div>`;
        const html = getEmailTemplate(subject, message);
        await transporter.sendMail({
            from: `"Forever" <${process.env.EMAIL_USER}>`,
            to: email,
            subject,
            html
        });

        res.json({ success: true, message: "Verification code resent to your email." });
    } catch (error) {
        res.json({success:false, message: error.message})
    }
}

//Route for Admin login
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign({ email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '30d' })
            res.json({ success: true, token })
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        res.json({success:false, message: error.message})
    }
}

const getProfile = async (req, res) => {
    try {
        const user = await userModel.findById(req.body.userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Map backend fields to frontend expected structure
        const profileData = {
            fullName: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            profilePicture: user.profilePicture,
            subscribed: user.subscribed
        };
        
        res.json({ success: true, profile: profileData });
    } catch (error) {
        res.json({success:false, message: error.message})
    }
};

const updateProfile = async (req, res) => {
    try {
        const { fullName, phoneNumber } = req.body;
        const profilePictureFile = req.file; // Single file upload
        
        const updateData = { 
            name: fullName, 
            phoneNumber
        };
        
        // If profile picture is uploaded
        if (profilePictureFile) {
            const result = await cloudinary.uploader.upload(profilePictureFile.path, {
                resource_type: 'image'
            });
            updateData.profilePicture = result.secure_url;
        }
        
        const updatedUser = await userModel.findByIdAndUpdate(
            req.body.userId,
            updateData,
            { new: true }
        ).select('-password');
        
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        const profileData = {
            fullName: updatedUser.name,
            email: updatedUser.email,
            phoneNumber: updatedUser.phoneNumber,
            profilePicture: updatedUser.profilePicture,
        };
        
        res.json({ success: true, profile: profileData });
    } catch (error) {
        res.json({success:false, message: error.message})
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await userModel.findById(req.body.userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }
        
        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.json({success:false, message: error.message})
    }
};

const deactivateAccount = async (req, res) => {
    try {
        const user = await userModel.findByIdAndDelete(req.body.userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        res.json({success:false, message: error.message})
    }
};

// subscribe to newsletter
const subscribeToNewsletter = async (req, res) => {
    try {
        const userId = req.body.userId;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.subscribed = true;
        await user.save();

        res.json({ success: true, message: "Subscribed to newsletter successfully" });
    } catch (error) {
        res.json({success:false, message: "An error occurred while subscribing to the newsletter"})
    }
}

// send newsletter
const sendNewsletter = async (req, res) => {
    try {
        const { subject, message, imageUrl } = req.body;
        if (!subject || !message) {
            return res.status(400).json({ success: false, message: 'Subject and message are required' });
        }

        const subscribedUsers = await userModel.find({ subscribed: true });

        if (subscribedUsers.length === 0) {
            return res.status(404).json({ success: false, message: 'No subscribed users found' });
        }

        const newsletterHtml = getEmailTemplate(subject, message, '', imageUrl);

        for (const user of subscribedUsers) {
            try {
                const mailOptions = {
                    from: `"Forever" <${process.env.EMAIL_USER}>`,
                    to: user.email,
                    subject: subject,
                    html: newsletterHtml,
                };
                await transporter.sendMail(mailOptions);
                console.log(`Newsletter sent to ${user.email}`);
            } catch (error) {
                console.error(`Failed to send newsletter to ${user.email}:`, error);
            }
        }

        res.json({ success: true, message: 'Newsletter sent successfully' });

    } catch (error) {
        res.json({success:false, message: 'An error occurred while sending the newsletter'})
    }
};

// upload newsletter image
const uploadNewsletterImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }

        console.log('File received:', req.file);

        // Check if cloudinary is configured
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            console.error('Cloudinary configuration missing');
            return res.status(500).json({ 
                success: false, 
                message: 'Image upload service not configured' 
            });
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: 'image',
            folder: 'newsletter-images'
        });

        console.log('Cloudinary upload result:', result);

        res.json({ 
            success: true, 
            imageUrl: result.secure_url,
            message: 'Image uploaded successfully' 
        });

    } catch (error) {
        console.error('Newsletter image upload error:', error);
        
        // Provide more specific error messages
        let errorMessage = 'An error occurred while uploading the image';
        if (error.message.includes('Invalid API credentials')) {
            errorMessage = 'Image upload service configuration error';
        } else if (error.message.includes('File too large')) {
            errorMessage = 'Image file is too large';
        } else if (error.message.includes('Invalid file type')) {
            errorMessage = 'Invalid image file type';
        }
        
        res.status(500).json({ 
            success: false, 
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// get subscribers count
const getSubscribersCount = async (req, res) => {
    try {
        const count = await userModel.countDocuments({ subscribed: true });
        res.json({ success: true, count });
    } catch (error) {
        res.json({success:false, message: 'An error occurred while fetching the subscribers count'})
    }
}

// Get user sessions
const getUserSessions = async (req, res) => {
    try {
        const userId = req.body.userId;
        const sessions = await sessionModel.find({ 
            userId, 
            isActive: true 
        }).sort({ lastActivity: -1 });

        const formattedSessions = sessions.map(session => ({
            id: session._id,
            deviceInfo: session.deviceInfo,
            lastActivity: session.lastActivity,
            createdAt: session.createdAt,
            isCurrentSession: session.token === req.headers.token
        }));

        res.json({ success: true, sessions: formattedSessions });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Sign out from all devices
const signOutAllDevices = async (req, res) => {
    try {
        const userId = req.body.userId;
        
        // Deactivate all sessions for this user
        await sessionModel.updateMany(
            { userId, isActive: true },
            { isActive: false }
        );

        res.json({ success: true, message: 'Signed out from all devices successfully' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Sign out from specific device
const signOutDevice = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const userId = req.body.userId;

        const session = await sessionModel.findOneAndUpdate(
            { _id: sessionId, userId, isActive: true },
            { isActive: false },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        res.json({ success: true, message: 'Signed out from device successfully' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Create session helper function
const createSession = async (userId, token, req) => {
    const deviceInfo = getDeviceInfo(req.headers['user-agent'], req.ip);
    
    const session = new sessionModel({
        userId,
        token,
        deviceInfo
    });
    
    await session.save();
    return session;
};

export { 
    loginUser, 
    registerUser, 
    adminLogin, 
    googleAuth, 
    forgotPassword, 
    resetPassword, 
    updateProfile, 
    changePassword, 
    getProfile, 
    deactivateAccount,
    subscribeToNewsletter,
    sendNewsletter,
    uploadNewsletterImage,
    getSubscribersCount,
    getUserSessions,
    signOutAllDevices,
    signOutDevice,
    createSession,
    verifyEmail,
    resendVerificationCode
};