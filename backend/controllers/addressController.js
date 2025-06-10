import addressModel from '../models/addressModel.js';

const getAddresses = async (req, res) => {
    try {
        const addresses = await addressModel.find({ userId: req.body.userId }).sort({ createdAt: -1 });
        res.json({ success: true, addresses });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const addAddress = async (req, res) => {
    try {
        const { 
            fullName,
            phoneNumber,
            email,
            addressLine1,
            addressLine2,
            city,
            state,
            postalCode,
            country,
            isDefault,
            addressType 
        } = req.body;

        // Validate required fields
        if (!fullName || !phoneNumber || !addressLine1 || !email || !city || !state || !postalCode || !country) {
            return res.json({ success: false, message: 'Please fill all required fields' });
        }

        // If this is being set as default, remove default from other addresses of same type
        if (isDefault) {
            await addressModel.updateMany(
                { userId: req.body.userId, addressType },
                { $set: { isDefault: false } }
            );
        }

        const newAddress = new addressModel({
            userId: req.body.userId,
            fullName,
            phoneNumber,
            email,
            addressLine1,
            addressLine2: addressLine2 || '',
            city,
            state,
            postalCode,
            country,
            isDefault: isDefault || false,
            addressType: addressType || 'shipping'
        });

        await newAddress.save();
        res.json({ success: true, message: 'Address added successfully', address: newAddress });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const updateAddress = async (req, res) => {
    try {
        const { 
            addressId,
            fullName,
            phoneNumber,
            addressLine1,
            addressLine2,
            city,
            state,
            postalCode,
            country,
            isDefault,
            addressType 
        } = req.body;

        // Validate required fields
        if (!addressId) {
            return res.json({ success: false, message: 'Address ID is required' });
        }

        if (!fullName || !phoneNumber || !addressLine1 || !city || !state || !postalCode || !country) {
            return res.json({ success: false, message: 'Please fill all required fields' });
        }

        // Check if address belongs to the user
        const existingAddress = await addressModel.findOne({ _id: addressId, userId: req.body.userId });
        if (!existingAddress) {
            return res.json({ success: false, message: 'Address not found' });
        }

        // If this is being set as default, remove default from other addresses of same type
        if (isDefault) {
            await addressModel.updateMany(
                { userId: req.body.userId, addressType, _id: { $ne: addressId } },
                { $set: { isDefault: false } }
            );
        }

        const updatedAddress = await addressModel.findByIdAndUpdate(
            addressId,
            {
                fullName,
                phoneNumber,
                addressLine1,
                addressLine2: addressLine2 || '',
                city,
                state,
                postalCode,
                country,
                isDefault: isDefault || false,
                addressType: addressType || 'shipping'
            },
            { new: true }
        );

        res.json({ success: true, message: 'Address updated successfully', address: updatedAddress });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.body;

        if (!addressId) {
            return res.json({ success: false, message: 'Address ID is required' });
        }

        // Check if address belongs to the user before deleting
        const address = await addressModel.findOne({ _id: addressId, userId: req.body.userId });
        if (!address) {
            return res.json({ success: false, message: 'Address not found' });
        }

        await addressModel.findByIdAndDelete(addressId);
        res.json({ success: true, message: 'Address deleted successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const setDefaultAddress = async (req, res) => {
    try {
        const { addressId, addressType } = req.body;

        if (!addressId || !addressType) {
            return res.json({ success: false, message: 'Address ID and address type are required' });
        }

        // Check if address belongs to the user
        const address = await addressModel.findOne({ _id: addressId, userId: req.body.userId });
        if (!address) {
            return res.json({ success: false, message: 'Address not found' });
        }

        // Remove default from all addresses of this type for this user
        await addressModel.updateMany(
            { userId: req.body.userId, addressType },
            { $set: { isDefault: false } }
        );

        // Set the specified address as default
        await addressModel.findByIdAndUpdate(
            addressId,
            { $set: { isDefault: true } }
        );

        res.json({ success: true, message: 'Default address updated successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};



export { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress };