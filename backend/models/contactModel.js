import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['new', 'in-progress', 'resolved', 'closed'],
        default: 'new'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    adminResponse: {
        type: String,
        default: ''
    },
    respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    respondedAt: {
        type: Date
    }
}, {
    timestamps: true
});

export default mongoose.model('Contact', contactSchema); 