import React, { useState, useEffect, useContext } from 'react';
import { assets } from '../../assets/assets';
import Title from '../../components/Title';
import { ShopContext } from '../../context/ShopContext';
import axios from 'axios';
import { toast } from 'sonner';

const Addresses = () => {
    const { backendURL, token } = useContext(ShopContext);
    const [addresses, setAddresses] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [addressForm, setAddressForm] = useState({
        fullName: '',
        phoneNumber: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        email: '',
        isDefault: false,
        addressType: 'shipping'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const loadAddresses = async () => {
        try {
            setLoading(true);
            const response = await axios.post(backendURL + '/api/address/list', {}, { headers: { token } });
            if (response.data.success) {
                setAddresses(response.data.addresses);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load addresses');
        } finally {
            setLoading(false);
        }
    };

    const handleAddAddress = async (addressData) => {
        try {
            const response = await axios.post(backendURL + '/api/address/add', addressData, { headers: { token } });
            if (response.data.success) {
                toast.success('Address added successfully');
                await loadAddresses();
                return { success: true };
            }
            throw new Error(response.data.message || 'Failed to add address');
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Failed to add address');
            return { success: false, message: error.message };
        }
    };

    const handleUpdateAddress = async (addressId, addressData) => {
        try {
            const response = await axios.post(
                backendURL + '/api/address/update',
                { addressId, ...addressData },
                { headers: { token } }
            );
            if (response.data.success) {
                toast.success('Address updated successfully');
                await loadAddresses();
                return { success: true };
            }
            throw new Error(response.data.message || 'Failed to update address');
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Failed to update address');
            return { success: false, message: error.message };
        }
    };

    const handleDeleteAddress = async (addressId) => {
        try {
            const response = await axios.post(
                backendURL + '/api/address/delete',
                { addressId },
                { headers: { token } }
            );
            if (response.data.success) {
                toast.success('Address deleted successfully');
                await loadAddresses();
                return { success: true };
            }
            throw new Error(response.data.message || 'Failed to delete address');
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Failed to delete address');
            return { success: false, message: error.message };
        }
    };

    const handleSetDefaultAddress = async (addressId, addressType) => {
        try {
            const response = await axios.post(
                backendURL + '/api/address/set-default',
                { addressId, addressType },
                { headers: { token } }
            );
            if (response.data.success) {
                toast.success('Default address updated');
                await loadAddresses();
                return { success: true };
            }
            throw new Error(response.data.message || 'Failed to set default address');
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Failed to set default address');
            return { success: false, message: error.message };
        }
    };

    useEffect(() => {
        if (token) {
            loadAddresses();
        }
    }, [token]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setAddressForm({
            ...addressForm,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const validateAddressForm = () => {
        const requiredFields = [
            'fullName', 'phoneNumber', 'addressLine1',
            'city', 'state', 'postalCode', 'country','email'
        ];

        const missingFields = requiredFields.filter(
            field => !addressForm[field]?.trim()
        );

        if (missingFields.length > 0) {
            setError('Please fill all required fields');
            return false;
        }
        return true;
    };

    const resetForm = () => {
        setAddressForm({
            fullName: '',
            phoneNumber: '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            postalCode: '',
            country: '',
            email: '',
            isDefault: false,
            addressType: 'shipping'
        });
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!validateAddressForm()) return;

        try {
            await handleAddAddress(addressForm);
            setIsAdding(false);
            resetForm();
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to add address');
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!validateAddressForm()) return;

        try {
            await handleUpdateAddress(editingAddress, addressForm);
            setEditingAddress(null);
            resetForm();
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to update address');
        }
    };

    const handleEdit = (address) => {
        if (!address) return;

        setEditingAddress(address._id);
        setAddressForm({
            fullName: address.fullName || '',
            phoneNumber: address.phoneNumber || '',
            addressLine1: address.addressLine1 || '',
            addressLine2: address.addressLine2 || '',
            city: address.city || '',
            state: address.state || '',
            postalCode: address.postalCode || '',
            country: address.country || '',
            email: address.email || '',
            isDefault: Boolean(address.isDefault),
            addressType: address.addressType || 'shipping'
        });
    };

    const renderAddressForm = () => (
        <div className="mb-8 border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h3>

            {error && (
                <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={editingAddress ? handleEditSubmit : handleAddSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                        <input
                            type="text"
                            name="fullName"
                            value={addressForm.fullName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
                        <input
                            type="tel"
                            name="phoneNumber"
                            value={addressForm.phoneNumber}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1*</label>
                    <input
                        type="text"
                        name="addressLine1"
                        value={addressForm.addressLine1}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
                    <input
                        type="text"
                        name="addressLine2"
                        value={addressForm.addressLine2}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City*</label>
                        <input
                            type="text"
                            name="city"
                            value={addressForm.city}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State/Province*</label>
                        <input
                            type="text"
                            name="state"
                            value={addressForm.state}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code*</label>
                        <input
                            type="text"
                            name="postalCode"
                            value={addressForm.postalCode}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country*</label>
                    <input
                        type="text"
                        name="country"
                        value={addressForm.country}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                    <input
                        type="email"
                        name="email"
                        value={addressForm.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address Type</label>
                    <div className="flex gap-6">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="addressType"
                                value="shipping"
                                checked={addressForm.addressType === 'shipping'}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Shipping Address</span>
                        </label>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            name="isDefault"
                            checked={addressForm.isDefault}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Set as default {addressForm.addressType} address</span>
                    </label>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            setIsAdding(false);
                            setEditingAddress(null);
                            setError('');
                            resetForm();
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                        {editingAddress ? 'Update Address' : 'Save Address'}
                    </button>
                </div>
            </form>
        </div>
    );

    const renderAddressList = () => {
        if (!Array.isArray(addresses) || addresses.length === 0) {
            return (
                <div className="text-center py-10">
                    <img src={assets.empty_address} alt="No addresses" className="w-32 h-32 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Saved Addresses</h3>
                    <p className="text-gray-500">You haven't saved any addresses yet.</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map(address => (
                    <div key={address?._id || Math.random()} className="border rounded-lg p-4 relative">
                        {address?.isDefault && (
                            <span className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                Default
                            </span>
                        )}
                        <h3 className="font-medium mb-2">
                            {address?.fullName || 'Unnamed Address'}
                            <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {address?.addressType === 'shipping' ? 'Shipping' : ''}
                            </span>
                        </h3>
                        <p className="text-sm text-gray-700 mb-1">{address?.addressLine1 || ''}</p>
                        {address?.addressLine2 && (
                            <p className="text-sm text-gray-700 mb-1">{address.addressLine2}</p>
                        )}
                        <p className="text-sm text-gray-700 mb-1">
                            {address?.city || ''}, {address?.state || ''} {address?.postalCode || ''}
                        </p>
                        <p className="text-sm text-gray-700 mb-2">{address?.country || ''}</p>
                        <p className="text-sm text-gray-700 mb-2">{address?.email || ''}</p>
                        <p className="text-sm text-gray-700 mb-3">Phone: {address?.phoneNumber || ''}</p>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEdit(address)}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => address?._id && handleDeleteAddress(address._id)}
                                className="text-sm text-red-600 hover:text-red-800"
                            >
                                Delete
                            </button>
                            {!address?.isDefault && (
                                <button
                                    onClick={() =>
                                        address?._id &&
                                        address?.addressType &&
                                        handleSetDefaultAddress(address._id, address.addressType)
                                    }
                                    className="text-sm text-green-600 hover:text-green-800 ml-auto"
                                >
                                    Set as Default
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className='border-t pt-16'>
            <div className="flex justify-between items-center mb-6">
                <div className='text-2xl'>
                    <Title text1={'MY'} text2={'ADDRESSES'} />
                </div>
                {!isAdding && !editingAddress && (
                    <button
                        onClick={() => {
                            setIsAdding(true);
                            setEditingAddress(null);
                            resetForm();
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                        Add New Address
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-10">Loading addresses...</div>
            ) : (
                <>
                    {(isAdding || editingAddress) && renderAddressForm()}
                    {renderAddressList()}
                </>
            )}
        </div>
    );
};

export default Addresses;