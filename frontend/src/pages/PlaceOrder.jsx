import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Title from '../components/Title';
import CartTotal from '../components/CartTotal';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import axios from 'axios';
import { toast } from 'sonner';
import { getAllStates, getCitiesForState } from '../data/nigerianStates';

const PlaceOrder = () => {
  const { products, currency, cartItems, backendURL, token, setCartItems, getCartTotal, delivery_fee } = useContext(ShopContext);
  const [subtotal, setSubtotal] = useState(0);
  const [method, setMethod] = useState('cod');
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressTab, setAddressTab] = useState('saved');
  const [loading, setLoading] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableCities, setAvailableCities] = useState([]);
  const navigate = useNavigate();

  const nigerianStates = getAllStates();

  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Nigeria',
    isDefault: false,
    addressType: 'shipping'
  });

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const response = await axios.post(backendURL + '/api/address/list', {}, { headers: { token } });
      if (response.data.success) {
        setAddresses(response.data.addresses);
        const defaultShipping = response.data.addresses.find(addr =>
          addr.isDefault && addr.addressType === 'shipping'
        );
        if (defaultShipping) {
          setSelectedAddress(defaultShipping._id);
        }
      }
    } catch (error) {
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    try {
      const response = await axios.post(
        backendURL + '/api/address/add',
        formData,
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success('Address added successfully');
        await loadAddresses();
        setSelectedAddress(response.data.address._id);
        setAddressTab('saved');
        return true;
      }
      throw new Error(response.data.message || 'Failed to add address');
    } catch (error) {
      toast.error(error.message || 'Failed to add address');
      return false;
    }
  };

  const onChangeHandler = (event) => {
    const { name, value, type, checked } = event.target;
    
    if (name === 'state') {
      // When state changes, update cities and clear city selection
      const cities = getCitiesForState(value);
      setAvailableCities(cities);
      setFormData(prev => ({
        ...prev,
        state: value,
        city: '' // Clear city when state changes
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const validateAddressForm = () => {
    const requiredFields = ['fullName', 'phoneNumber', 'email', 'addressLine1', 'city', 'state', 'postalCode', 'country'];
    const missingFields = requiredFields.filter(field => !formData[field]?.trim());
    if (missingFields.length > 0) {
      toast.error('Please fill all required fields');
      return false;
    }
    return true;
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (!token) {
      toast.error('Please login to proceed');
      navigate('/login');
      return;
    }

    if (addressTab === 'new') {
      if (!validateAddressForm()) return;
      const success = await handleAddAddress();
      if (!success) return;
    }

    if (!selectedAddress && addressTab === 'saved') {
      toast.error('Please select an address');
      return;
    }

    setIsProcessing(true);
    try {
      let orderItemsData = [];
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            const itemInfo = structuredClone(products.find(product => product._id === items));
            if (itemInfo) {
              itemInfo.size = item;
              itemInfo.quantity = cartItems[items][item];
              orderItemsData.push(itemInfo);
            }
          }
        }
      }

      let addressData;
      if (addressTab === 'saved') {
        const address = addresses.find(addr => addr._id === selectedAddress);
        if (!address) {
          toast.error('Selected address not found');
          return;
        }
        addressData = {
          firstName: address.fullName.split(' ')[0],
          lastName: address.fullName.split(' ').slice(1).join(' '),
          email: address.email,
          street: address.addressLine1,
          city: address.city,
          state: address.state,
          zipcode: address.postalCode,
          country: address.country,
          phone: address.phoneNumber
        };
      } else {
        addressData = {
          firstName: formData.fullName.split(' ')[0],
          lastName: formData.fullName.split(' ').slice(1).join(' '),
          email: formData.email,
          street: formData.addressLine1,
          city: formData.city,
          state: formData.state,
          zipcode: formData.postalCode,
          country: formData.country,
          phone: formData.phoneNumber
        };
      }

      let orderData = {
        address: addressData,
        items: orderItemsData,
        amount: getCartTotal() + delivery_fee
      };

      switch (method) {
        case 'cod': {
          const response = await axios.post(backendURL + '/api/order/place', orderData, { headers: { token } });
          if (response.data.success) {
            setCartItems({});
            navigate('/orders');
          } else {
            toast.error(response.data.message);
          }
          break;
        }
        case 'stripe': {
          const responseStripe = await axios.post(backendURL + '/api/order/stripe', orderData, { headers: { token } });
          if (responseStripe.data.success) {
            const { session_url } = responseStripe.data;
            window.location.replace(session_url);
          } else {
            toast.error(responseStripe.data.message);
          }
          break;
        }
        case 'paystack': {
          const responsePaystack = await axios.post(
            backendURL + '/api/order/paystack',
            orderData,
            { headers: { token } }
          );
          if (responsePaystack.data.success) {
            const { authorization_url } = responsePaystack.data;
            window.location.replace(authorization_url);
          } else {
            toast.error(responsePaystack.data.message);
          }
          break;
        }
        default:
          break;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setIsProcessing(false);
    }
  };

  const isCartEmpty = () => {
    return Object.values(cartItems).every(item =>
      Object.values(item).every(quantity => quantity === 0)
    );
  };

  useEffect(() => {
    let total = 0;
    let items = [];

    for (const itemId in cartItems) {
      for (const size in cartItems[itemId]) {
        if (cartItems[itemId][size] > 0) {
          const productData = products.find(product => product._id === itemId);
          if (productData) {
            total += productData.price * cartItems[itemId][size];
            items.push({
              ...productData,
              size: size,
              quantity: cartItems[itemId][size]
            });
          }
        }
      }
    }
    setSubtotal(total);
    setOrderItems(items);
  }, [cartItems, products]);

  useEffect(() => {
    if (token) {
      loadAddresses();
    }
  }, [token]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-4 sm:py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <form onSubmit={onSubmitHandler} className='flex flex-col lg:flex-row gap-4 sm:gap-8'>
          {/* Left Side - Delivery Information */}
          <div className='flex-1 bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100'>
            <div className='mb-6 sm:mb-8'>
              <div className='flex items-center space-x-3 mb-4 sm:mb-6'>
                <div className='w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center'>
                  <svg className='w-4 h-4 sm:w-5 sm:h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                  </svg>
                </div>
                <h2 className='text-xl sm:text-2xl font-bold text-gray-900'>Delivery Information</h2>
              </div>

              {/* Enhanced Address Selection Tabs */}
              <div className="flex bg-gray-100 rounded-lg sm:rounded-xl p-1 mb-4 sm:mb-6">
                <button
                  type="button"
                  onClick={() => setAddressTab('saved')}
                  className={`flex-1 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium rounded-md sm:rounded-lg transition-all duration-200 ${addressTab === 'saved'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Saved Addresses
                </button>
                <button
                  type="button"
                  onClick={() => setAddressTab('new')}
                  className={`flex-1 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium rounded-md sm:rounded-lg transition-all duration-200 ${addressTab === 'new'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  New Address
                </button>
              </div>
            </div>

            {addressTab === 'saved' ? (
              <div className="space-y-3 sm:space-y-4">
                {loading ? (
                  <div className="flex justify-center items-center py-8 sm:py-12">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-sm sm:text-base text-gray-600">Loading addresses...</span>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg sm:rounded-xl">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-base sm:text-lg">No saved addresses found</p>
                    <p className="text-gray-400 text-xs sm:text-sm mt-1">Please add a new address to continue</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {addresses.filter(addr => addr.addressType === 'shipping').map(address => (
                      <div
                        key={address._id}
                        className={`group relative p-4 sm:p-6 border-2 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 ${selectedAddress === address._id
                            ? 'border-blue-500 bg-blue-50 shadow-lg'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                          }`}
                        onClick={() => setSelectedAddress(address._id)}
                      >
                        <div className="flex items-start space-x-3 sm:space-x-4">
                          <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center mt-1 ${selectedAddress === address._id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                            }`}>
                            {selectedAddress === address._id && (
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{address.fullName}</h3>
                              {address.isDefault && (
                                <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-2 py-1 rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                              <p className="break-words">{address.addressLine1}</p>
                              {address.addressLine2 && <p className="break-words">{address.addressLine2}</p>}
                              <p>{address.city}, {address.state} {address.postalCode}</p>
                              <p>{address.country}</p>
                              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-3 pt-3 border-t border-gray-200">
                                <span className="flex items-center space-x-1">
                                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  <span className="truncate">{address.email}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  <span className="truncate">{address.phoneNumber}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Full Name*</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={onChangeHandler}
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Phone Number*</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={onChangeHandler}
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Email Address*</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={onChangeHandler}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Address Line 1*</label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={onChangeHandler}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Street address, building, apartment"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={onChangeHandler}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Apartment, suite, unit, building, floor, etc."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="sm:col-span-1 lg:col-span-1">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">State*</label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={onChangeHandler}
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      required
                    >
                      <option value="">Select State</option>
                      {nigerianStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-1 lg:col-span-1">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">City*</label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={onChangeHandler}
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      required
                      disabled={!formData.state}
                    >
                      <option value="">Select City</option>
                      {availableCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Postal Code*</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={onChangeHandler}
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Postal code"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Country*</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={onChangeHandler}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Country"
                    required
                    readOnly
                  />
                </div>

                <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={onChangeHandler}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-3 text-xs sm:text-sm text-gray-700">
                    Save this address for future use
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Order Summary */}
          <div className='w-full lg:w-96 bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100 h-fit'>
            <div className='flex items-center space-x-3 mb-4 sm:mb-6'>
              <div className='w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center'>
                <svg className='w-4 h-4 sm:w-5 sm:h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
                </svg>
              </div>
              <h2 className='text-xl sm:text-2xl font-bold text-gray-900'>Order Summary</h2>
            </div>

            {/* Order Items */}
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6 max-h-60 sm:max-h-80 overflow-y-auto">
              {orderItems.length === 0 ? (
                <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg sm:rounded-xl">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm sm:text-base">Your cart is empty</p>
                </div>
              ) : (
                orderItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image && item.image[0] ? (
                        <img
                          src={item.image[0]}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300">
                          <svg className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">{item.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs sm:text-sm text-gray-500">Size: {item.size}</span>
                        <span className="text-xs sm:text-sm text-gray-500">×{item.quantity}</span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 mt-1">
                        {currency}{(item.price * item.quantity).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Order Totals */}
            <div className="border-t border-gray-200 pt-4 sm:pt-6 space-y-2 sm:space-y-3">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{currency}{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-medium">{currency}{delivery_fee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-base sm:text-lg font-bold border-t pt-2 sm:pt-3">
                <span>Total</span>
                <span>{currency}{(subtotal + delivery_fee).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className='mt-6 sm:mt-8'>
              <h3 className='text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4'>Payment Method</h3>
              <div className='space-y-2 sm:space-y-3'>
                <div
                  onClick={() => setMethod('stripe')}
                  className={`flex items-center p-3 sm:p-4 border-2 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 ${method === 'stripe' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center ${method === 'stripe' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                    {method === 'stripe' && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>}
                  </div>
                  <img className='h-5 sm:h-6 ml-3 sm:ml-4' src={assets.stripe_logo} alt="Stripe" />
                </div>

                <div
                  onClick={() => setMethod('paystack')}
                  className={`flex items-center p-3 sm:p-4 border-2 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 ${method === 'paystack' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center ${method === 'paystack' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                    {method === 'paystack' && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>}
                  </div>
                  <img className='h-5 sm:h-6 ml-3 sm:ml-4' src={assets.paystack_logo} alt="Paystack" />
                </div>

                <div
                  onClick={() => setMethod('cod')}
                  className={`flex items-center p-3 sm:p-4 border-2 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 ${method === 'cod' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center ${method === 'cod' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                    {method === 'cod' && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>}
                  </div>
                  <div className='ml-3 sm:ml-4 flex items-center'>
                    <div className='w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center mr-2 sm:mr-3'>
                      <svg className='w-3 h-3 sm:w-4 sm:h-4 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' />
                      </svg>
                    </div>
                    <span className='text-sm sm:text-base font-bold text-gray-700'>Cash on Delivery</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Place Order Button */}
            <div className='mt-6 sm:mt-8'>
              <button
                type='submit'
                disabled={isCartEmpty() || isProcessing}
                className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold text-white transition-all duration-200 text-sm sm:text-base ${isCartEmpty()
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
                  }`}
              >
                {isProcessing ? 'Processing...' : (
                  <span className="flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Place Order • {currency}{(subtotal + delivery_fee).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                )}
              </button>

              {!isCartEmpty() && (
                <div className="mt-3 sm:mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    Your payment information is secure and encrypted
                  </p>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlaceOrder;