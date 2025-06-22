import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    token: { 
        type: String, 
        required: true 
    },
    deviceInfo: {
        userAgent: String,
        ip: String,
        deviceType: String, // mobile, desktop, tablet
        browser: String,
        os: String
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    lastActivity: { 
        type: Date, 
        default: Date.now 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

// Index for efficient queries
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ token: 1 });

const sessionModel = mongoose.models.Session || mongoose.model('Session', sessionSchema);

export default sessionModel; 