import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import axios from 'axios';
import React, { useContext, useEffect, useState, useRef } from 'react';

const Orders = () => {
  const { backendURL, token, currency } = useContext(ShopContext);
  const [orderData, setOrderData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ongoing'); // 'ongoing' or 'completed'
  const contentRef = useRef(null);

  const loadOrderData = async () => {
    try {
      if (!token) {
        return null;
      }

      setLoading(true);
      const response = await axios.post(backendURL + '/api/order/userorders', {}, { headers: { token } })
      if (response.data.success) {
        let allOrdersItem = []
        response.data.orders.map((order) => {
          order.items.map((item) => {
            item['status'] = order.status
            item['payment'] = order.payment
            item['paymentMethod'] = order.paymentMethod
            item['date'] = order.createdAt
            allOrdersItem.push(item)
          })
        })
        setOrderData(allOrdersItem.reverse())
      }
    } catch (error) {
      // Error handling
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrderData()
  }, [token])

  // Smooth scroll to content when tab changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [activeTab]);

  // Filter orders based on active tab
  const getFilteredOrders = () => {
    if (activeTab === 'ongoing') {
      return orderData.filter(item => {
        const status = item.status?.toLowerCase().trim();
        return status !== 'delivered';
      });
    } else {
      return orderData.filter(item => {
        const status = item.status?.toLowerCase().trim();
        return status === 'delivered';
      });
    }
  };

  const filteredOrders = getFilteredOrders();

  // Check if order status allows tracking
  const canTrackOrder = (status) => {
    const normalizedStatus = status?.toLowerCase().trim();
    return normalizedStatus !== 'delivered';
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <span className="text-gray-600">Loading your orders...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center md:text-left">
            <Title text1={'MY'} text2={'ORDERS'} />
            <p className="mt-2 text-gray-600">Track and manage your orders</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Enhanced Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="flex">
            <button
              onClick={() => handleTabChange('ongoing')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 relative ${
                activeTab === 'ongoing'
                  ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-b-2 border-purple-500'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Ongoing Orders</span>
              </div>
            </button>
            <button
              onClick={() => handleTabChange('completed')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 relative ${
                activeTab === 'completed'
                  ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-b-2 border-purple-500'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Completed Orders</span>
              </div>
            </button>
          </div>
        </div>
        
        {/* Content Section */}
        <div ref={contentRef}>
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {activeTab === 'ongoing' ? 'No ongoing orders' : 'No completed orders'}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {activeTab === 'ongoing' 
                  ? 'You don\'t have any orders in progress. Start shopping to see your orders here.' 
                  : 'You don\'t have any completed orders yet. Complete some orders to see them here.'
                }
              </p>
              {activeTab === 'ongoing' && (
                <button 
                  onClick={() => window.location.href = '/collection'}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium"
                >
                  Start Shopping
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((item, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      {/* Product Info */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            className="w-full h-full object-cover" 
                            src={item.image[0]} 
                            alt={item.name} 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{item.name}</h3>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Price:</span>
                              <p className="text-gray-900 font-semibold">{currency}{item.price}</p>
                            </div>
                            <div>
                              <span className="font-medium">Quantity:</span>
                              <p>{item.quantity}</p>
                            </div>
                            <div>
                              <span className="font-medium">Size:</span>
                              <p>{item.size}</p>
                            </div>
                            <div>
                              <span className="font-medium">Payment:</span>
                              <p className="capitalize">{item.paymentMethod}</p>
                            </div>
                          </div>
                          <div className="mt-3 text-sm text-gray-500">
                            <span className="font-medium">Order Date:</span> {new Date(item.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            item.status === 'delivered' ? 'bg-green-500' :
                            'bg-blue-500'
                          }`}></div>
                          <span className="text-sm font-medium capitalize text-gray-900">{item.status}</span>
                        </div>
                        
                        {canTrackOrder(item.status) && (
                          <button 
                            type="button" 
                            onClick={loadOrderData} 
                            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium text-sm"
                          >
                            Track Order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Orders