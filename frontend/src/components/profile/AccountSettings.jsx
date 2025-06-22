import React, { useState, useContext, useEffect } from 'react';
import { ShopContext } from '../../context/ShopContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const AccountSettings = () => {
    const { backendURL, token, setToken, setCartItems } = useContext(ShopContext);
    const navigate = useNavigate();
    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch user sessions
    const fetchSessions = async () => {
        try {
            const response = await axios.post(
                backendURL + '/api/user/sessions/get',
                {},
                { headers: { token } }
            );

            if (response.data.success) {
                setSessions(response.data.sessions);
            }
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

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

    const handleSignOutAllDevices = async () => {
        setLoading(true);
        try {
            const response = await axios.post(
                backendURL + '/api/user/sessions/signout-all',
                {},
                { headers: { token } }
            );

            if (response.data.success) {
                toast.success('Signed out from all devices successfully');
                navigate('/login');
                localStorage.removeItem('token');
                setToken('');
                setCartItems({});
            } else {
                toast.error(response.data.message || 'Failed to sign out from all devices');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to sign out from all devices');
        } finally {
            setLoading(false);
            setShowSignOutConfirm(false);
        }
    };

    const handleSignOutDevice = async (sessionId) => {
        try {
            const response = await axios.post(
                backendURL + '/api/user/sessions/signout-device',
                { sessionId },
                { headers: { token } }
            );

            if (response.data.success) {
                toast.success('Signed out from device successfully');
                fetchSessions(); // Refresh sessions list
            } else {
                toast.error(response.data.message || 'Failed to sign out from device');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to sign out from device');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const getDeviceIcon = (deviceType) => {
        switch (deviceType) {
            case 'mobile':
                return '📱';
            case 'tablet':
                return '📱';
            case 'desktop':
                return '💻';
            default:
                return '🖥️';
        }
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-6">Account Settings</h2>

            <div className="space-y-6">
                {/* Session Management */}
                <div className="border rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-4">Active Sessions</h3>
                    
                    {sessions.length === 0 ? (
                        <p className="text-gray-500 text-sm">No active sessions found.</p>
                    ) : (
                        <div className="space-y-4">
                            {sessions.map((session) => (
                                <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-2xl">{getDeviceIcon(session.deviceInfo.deviceType)}</span>
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium text-sm">
                                                    {session.deviceInfo.browser} on {session.deviceInfo.os}
                                                </span>
                                                {session.isCurrentSession && (
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {session.deviceInfo.deviceType} • {session.deviceInfo.ip}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Last active: {formatDate(session.lastActivity)}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {!session.isCurrentSession && (
                                        <button
                                            onClick={() => handleSignOutDevice(session.id)}
                                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                                        >
                                            Sign Out
                                        </button>
                                    )}
                                </div>
                            ))}
                            
                            <div className="pt-4 border-t">
                                <button
                                    onClick={() => setShowSignOutConfirm(true)}
                                    disabled={loading}
                                    className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm disabled:opacity-50"
                                >
                                    {loading ? 'Signing out...' : 'Sign Out from All Devices'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Account Management */}
                <div className="border rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-4">Account Management</h3>

                    <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Deactivate Account</h4>
                        <p className="text-sm text-gray-500 mb-3">
                            Deactivating your account will remove your profile and personal information from our system.
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

            {/* Sign Out Confirmation Modal */}
            {showSignOutConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium mb-2">Sign Out from All Devices</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            This will sign you out from all devices where you're currently logged in. You'll need to log in again on any device you want to use.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowSignOutConfirm(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSignOutAllDevices}
                                disabled={loading}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm disabled:opacity-50"
                            >
                                {loading ? 'Signing out...' : 'Sign Out All'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Deactivate Confirmation Modal */}
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