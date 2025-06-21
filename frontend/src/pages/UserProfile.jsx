import React, { useState, useContext, useEffect, useRef } from 'react';
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
import { toast } from 'sonner';
import axios from 'axios';

const UserProfile = () => {
    const { token, backendURL } = useContext(ShopContext);
    const [activeTab, setActiveTab] = useState('profile');
    const [showContactForm, setShowContactForm] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const contentRef = useRef(null);
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

    // Smooth scroll to content when tab changes
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
        // Close mobile menu when tab changes
        setIsMobileMenuOpen(false);
    }, [activeTab]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
    };

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        if (!contactForm.subject.trim() || !contactForm.message.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await axios.post(`${backendURL}/api/contact/create`, contactForm, {
                headers: { token }
            });

            if (response.data.success) {
                toast.success('Message sent successfully!');
                setContactForm({ subject: '', message: '', priority: 'medium' });
                setShowContactForm(false);
            } else {
                toast.error(response.data.message || 'Failed to send message');
            }
        } catch (error) {
            toast.error('Failed to send message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDirectContact = (type) => {
        if (type === 'whatsapp') {
            window.open('https://wa.me/2348166948210', '_blank');
        } else if (type === 'phone') {
            window.open('tel:+2348166948210', '_blank');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Header */}
            <div className="md:hidden bg-white shadow-sm border-b">
                <div className="flex items-center justify-between p-4">
                    <h1 className="text-xl font-bold text-gray-900">My Account</h1>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
                {/* Desktop Header */}
                <h1 className="hidden md:block text-2xl font-bold text-gray-900 mb-8">My Account</h1>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Mobile Menu Overlay */}
                    {isMobileMenuOpen && (
                        <div className="fixed inset-0 z-40 lg:hidden">
                            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}></div>
                            <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
                                <div className="p-4 border-b">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold">Menu</h2>
                                        <button
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="p-2 rounded-lg hover:bg-gray-100"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Mobile Navigation */}
                                <nav className="p-4">
                                    <div className="space-y-2">
                                        {tabs.map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => handleTabChange(tab.id)}
                                                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                                                    activeTab === tab.id 
                                                        ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-l-4 border-purple-500' 
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                            >
                                                <img src={tab.icon} alt={tab.label} className="w-5 h-5 mr-3" />
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Support Section */}
                                    <div className="mt-8 pt-6 border-t border-gray-200">
                                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Need Help?</h3>
                                        <div className="space-y-3">
                                            <button
                                                onClick={() => handleDirectContact('whatsapp')}
                                                className="w-full flex items-center justify-center px-3 py-2 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                                            >
                                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                                </svg>
                                                WhatsApp Support
                                            </button>
                                            
                                            <button
                                                onClick={() => handleDirectContact('phone')}
                                                className="w-full flex items-center justify-center px-3 py-2 text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                                            >
                                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                                </svg>
                                                Call Support
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => setShowContactForm(true)}
                                            className="w-full mt-4 bg-blue-600 text-white px-3 py-2 text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Send Message
                                        </button>

                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <div className="text-xs text-gray-500 space-y-1">
                                                <p><strong>Email:</strong> vfokezie@gmail.com</p>
                                                <p><strong>Phone:</strong> +234 816-694-8210</p>
                                                <p><strong>Hours:</strong> 24/7 Support</p>
                                            </div>
                                        </div>
                                    </div>
                                </nav>
                            </div>
                        </div>
                    )}

                    {/* Desktop Sidebar */}
                    <div className="hidden lg:block w-64 flex-shrink-0">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
                            <nav className="space-y-2">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => handleTabChange(tab.id)}
                                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                                            activeTab === tab.id 
                                                ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-l-4 border-purple-500' 
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    >
                                        <img src={tab.icon} alt={tab.label} className="w-5 h-5 mr-3" />
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>

                            {/* Support Section */}
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4">Need Help?</h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => handleDirectContact('whatsapp')}
                                        className="w-full flex items-center justify-center px-3 py-2 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                        </svg>
                                        WhatsApp Support
                                    </button>
                                    
                                    <button
                                        onClick={() => handleDirectContact('phone')}
                                        className="w-full flex items-center justify-center px-3 py-2 text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                        </svg>
                                        Call Support
                                    </button>
                                </div>

                                <button
                                    onClick={() => setShowContactForm(true)}
                                    className="w-full mt-4 bg-blue-600 text-white px-3 py-2 text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Send Message
                                </button>

                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="text-xs text-gray-500 space-y-1">
                                        <p><strong>Email:</strong> vfokezie@gmail.com</p>
                                        <p><strong>Phone:</strong> +234 816-694-8210</p>
                                        <p><strong>Hours:</strong> 24/7 Support</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1" ref={contentRef}>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            {renderTabContent()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Form Modal */}
            {showContactForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Send us a message</h3>
                            <button
                                onClick={() => setShowContactForm(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleContactSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={contactForm.subject}
                                    onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="What's this about?"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea
                                    value={contactForm.message}
                                    onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Tell us more..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <select
                                    value={contactForm.priority}
                                    onChange={(e) => setContactForm({...contactForm, priority: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowContactForm(false)}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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

    function renderTabContent() {
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
            case 'contact-messages':
                return <ContactMessages />;
            case 'settings':
                return <AccountSettings />;
            default:
                return null;
        }
    }
};

export default UserProfile;