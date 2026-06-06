import addressModel from '../models/addressModel.js';
import logger from '../utils/logger.js';
import eventLogger from '../utils/eventLogger.js';
import svc from '../utils/serviceLogger.js';
import { RC, getUserMessage } from '../utils/responseCodes.js';

const getAddresses = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const addresses = await svc.db(traceId, 'find', 'addresses', () =>
            addressModel.find({ userId: req.body.userId }).sort({ createdAt: -1 })
        );
        res.json({ success: true, addresses });
    } catch (error) {
        logger.error('Get addresses failed', { traceId, error: error.message, responseCode: RC.SYS_01.code, responseMessage: RC.SYS_01.message });
        res.json({ success: false, message: getUserMessage(RC.SYS_01.code), requestId });
    }
};

const addAddress = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { fullName, phoneNumber, email, addressLine1, addressLine2, city, state, postalCode, country, isDefault, addressType } = req.body;
        if (!fullName || !phoneNumber || !addressLine1 || !email || !city || !state || !postalCode || !country) {
            return res.json({ success: false, message: getUserMessage(RC.VAL_01.code), requestId });
        }
        if (isDefault) {
            await svc.db(traceId, 'updateMany', 'addresses', () =>
                addressModel.updateMany({ userId: req.body.userId, addressType }, { $set: { isDefault: false } })
            );
        }
        const newAddress = await svc.db(traceId, 'save', 'addresses', async () => {
            const a = new addressModel({
                userId: req.body.userId, fullName, phoneNumber, email,
                addressLine1, addressLine2: addressLine2 || '', city, state,
                postalCode, country, isDefault: isDefault || false,
                addressType: addressType || 'shipping'
            });
            await a.save();
            return a;
        });
        eventLogger.user.addressAdded({ requestId, traceId, userId: req.body.userId, city, country, addressType, responseCode: RC.USR_05.code, responseMessage: RC.USR_05.message });
        res.json({ success: true, message: 'Address added successfully', address: newAddress });
    } catch (error) {
        logger.error('Add address failed', { traceId, error: error.message, responseCode: RC.SYS_01.code, responseMessage: RC.SYS_01.message });
        res.json({ success: false, message: getUserMessage(RC.SYS_01.code), requestId });
    }
};

const updateAddress = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { addressId, fullName, phoneNumber, addressLine1, addressLine2, city, state, postalCode, country, isDefault, addressType } = req.body;
        if (!addressId) return res.json({ success: false, message: getUserMessage(RC.VAL_01.code), requestId });
        if (!fullName || !phoneNumber || !addressLine1 || !city || !state || !postalCode || !country) {
            return res.json({ success: false, message: getUserMessage(RC.VAL_01.code), requestId });
        }
        const existingAddress = await svc.db(traceId, 'findOne', 'addresses', () =>
            addressModel.findOne({ _id: addressId, userId: req.body.userId })
        );
        if (!existingAddress) return res.json({ success: false, message: getUserMessage(RC.RES_04 ? RC.RES_04.code : RC.SYS_01.code), requestId });
        if (isDefault) {
            await svc.db(traceId, 'updateMany', 'addresses', () =>
                addressModel.updateMany({ userId: req.body.userId, addressType, _id: { $ne: addressId } }, { $set: { isDefault: false } })
            );
        }
        const updatedAddress = await svc.db(traceId, 'findByIdAndUpdate', 'addresses', () =>
            addressModel.findByIdAndUpdate(addressId, {
                fullName, phoneNumber, addressLine1, addressLine2: addressLine2 || '',
                city, state, postalCode, country, isDefault: isDefault || false,
                addressType: addressType || 'shipping'
            }, { new: true })
        );
        res.json({ success: true, message: 'Address updated successfully', address: updatedAddress });
    } catch (error) {
        logger.error('Update address failed', { traceId, error: error.message, responseCode: RC.SYS_01.code, responseMessage: RC.SYS_01.message });
        res.json({ success: false, message: getUserMessage(RC.SYS_01.code), requestId });
    }
};

const deleteAddress = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { addressId } = req.body;
        if (!addressId) return res.json({ success: false, message: getUserMessage(RC.VAL_01.code), requestId });
        const address = await svc.db(traceId, 'findOne', 'addresses', () =>
            addressModel.findOne({ _id: addressId, userId: req.body.userId })
        );
        if (!address) return res.json({ success: false, message: getUserMessage(RC.RES_04 ? RC.RES_04.code : RC.SYS_01.code), requestId });
        await svc.db(traceId, 'findByIdAndDelete', 'addresses', () => addressModel.findByIdAndDelete(addressId));
        res.json({ success: true, message: 'Address deleted successfully' });
    } catch (error) {
        logger.error('Delete address failed', { traceId, error: error.message, responseCode: RC.SYS_01.code, responseMessage: RC.SYS_01.message });
        res.json({ success: false, message: getUserMessage(RC.SYS_01.code), requestId });
    }
};

const setDefaultAddress = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { addressId, addressType } = req.body;
        if (!addressId || !addressType) return res.json({ success: false, message: getUserMessage(RC.VAL_01.code), requestId });
        const address = await svc.db(traceId, 'findOne', 'addresses', () =>
            addressModel.findOne({ _id: addressId, userId: req.body.userId })
        );
        if (!address) return res.json({ success: false, message: getUserMessage(RC.RES_04 ? RC.RES_04.code : RC.SYS_01.code), requestId });
        await svc.db(traceId, 'updateMany', 'addresses', () =>
            addressModel.updateMany({ userId: req.body.userId, addressType }, { $set: { isDefault: false } })
        );
        await svc.db(traceId, 'findByIdAndUpdate', 'addresses', () =>
            addressModel.findByIdAndUpdate(addressId, { $set: { isDefault: true } })
        );
        res.json({ success: true, message: 'Default address updated successfully' });
    } catch (error) {
        logger.error('Set default address failed', { traceId, error: error.message, responseCode: RC.SYS_01.code, responseMessage: RC.SYS_01.message });
        res.json({ success: false, message: getUserMessage(RC.SYS_01.code), requestId });
    }
};

export { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress };
