import React, { useState, useContext } from 'react';
import { ShopContext } from '../../context/ShopContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const AccountSettings = () => {
    const { backendURL, token ,setToken, setCartItems} = useContext(ShopContext);
    const navigate = useNavigate();
    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

    const handleDeactivateAccount = async () => {
        try {
            const response = await axios.post(
                backendURL + '/api/user/deactivate',
                {},
                { headers: { token } }
            );

            if (response.data.success) {
                toast.success('Account deactivated successfully');
                navigate('/login')
                localStorage.removeItem('token')
                setToken('')
                setCartItems({})
            } else {
                toast.error(response.data.message || 'Failed to deactivate account');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to deactivate account');
        } finally {
            setShowDeactivateConfirm(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-6">Account Settings</h2>

            <div className="space-y-6">
                <div className="border rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-4">Account Management</h3>

                    <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Deactivate Account</h4>
                        <p className="text-sm text-gray-500 mb-3">
                            Deactivating your account will remove your profile and personal information from our system.
                            You can reactivate your account by logging in again.
                        </p>
                        <button
                            onClick={() => setShowDeactivateConfirm(true)}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
                        >
                            Deactivate Account
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showDeactivateConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium mb-2">Deactivate Account</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Are you sure you want to deactivate your account? You will be logged out immediately.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeactivateConfirm(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeactivateAccount}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                            >
                                Deactivate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountSettings;