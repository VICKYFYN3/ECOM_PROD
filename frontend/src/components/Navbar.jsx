import React, { useContext, useEffect } from 'react'
import { assets } from '../assets/assets'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'

const Navbar = () => {
    const [visible, setVisible] = React.useState(false)
    const [showMobileProfileDropdown, setShowMobileProfileDropdown] = React.useState(false)
    const location = useLocation();

    const { setShowSearch, getCartCount, token, setToken, setCartItems } = useContext(ShopContext);
    const navigate = useNavigate();

    // Check if current page is collection page
    const isCollectionPage = location.pathname === '/collection';

    // Close mobile menu when location changes
    useEffect(() => {
        setVisible(false);
        setShowMobileProfileDropdown(false);
    }, [location]);

    const logout = () => {
        navigate('/login')
        localStorage.removeItem('token')
        setToken('')
        setCartItems({})
        setVisible(false)
        setShowMobileProfileDropdown(false)
    }

    const handleProfileClick = () => {
        if (token) {
            setShowMobileProfileDropdown(!showMobileProfileDropdown)
        } else {
            navigate('/login')
            setVisible(false)
        }
    }

    return (
        <div className="relative z-50">
            {/* Decorative top border with gradient */}
            <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500"></div>
            
            <div className='flex items-center justify-between py-5 font-medium relative'>
                {/* Logo with hover effect */}
                <Link to="/">
                    <div className="relative group">
                        <img src={assets.logo} className='w-36 relative z-10' alt="" />
                        <div className="absolute -bottom-1 -left-2 -right-2 h-3 bg-yellow-200 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 z-0"></div>
                    </div>
                </Link>

                {/* Desktop Navigation - unique tab-like design */}
                <ul className='hidden sm:flex gap-1 text-sm relative'>
                    {[
                        { path: '/', label: 'HOME' },
                        { path: '/collection', label: 'COLLECTION' },
                        { path: '/about', label: 'ABOUT' },
                        { path: '/contact', label: 'CONTACT' }
                    ].map((item) => (
                        <NavLink key={item.path} to={item.path} className="cursor-pointer">
                            {({ isActive }) => (
                                <div className={`px-4 py-2 rounded-t-lg transition-all duration-300 relative 
                                                ${isActive ? 'bg-purple-100 text-purple-800 font-semibold' : 'hover:bg-gray-100 text-gray-700'}`}>
                                    <span>{item.label}</span>
                                    {isActive && (
                                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"></span>
                                    )}
                                </div>
                            )}
                        </NavLink>
                    ))}
                </ul>

                {/* Right Side Icons - with unique animated indicators */}
                <div className='flex items-center gap-6'>
                    {/* Search with ripple effect - only show on collection page */}
                    {isCollectionPage && (
                        <div className="relative cursor-pointer group" onClick={() => setShowSearch(true)}>
                            <div className="absolute inset-0 rounded-full bg-purple-200 scale-0 group-hover:scale-150 opacity-0 group-hover:opacity-30 transition-all duration-500"></div>
                            <img src={assets.search_icon} className='w-5 relative transform group-hover:rotate-12 transition-transform duration-300' alt="" />
                        </div>
                    )}

                    {/* Profile dropdown - redesigned */}
                    <div className='group relative'>
                        <div className="absolute inset-0 rounded-full bg-pink-200 scale-0 group-hover:scale-150 opacity-0 group-hover:opacity-30 transition-all duration-500"></div>
                        <img onClick={() => token ? null : navigate('/login')} src={assets.profile_icon} className='w-5 cursor-pointer relative' alt="" />
                        {/* Dropdown */}
                        {token && 
                        <div className='invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute dropdown-menu right-0 pt-3 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0'>
                            <div className='w-40 py-2 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden'>
                                <div className="h-1 w-full bg-gradient-to-r from-purple-500 to-pink-500 mb-2"></div>
                                <div className='flex flex-col'>
                                    <p onClick={()=>navigate('/profile')} className='cursor-pointer hover:bg-purple-50 py-2 px-4 text-gray-700 hover:text-purple-700 transition-colors'>My Profile</p>
                                    <p onClick={()=>navigate('/orders')} className='cursor-pointer hover:bg-purple-50 py-2 px-4 text-gray-700 hover:text-purple-700 transition-colors'>Orders</p>
                                    <p onClick={logout} className='cursor-pointer hover:bg-purple-50 py-2 px-4 text-gray-700 hover:text-purple-700 transition-colors'>Logout</p>
                                </div>
                            </div>
                        </div>}
                    </div>

                    {/* Cart with floating animation */}
                    <Link to='/cart' className='relative cursor-pointer group'>
                        <div className="absolute inset-0 rounded-full bg-yellow-200 scale-0 group-hover:scale-150 opacity-0 group-hover:opacity-30 transition-all duration-500"></div>
                        <img src={assets.cart_icon} className='w-5 min-w-5 relative' alt="" />
                        <p className='absolute right-[-5px] bottom-[-5px] w-5 h-5 flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-full text-[10px] animate-pulse'>{getCartCount()}</p>
                    </Link>

                    {/* Mobile menu button with animation */}
                    <div className="sm:hidden relative cursor-pointer" onClick={() => setVisible(true)}>
                        <div className="w-6 h-6 flex flex-col justify-center items-center gap-1">
                            <span className="w-5 h-0.5 bg-gray-700 rounded-full"></span>
                            <span className="w-3.5 h-0.5 bg-gray-700 rounded-full"></span>
                            <span className="w-5 h-0.5 bg-gray-700 rounded-full"></span>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu - Redesigned with unique style */}
                {visible && (
                    <div className="fixed inset-0 z-50 bg-white bg-opacity-95 backdrop-blur-sm">
                        <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500"></div>
                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <img src={assets.logo} className="w-32" alt="" />
                            <button 
                                onClick={() => setVisible(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:scale-105"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <div className="space-y-2 py-4">
                                {[
                                    { path: '/', label: 'HOME', icon: '🏠' },
                                    { path: '/collection', label: 'COLLECTION', icon: '🛍️' },
                                    { path: '/about', label: 'ABOUT', icon: 'ℹ️' },
                                    { path: '/contact', label: 'CONTACT', icon: '📞' },
                                    { path: '/orders', label: 'ORDERS', icon: '📦' }
                                ].map((item) => (
                                    <NavLink 
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setVisible(false)}
                                        className={({ isActive }) => 
                                            `flex items-center p-4 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                                                isActive 
                                                ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 text-purple-700 font-semibold shadow-sm' 
                                                : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                                            }`
                                        }
                                    >
                                        <span className="text-xl mr-4">{item.icon}</span>
                                        <span className="text-base font-medium">{item.label}</span>
                                    </NavLink>
                                ))}
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4 text-center">Quick Actions</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="flex flex-col items-center gap-2 text-xs text-gray-500">
                                        <div 
                                            className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-purple-600 cursor-pointer hover:scale-110 transition-transform duration-200" 
                                            onClick={handleProfileClick}
                                        >
                                            <img src={assets.profile_icon} className="w-6" alt="" />
                                        </div>
                                        <span className="text-center">Profile</span>
                                        
                                        {/* Mobile Profile Dropdown */}
                                        {token && showMobileProfileDropdown && (
                                            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-48 py-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
                                                <div className="h-1 w-full bg-gradient-to-r from-purple-500 to-pink-500 mb-2"></div>
                                                <div className='flex flex-col'>
                                                    <p onClick={() => {
                                                        navigate('/profile')
                                                        setVisible(false)
                                                        setShowMobileProfileDropdown(false)
                                                    }} className='cursor-pointer hover:bg-purple-50 py-3 px-4 text-gray-700 hover:text-purple-700 transition-colors text-sm'>My Profile</p>
                                                    <p onClick={() => {
                                                        navigate('/orders')
                                                        setVisible(false)
                                                        setShowMobileProfileDropdown(false)
                                                    }} className='cursor-pointer hover:bg-purple-50 py-3 px-4 text-gray-700 hover:text-purple-700 transition-colors text-sm'>Orders</p>
                                                    <p onClick={logout} className='cursor-pointer hover:bg-purple-50 py-3 px-4 text-gray-700 hover:text-purple-700 transition-colors text-sm'>Logout</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Search icon in mobile menu - only show on collection page */}
                                    {isCollectionPage && (
                                        <div className="flex flex-col items-center gap-2 text-xs text-gray-500">
                                            <div 
                                                className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-pink-600 cursor-pointer hover:scale-110 transition-transform duration-200" 
                                                onClick={() => setShowSearch(true)}
                                            >
                                                <img src={assets.search_icon} className="w-6" alt="" />
                                            </div>
                                            <span className="text-center">Search</span>
                                        </div>
                                    )}
                                    
                                    <Link to="/cart" className="flex flex-col items-center gap-2 text-xs text-gray-500">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center text-yellow-600 relative hover:scale-110 transition-transform duration-200">
                                            <img src={assets.cart_icon} className="w-6" alt="" />
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white text-[10px] flex items-center justify-center font-bold">{getCartCount()}</span>
                                        </div>
                                        <span className="text-center">Cart</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Support Section */}
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4 text-center">Need Help?</h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => window.open('https://wa.me/2348166948210', '_blank')}
                                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors text-sm font-medium"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                        </svg>
                                        WhatsApp Support
                                    </button>
                                    
                                    <button
                                        onClick={() => window.open('tel:+2348166948210', '_blank')}
                                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors text-sm font-medium"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                        </svg>
                                        Call Support
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Navbar