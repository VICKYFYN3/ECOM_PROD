import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import ProfileInfo from '../components/profile/ProfileInfo';
import Addresses from '../components/profile/Addresses';
import Cart from './../pages/Cart';
import Reviews from '../components/profile/Reviews';
import AccountSettings from '../components/profile/AccountSettings';
import Orders from './../pages/Orders';

const UserProfile = () => {
    const { token } = useContext(ShopContext);
    const [activeTab, setActiveTab] = useState('profile');
    const navigate = useNavigate();

    const tabs = [
        { id: 'profile', label: 'Profile Info', icon: assets.profile_icon },
        { id: 'orders', label: 'Orders', icon: assets.orders_icon },
        { id: 'addresses', label: 'Addresses', icon: assets.address_icon },
        { id: 'cart', label: 'Cart', icon: assets.cart_icon },
        { id: 'reviews', label: 'Reviews', icon: assets.review_icon },
        { id: 'settings', label: 'Account Settings', icon: assets.settings_icon }
    ];

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        
        if (!token && !storedToken) {
            navigate('/login');
        }
    }, [token, navigate]);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileInfo />;
            case 'orders':
                return <Orders />;
            case 'addresses':
                return <Addresses />;
            case 'cart':
                return <Cart />;
            case 'reviews':
                return <Reviews />;
            case 'settings':
                return <AccountSettings />;
            default:
                return null;
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">My Account</h1>

            <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-white rounded-lg shadow p-4">
                        <nav className="space-y-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === tab.id ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <img src={tab.icon} alt={tab.label} className="w-5 h-5 mr-3" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="mt-4 bg-white rounded-lg shadow p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Need Help?</h3>
                        <p className="text-sm text-gray-500 mb-3">Contact our support team for assistance.</p>
                        <div className="space-y-2">
                            <a href="mailto:support@example.com" className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                                <img src={assets.email_icon} alt="Email" className="w-4 h-4 mr-2" />
                                Email Support
                            </a>
                            <a href="https://wa.me/1234567890" className="flex items-center text-sm text-green-600 hover:text-green-800">
                                <img src={assets.whatsapp_icon} alt="WhatsApp" className="w-4 h-4 mr-2" />
                                WhatsApp Support
                            </a>
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-lg shadow p-6">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;