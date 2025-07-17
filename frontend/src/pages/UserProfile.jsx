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
import ContactMessages from '../components/profile/ContactMessages';
import Wishlist from '../components/profile/Wishlist';
import { toast } from 'sonner';
import axios from 'axios';

const UserProfile = () => {
    const { token, backendURL } = useContext(ShopContext);
    const [activeTab, setActiveTab] = useState('profile');
    const [showContactForm, setShowContactForm] = useState(false);
    const [contactForm, setContactForm] = useState({
        subject: '',
        message: '',
        priority: 'medium'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const tabs = [
        { id: 'profile', label: 'Profile Info', icon: assets.profile_icon },
        { id: 'orders', label: 'Orders', icon: assets.orders_icon },
        { id: 'addresses', label: 'Addresses', icon: assets.address_icon },
        { id: 'cart', label: 'Cart', icon: assets.cart_icon },
        { id: 'wishlist', label: 'Wishlist', icon: assets.wish }, // Add icon if available
        { id: 'reviews', label: 'Reviews', icon: assets.review_icon },
        { id: 'contact-messages', label: 'Contact Messages', icon: assets.email_icon },
        { id: 'settings', label: 'Account Settings', icon: assets.settings_icon }
    ];

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        
        if (!token && !storedToken) {
            navigate('/login');
        }
    }, [token, navigate]);

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        if (!contactForm.subject.trim() || !contactForm.message.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await axios.post(
                backendURL + '/api/contact/create',
                {
                    subject: contactForm.subject,
                    message: contactForm.message,
                    priority: contactForm.priority
                },
                { headers: { token } }
            );

            if (response.data.success) {
                toast.success('Your message has been sent! We\'ll get back to you soon.');
                setContactForm({ subject: '', message: '', priority: 'medium' });
                setShowContactForm(false);
            } else {
                toast.error(response.data.message || 'Failed to send message');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDirectContact = (type) => {
        const supportEmail = 'vfokezie@gmail.com';
        const supportPhone = '+2348166948210';
        
        switch (type) {
            case 'email':
                window.open(`mailto:${supportEmail}?subject=Support Request`, '_blank');
                break;
            case 'whatsapp':
                const message = encodeURIComponent('Hello! I need support with my order.');
                window.open(`https://wa.me/${supportPhone.replace(/\D/g, '')}?text=${message}`, '_blank');
                break;
            case 'phone':
                window.open(`tel:${supportPhone}`, '_blank');
                break;
            default:
                break;
        }
    };

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
            case 'wishlist':
                return <Wishlist />;
            case 'reviews':
                return <Reviews />;
            case 'contact-messages':
                return <ContactMessages />;
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

                    {/* Enhanced Support Section */}
                    <div className="mt-4 bg-white rounded-lg shadow p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Need Help?</h3>
                        <p className="text-sm text-gray-500 mb-4">Our support team is here to help you 24/7.</p>
                        
                        {/* Quick Contact Options */}
                        <div className="space-y-3 mb-4">
                            <button
                                onClick={() => handleDirectContact('email')}
                                className="w-full flex items-center justify-center px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                            >
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                </svg>
                                Email Support
                            </button>
                            
                            <button
                                onClick={() => handleDirectContact('whatsapp')}
                                className="w-full flex items-center justify-center px-3 py-2 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                            >
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                </svg>
                                WhatsApp Support
                            </button>
                            
                            <button
                                onClick={() => handleDirectContact('phone')}
                                className="w-full flex items-center justify-center px-3 py-2 text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-md transition-colors"
                            >
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                                Call Support
                            </button>
                        </div>

                        {/* Contact Form Button */}
                        <button
                            onClick={() => setShowContactForm(true)}
                            className="w-full bg-blue-600 text-white px-3 py-2 text-sm rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Send Message
                        </button>

                        {/* Support Info */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="text-xs text-gray-500 space-y-1">
                                <p><strong>Email:</strong> vfokezie@gmail.com</p>
                                <p><strong>Phone:</strong> +234 816-694-8210</p>
                                <p><strong>Hours:</strong> 24/7 Support</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-lg shadow p-6">
                    {renderTabContent()}
                </div>
            </div>

            {/* Contact Form Modal */}
            {showContactForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Contact Support</h3>
                            <button
                                onClick={() => setShowContactForm(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleContactSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    value={contactForm.subject}
                                    onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="What can we help you with?"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Priority
                                </label>
                                <select
                                    value={contactForm.priority}
                                    onChange={(e) => setContactForm(prev => ({ ...prev, priority: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Message
                                </label>
                                <textarea
                                    value={contactForm.message}
                                    onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Please describe your issue in detail..."
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowContactForm(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Sending...' : 'Send Message'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;