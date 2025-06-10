import React, { useState, useContext } from 'react';
import { assets } from '../../assets/assets';
import { ShopContext } from '../../context/ShopContext';
import axios from 'axios';
// import { toast } from 'sonner';

const AccountSettings = () => {
    const { backendURL, token } = useContext(ShopContext);
    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
    const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleDeactivateAccount = async () => {
        try {
            const response = await axios.post(backendURL + '/api/user/deactivate', {}, {
                headers: { token }
            });
            if (response.data.success) {
                setSuccess('Account deactivated successfully');
                setError('');
                // Handle successful deactivation (redirect to home, etc.)
            } else {
                setError(response.data.message || 'Failed to deactivate account');
                setSuccess('');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to deactivate account');
            setSuccess('');
        }
    };

    const handleLogoutAllDevices = async () => {
        try {
            const response = await axios.post(backendURL + '/api/user/logout-all', {}, {
                headers: { token }
            });
            if (response.data.success) {
                setSuccess('Logged out from all devices successfully');
                setError('');
                // Handle logout (redirect to login page, etc.)
            } else {
                setError(response.data.message || 'Failed to logout from all devices');
                setSuccess('');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to logout from all devices');
            setSuccess('');
        }
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
            
            {error && (
                <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="mb-4 p-2 bg-green-100 text-green-700 rounded text-sm">
                    {success}
                </div>
            )}

            <div className="space-y-6">
                <div className="border rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-4">Security</h3>
                    
                    <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Active Sessions</h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <img src={assets.device_laptop} alt="Device" className="w-8 h-8" />
                                    <div>
                                        <p className="text-sm font-medium">MacBook Pro</p>
                                        <p className="text-xs text-gray-500">Chrome • macOS • Last active 2 hours ago</p>
                                    </div>
                                </div>
                                <button className="text-sm text-red-600 hover:text-red-800">
                                    Logout
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <img src={assets.device_phone} alt="Device" className="w-8 h-8" />
                                    <div>
                                        <p className="text-sm font-medium">iPhone 13</p>
                                        <p className="text-xs text-gray-500">Safari • iOS • Last active 1 day ago</p>
                                    </div>
                                </div>
                                <button className="text-sm text-red-600 hover:text-red-800">
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <button
                        onClick={() => setShowLogoutAllConfirm(true)}
                        className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 text-sm"
                    >
                        Logout from all devices
                    </button>
                </div>

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

            {/* Confirmation Modals */}
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

            {showLogoutAllConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium mb-2">Logout from all devices</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            This will log you out from all devices where you're currently logged in. 
                            You'll need to log in again on each device.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowLogoutAllConfirm(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogoutAllDevices}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                            >
                                Logout All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountSettings;