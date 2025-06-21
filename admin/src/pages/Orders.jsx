import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendURL, currency } from '../App';
import { toast } from 'sonner';

const Orders = ({ token }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchAllOrders = async () => {
        if (!token) {
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post(`${backendURL}/api/order/list`, {}, { headers: { token } });
            if (response.data.success) {
                setOrders(response.data.orders);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const statusHandler = async (event, orderId) => {
        try {
            const response = await axios.post(`${backendURL}/api/order/status`, { orderId, status: event.target.value }, { headers: { token } });
            if (response.data.success) {
                await fetchAllOrders();
                toast.success("Order status updated successfully");
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const paymentStatusHandler = async (orderId, newPaymentStatus) => {
        try {
            const response = await axios.post(`${backendURL}/api/order/payment-status`, { orderId, payment: newPaymentStatus === 'true' }, { headers: { token } });
            if (response.data.success) {
                await fetchAllOrders();
                toast.success(`Payment status updated successfully`);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    useEffect(() => {
        fetchAllOrders();
    }, [token]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading orders...</span>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Customer Orders</h2>
            
            {orders.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-500">When customers place orders, they will appear here.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map((order, index) => (
                        <div className='grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-6 items-start border rounded-lg shadow-sm p-5 bg-white' key={index}>
                            <div>
                                <div className='mb-4'>
                                    <p className='font-semibold text-gray-800'>{order.address.firstName} {order.address.lastName}</p>
                                    <p className='text-sm text-gray-600'>{order.address.street}, {order.address.city}, {order.address.state} {order.address.zipcode}</p>
                                    <p className='text-sm text-gray-600'>{order.address.country}</p>
                                    <p className='text-sm text-gray-600 mt-1'>Phone: {order.address.phone}</p>
                                    <p className='text-sm text-gray-600'>Email: {order.address.email}</p>
                                </div>
                                
                                <h4 className='font-semibold text-gray-800 mt-4 pt-4 border-t border-gray-200'>Order Items</h4>
                                <div className='mt-3 space-y-3'>
                                    {order.items.map((item, itemIndex) => (
                                        <div key={itemIndex} className='flex items-center gap-4'>
                                            <img src={item.image} alt={item.name} className='w-16 h-16 object-cover rounded-md border border-gray-200' />
                                            <div className='flex-grow'>
                                                <p className='font-semibold text-gray-800'>{item.name}</p>
                                                <p className='text-sm text-gray-500'>Size: {item.size}</p>
                                                <p className='text-sm text-gray-500'>Qty: {item.quantity}</p>
                                            </div>
                                            <p className='font-semibold text-gray-800'>{currency}{(item.price * item.quantity).toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className='text-sm text-gray-600 space-y-1'>
                                <p><span className='font-semibold text-gray-800'>Items:</span> {order.items.length}</p>
                                <p><span className='font-semibold text-gray-800'>Method:</span> {order.paymentMethod}</p>
                                <div className='flex items-center gap-2'>
                                    <span className='font-semibold text-gray-800'>Payment:</span>
                                    {order.paymentMethod === 'COD' ? (
                                        <select 
                                            onChange={(e) => paymentStatusHandler(order._id, e.target.value)} 
                                            value={order.payment.toString()}
                                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors border ${
                                                order.payment 
                                                    ? 'bg-green-100 text-green-800 border-green-200' 
                                                    : 'bg-red-100 text-red-800 border-red-200'
                                            }`}
                                        >
                                            <option value="false">Pending</option>
                                            <option value="true">Done</option>
                                        </select>
                                    ) : (
                                        <span className={`px-3 py-1 rounded-md text-xs font-semibold ${
                                            order.payment 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {order.payment ? 'Done' : 'Pending'}
                                        </span>
                                    )}
                                </div>
                                <p><span className='font-semibold text-gray-800'>Date:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            
                            <p className='font-semibold text-lg text-gray-800'>{currency}{order.amount.toLocaleString()}</p>
                            
                            <select onChange={(event) => statusHandler(event, order._id)} value={order.status} className='p-2 font-semibold bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition'>
                                <option value="Order Placed">Order Placed</option>
                                <option value="Packing">Packing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Out For Delivery">Out For Delivery</option>
                                <option value="Delivered">Delivered</option>
                            </select>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Orders;