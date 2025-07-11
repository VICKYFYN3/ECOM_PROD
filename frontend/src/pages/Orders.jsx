import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';

const Orders = () => {
  const { backendURL, token, currency } = useContext(ShopContext);
  const [orderData, setOrderData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ongoing'); // 'ongoing' or 'completed'

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

  // Get status color and icon
  const getStatusInfo = (status) => {
    const normalizedStatus = status?.toLowerCase().trim();
    switch (normalizedStatus) {
      case 'delivered':
        return { color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' };
      case 'shipped':
        return { color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' };
      case 'processing':
        return { color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50' };
      case 'pending':
        return { color: 'bg-orange-500', textColor: 'text-orange-700', bgColor: 'bg-orange-50' };
      default:
        return { color: 'bg-gray-500', textColor: 'text-gray-700', bgColor: 'bg-gray-50' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Loading orders...</span>
      </div>
    );
  }

  return (
    <div className='border-t pt-16'>
      <div className='text-xl sm:text-2xl mb-6 sm:mb-8'>
        <Title text1={'MY'} text2={'ORDERS'} />
      </div>
      
      {/* Mobile-friendly Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab('ongoing')}
          className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
            activeTab === 'ongoing'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <span className="block sm:hidden">Ongoing</span>
          <span className="hidden sm:block">Ongoing Orders</span>
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
            activeTab === 'completed'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <span className="block sm:hidden">Completed</span>
          <span className="hidden sm:block">Completed Orders</span>
        </button>
      </div>
      
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === 'ongoing' ? 'No ongoing orders' : 'No completed orders'}
          </h3>
          <p className="text-gray-500 text-sm sm:text-base">
            {activeTab === 'ongoing' 
              ? 'You don\'t have any orders in progress.' 
              : 'You don\'t have any completed orders yet.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((item, index) => {
            const statusInfo = getStatusInfo(item.status);
            return (
              <div key={index} className='bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200'>
                {/* Mobile Card Header */}
                <div className='p-4 sm:p-6'>
                  <div className='flex gap-4'>
                    {/* Product Image */}
                    <div className='flex-shrink-0'>
                      <img 
                        className='w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md border border-gray-100' 
                        src={item.image[0]} 
                        alt={item.name} 
                      />
                    </div>
                    
                    {/* Product Details */}
                    <div className='flex-1 min-w-0'>
                      <h3 className='text-base sm:text-lg font-semibold text-gray-900 truncate'>
                        {item.name}
                      </h3>
                      
                      {/* Price and Quantity - Mobile Stacked */}
                      <div className='mt-2 space-y-1'>
                        <div className='flex items-center justify-between'>
                          <span className='text-lg font-semibold text-gray-900'>
                            {currency}{Number(item.price).toLocaleString()}
                          </span>
                          <span className='text-sm text-gray-500'>
                            Qty: {item.quantity}
                          </span>
                        </div>
                        
                        {/* Size and Date - Mobile Stacked */}
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4'>
                          <span className='text-sm text-gray-600'>
                            Size: {item.size}
                          </span>
                          <span className='text-sm text-gray-500'>
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {/* Payment Method */}
                        <div className='flex items-center gap-2'>
                          <span className='text-sm text-gray-500'>Payment:</span>
                          <span className='text-sm font-medium text-gray-700 capitalize'>
                            {item.paymentMethod}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status and Actions - Mobile Bottom */}
                  <div className='mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                    {/* Status */}
                    <div className='flex items-center gap-2'>
                      <div className={`w-2 h-2 rounded-full ${statusInfo.color}`}></div>
                      <span className={`text-xs font-medium capitalize px-2 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                        {item.status}
                      </span>
                    </div>
                    
                    {/* Track Order Button */}
                    {canTrackOrder(item.status) && (
                      <button 
                        type="button" 
                        onClick={loadOrderData} 
                        className='w-full sm:w-auto bg-gray-900 text-white px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-800 transition-colors duration-200 active:scale-95'
                      >
                        Track Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  )
}

export default Orders