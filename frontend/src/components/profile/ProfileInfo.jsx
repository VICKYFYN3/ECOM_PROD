import React, { useState, useContext, useEffect } from 'react';
import { assets } from '../../assets/assets';
import Title from '../../components/Title';
import { ShopContext } from '../../context/ShopContext';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const ProfileInfo = () => {
    const { backendURL, token } = useContext(ShopContext);
    const [profileData, setProfileData] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [profilePicture, setProfilePicture] = useState(null);

    const fetchProfileData = async () => {
        try {
            setProfileLoading(true);
            const response = await axios.post(
                `${backendURL}/api/user/profile/get`,
                {},
                { headers: { token } }
            );
            setProfileData(response.data.profile);
            setFormData({
                fullName: response.data.profile?.fullName || '',
                phoneNumber: response.data.profile?.phoneNumber || ''
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch profile data');
            console.error(error);
        } finally {
            setProfileLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchProfileData();
        }
    }, [token]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData({
            ...passwordData,
            [name]: value
        });
    };

const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const formDataToSend = new FormData();
        formDataToSend.append("fullName", formData.fullName);
        formDataToSend.append("phoneNumber", formData.phoneNumber);

        // Append profile picture if selected
        if (profilePicture) {
            formDataToSend.append("profilePicture", profilePicture);
        }

        const response = await axios.post(
            `${backendURL}/api/user/profile/update`,
            formDataToSend,
            {
                headers: {
                    token,
                    'Content-Type': 'multipart/form-data'
                }
            }
        );

        if (response.data.success) {
            await fetchProfileData();
            setEditMode(false);
            setProfilePicture(null); // Reset the profile picture state
            toast.success('Profile updated successfully');
        } else {
            toast.error(response.data.message || 'Failed to update profile');
        }
    } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
        setLoading(false);
    }
};

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(
                `${backendURL}/api/user/profile/change-password`,
                {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                },
                { headers: { token } }
            );
            if (response.data.success) {
                setPasswordSuccess('Password changed successfully');
                setPasswordError('');
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                // Reset password visibility states
                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowConfirmPassword(false);
                toast.success('Password changed successfully');
            } else {
                setPasswordError(response.data.message || 'Failed to change password');
                setPasswordSuccess('');
            }
        } catch (error) {
            setPasswordError(error.response?.data?.message || 'Failed to change password');
            setPasswordSuccess('');
        } finally {
            setLoading(false);
        }
    };

    if (profileLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="text-center py-10">
                <p className="text-red-500">Failed to load profile data</p>
                <button
                    onClick={fetchProfileData}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <Title text1={'PROFILE'} text2={'INFORMATION'} />
                {!editMode && (
                    <button
                        onClick={() => setEditMode(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        disabled={loading}
                    >
                        Edit Profile
                    </button>
                )}
            </div>

            {editMode ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative">
                            <img
                                src={
                                    profilePicture
                                        ? URL.createObjectURL(profilePicture)
                                        : profileData?.profilePicture || assets.default_profile
                                }
                                alt="Profile"
                                className="w-20 h-20 rounded-full object-cover"
                            />
                            <label
                                htmlFor="profilePicture"
                                className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md cursor-pointer"
                            >
                                <img src={assets.camera_icon} alt="Change" className="w-5 h-5" />
                            </label>
                            <input
                                type="file"
                                id="profilePicture"
                                onChange={(e) => setProfilePicture(e.target.files[0])}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Profile Picture</p>
                            <p className="text-xs text-gray-400">Click to change</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={profileData?.email || ''}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                                disabled
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setEditMode(false);
                                setFormData({
                                    fullName: profileData?.fullName || '',
                                    phoneNumber: profileData?.phoneNumber || '',
                                });
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </span>
                            ) : 'Save Changes'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-6">
                        <img
                            src={profileData?.profilePicture || assets.default_profile}
                            alt="Profile"
                            className="w-20 h-20 rounded-full object-cover"
                        />
                        <div>
                            <h3 className="text-lg font-medium">{profileData?.fullName || 'User'}</h3>
                            <p className="text-sm text-gray-500">{profileData?.email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Full Name</p>
                            <p className="font-medium">{profileData?.fullName || 'Not provided'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium">{profileData?.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Phone Number</p>
                            <p className="font-medium">{profileData?.phoneNumber || 'Not provided'}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200">
                <h2 className="text-xl font-semibold mb-4">Change Password</h2>
                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                        <div className="relative">
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {passwordError && (
                        <p className="text-sm text-red-600">{passwordError}</p>
                    )}
                    {passwordSuccess && (
                        <p className="text-sm text-green-600">{passwordSuccess}</p>
                    )}

                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </span>
                        ) : 'Change Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileInfo;