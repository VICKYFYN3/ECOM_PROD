import React, { useContext, useEffect } from 'react'
import { assets } from '../assets/assets'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'

const Navbar = () => {
    const [visible, setVisible] = React.useState(false)
    const location = useLocation();

    const { setShowSearch, getCartCount, token, setToken, setCartItems } = useContext(ShopContext);
    const navigate = useNavigate();

    // Check if current page is collection page
    const isCollectionPage = location.pathname === '/collection';

    // Close mobile menu when location changes
    useEffect(() => {
        setVisible(false);
    }, [location]);

    const logout = () => {
        navigate('/login')
        localStorage.removeItem('token')
        setToken('')
        setCartItems({})
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
                        <img onClick={() => token ? navigate('/profile') : navigate('/login')} src={assets.profile_icon} className='w-5 cursor-pointer relative' alt="" />
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
                        <div className="flex justify-between items-center p-4 border-b">
                            <img src={assets.logo} className="w-32" alt="" />
                            <button 
                                onClick={() => setVisible(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                        
                        <div className="p-4">
                            <div className="space-y-3 py-4">
                                {[
                                    { path: '/', label: 'HOME' },
                                    { path: '/collection', label: 'COLLECTION' },
                                    { path: '/about', label: 'ABOUT' },
                                    { path: '/contact', label: 'CONTACT' },
                                    { path: '/orders', label: 'ORDERS' }
                                ].map((item) => (
                                    <NavLink 
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setVisible(false)}
                                        className={({ isActive }) => 
                                            `block p-3 rounded-lg ${
                                                isActive 
                                                ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 text-purple-700 font-medium' 
                                                : 'hover:bg-gray-50 text-gray-700'
                                            }`
                                        }
                                    >
                                        {item.label}
                                    </NavLink>
                                ))}
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <div className="flex justify-around">
                                    <div className="flex flex-col items-center gap-1 text-xs text-gray-500">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600" onClick={() => token ? null : navigate('/login')}>
                                            <img src={assets.profile_icon} className="w-5" alt="" />
                                        </div>
                                        <span>Profile</span>
                                    </div>
                                    
                                    {/* Search icon in mobile menu - only show on collection page */}
                                    {isCollectionPage && (
                                        <div className="flex flex-col items-center gap-1 text-xs text-gray-500">
                                            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600" onClick={() => setShowSearch(true)}>
                                                <img src={assets.search_icon} className="w-5" alt="" />
                                            </div>
                                            <span>Search</span>
                                        </div>
                                    )}
                                    
                                    <Link to="/cart" className="flex flex-col items-center gap-1 text-xs text-gray-500">
                                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 relative">
                                            <img src={assets.cart_icon} className="w-5" alt="" />
                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white text-[8px] flex items-center justify-center">{getCartCount()}</span>
                                        </div>
                                        <span>Cart</span>
                                    </Link>
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