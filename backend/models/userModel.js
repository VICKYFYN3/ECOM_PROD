import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cartData: { type: Object, default: {}},
    subscribed: { type: Boolean, default: false },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    profilePicture: String,
    phoneNumber: String
},{minimize: false});

const userModel = mongoose.models.user || mongoose.model('User', userSchema);

export default userModel;