import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    addressType: { type: String, enum: ['shipping'], required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Address', addressSchema);