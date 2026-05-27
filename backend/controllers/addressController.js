import addressModel from '../models/addressModel.js';
import logger from '../utils/logger.js';
import eventLogger from '../utils/eventLogger.js';

const getAddresses = async (req, res) => {
    const requestId = req.requestId;
    try {
        const addresses = await addressModel.find({ userId: req.body.userId }).sort({ createdAt: -1 });
        res.json({ success: true, addresses });
    } catch (error) {
        logger.error('Get addresses failed', { requestId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const addAddress = async (req, res) => {
    const requestId = req.requestId;
    try {
        const { fullName, phoneNumber, email, addressLine1, addressLine2, city, state, postalCode, country, isDefault, addressType } = req.body;
        if (!fullName || !phoneNumber || !addressLine1 || !email || !city || !state || !postalCode || !country) {
            return res.json({ success: false, message: 'Please fill all required fields' });
        }
        if (isDefault) {
            await addressModel.updateMany({ userId: req.body.userId, addressType }, { $set: { isDefault: false } });
        }
        const newAddress = new addressModel({
            userId: req.body.userId, fullName, phoneNumber, email,
            addressLine1, addressLine2: addressLine2 || '', city, state,
            postalCode, country, isDefault: isDefault || false,
            addressType: addressType || 'shipping'
        });
        await newAddress.save();
        eventLogger.user.addressAdded({ requestId, userId: req.body.userId, city, country, addressType });
        res.json({ success: true, message: 'Address added successfully', address: newAddress });
    } catch (error) {
        logger.error('Add address failed', { requestId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const updateAddress = async (req, res) => {
    const requestId = req.requestId;
    try {
        const { addressId, fullName, phoneNumber, addressLine1, addressLine2, city, state, postalCode, country, isDefault, addressType } = req.body;
        if (!addressId) return res.json({ success: false, message: 'Address ID is required' });
        if (!fullName || !phoneNumber || !addressLine1 || !city || !state || !postalCode || !country) {
            return res.json({ success: false, message: 'Please fill all required fields' });
        }
        const existingAddress = await addressModel.findOne({ _id: addressId, userId: req.body.userId });
        if (!existingAddress) return res.json({ success: false, message: 'Address not found' });
        if (isDefault) {
            await addressModel.updateMany({ userId: req.body.userId, addressType, _id: { $ne: addressId } }, { $set: { isDefault: false } });
        }
        const updatedAddress = await addressModel.findByIdAndUpdate(
            addressId,
            { fullName, phoneNumber, addressLine1, addressLine2: addressLine2 || '', city, state, postalCode, country, isDefault: isDefault || false, addressType: addressType || 'shipping' },
            { new: true }
        );
        logger.info('Address updated', { requestId, userId: req.body.userId, addressId, city, country });
        res.json({ success: true, message: 'Address updated successfully', address: updatedAddress });
    } catch (error) {
        logger.error('Update address failed', { requestId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const deleteAddress = async (req, res) => {
    const requestId = req.requestId;
    try {
        const { addressId } = req.body;
        if (!addressId) return res.json({ success: false, message: 'Address ID is required' });
        const address = await addressModel.findOne({ _id: addressId, userId: req.body.userId });
        if (!address) return res.json({ success: false, message: 'Address not found' });
        await addressModel.findByIdAndDelete(addressId);
        logger.info('Address deleted', { requestId, userId: req.body.userId, addressId });
        res.json({ success: true, message: 'Address deleted successfully' });
    } catch (error) {
        logger.error('Delete address failed', { requestId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const setDefaultAddress = async (req, res) => {
    const requestId = req.requestId;
    try {
        const { addressId, addressType } = req.body;
        if (!addressId || !addressType) return res.json({ success: false, message: 'Address ID and address type are required' });
        const address = await addressModel.findOne({ _id: addressId, userId: req.body.userId });
        if (!address) return res.json({ success: false, message: 'Address not found' });
        await addressModel.updateMany({ userId: req.body.userId, addressType }, { $set: { isDefault: false } });
        await addressModel.findByIdAndUpdate(addressId, { $set: { isDefault: true } });
        logger.info('Default address set', { requestId, userId: req.body.userId, addressId, addressType });
        res.json({ success: true, message: 'Default address updated successfully' });
    } catch (error) {
        logger.error('Set default address failed', { requestId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

export { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress };
