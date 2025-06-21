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
        return status !== 'delivered' && 
               status !== 'cancelled' && 
               status !== 'returned';
      });
    } else {
      return orderData.filter(item => {
        const status = item.status?.toLowerCase().trim();
        return status === 'delivered' || 
               status === 'cancelled' || 
               status === 'returned';
      });
    }
  };

  const filteredOrders = getFilteredOrders();

  // Check if order status allows tracking
  const canTrackOrder = (status) => {
    const normalizedStatus = status?.toLowerCase().trim();
    return normalizedStatus !== 'delivered' && 
           normalizedStatus !== 'cancelled' && 
           normalizedStatus !== 'returned';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading orders...</span>
      </div>
    );
  }

  return (
    <div className='border-t pt-16'>
      <div className='text-2xl mb-8'>
        <Title text1={'MY'} text2={'ORDERS'} />
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('ongoing')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'ongoing'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Ongoing Orders
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'completed'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Completed Orders
        </button>
      </div>
      
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === 'ongoing' ? 'No ongoing orders' : 'No completed orders'}
          </h3>
          <p className="text-gray-500">
            {activeTab === 'ongoing' 
              ? 'You don\'t have any orders in progress.' 
              : 'You don\'t have any completed orders yet.'
            }
          </p>
        </div>
      ) : (
        <div>
          {filteredOrders.map((item, index) => (
            <div key={index} className='py-4 border-t border-b text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
              <div className='flex items-start gap-6 text-sm'>
                <img className='w-16 sm:w-20' src={item.image[0]} alt="" />
                <div>
                  <p className='text-lg font-semibold'>{item.name}</p>
                  <div className='flex items-center gap-3 mt-1 text-base text-gray-700'>
                    <p >{currency}{item.price}</p>
                    <p>Quantity: {item.quantity}</p>
                    <p>Size: {item.size}</p>
                  </div>
                  <p className='mt-1'>Date: <span className='text-gray-400'>{new Date(item.date).toDateString()}</span></p>
                  <p className='mt-1'>Payment: <span className='text-gray-400'>{item.paymentMethod}</span></p>
                </div>
              </div>
              <div className='md:w-1/2 flex justify-between'>
                <div className='flex items-center gap-2'>
                  <p className={`min-w-2 h-2 rounded-full ${
                    item.status === 'delivered' ? 'bg-green-500' :
                    item.status === 'cancelled' ? 'bg-red-500' :
                    item.status === 'returned' ? 'bg-orange-500' :
                    'bg-blue-500'
                  }`}></p>
                  <p className='text-sm md:text-base capitalize'>{item.status}</p>
                </div>
                {canTrackOrder(item.status) && (
                  <button 
                    type="button" 
                    onClick={loadOrderData} 
                    className='cursor-pointer border px-4 py-2 text-sm font-medium rounded-sm hover:bg-gray-50 transition-colors'
                  >
                    Track Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Orders