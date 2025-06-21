import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../../context/ShopContext';
import axios from 'axios';
import { toast } from 'sonner';

const ContactMessages = () => {
    const { backendURL, token } = useContext(ShopContext);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                backendURL + '/api/contact/user-messages',
                { headers: { token } }
            );

            if (response.data.success) {
                setMessages(response.data.data);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const refreshMessages = async () => {
        setRefreshing(true);
        try {
            const response = await axios.get(
                backendURL + '/api/contact/user-messages',
                { headers: { token } }
            );

            if (response.data.success) {
                setMessages(response.data.data);
                toast.success('Messages refreshed');
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error refreshing messages:', error);
            toast.error('Failed to refresh messages');
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-800';
            case 'in-progress': return 'bg-yellow-100 text-yellow-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'closed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const hasNewResponses = messages.some(message => 
        message.adminResponse && message.status === 'resolved'
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading messages...</span>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">My Contact Messages</h2>
                <button
                    onClick={refreshMessages}
                    disabled={refreshing}
                    className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    <svg className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {hasNewResponses && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-green-800 font-medium">You have new responses from our support team!</span>
                    </div>
                </div>
            )}

            {messages.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                    <p className="text-gray-500">You haven't sent any contact messages yet.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {messages.map((message) => (
                        <div key={message._id} className="bg-white border rounded-lg p-6 shadow-sm">
                            {/* Message Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{message.subject}</h3>
                                    <p className="text-sm text-gray-500">Sent on {formatDate(message.createdAt)}</p>
                                </div>
                                <div className="flex gap-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(message.priority)}`}>
                                        {message.priority}
                                    </span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                                        {message.status}
                                    </span>
                                </div>
                            </div>

                            {/* Your Message */}
                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Your Message:</h4>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-gray-900">{message.message}</p>
                                </div>
                            </div>

                            {/* Admin Response */}
                            {message.adminResponse && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Admin Response:</h4>
                                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                                        <p className="text-gray-900">{message.adminResponse}</p>
                                        {message.respondedAt && (
                                            <p className="text-xs text-gray-500 mt-2">
                                                Responded on {formatDate(message.respondedAt)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Message Status */}
                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <span>
                                    {message.status === 'new' && 'We\'ll review your message soon'}
                                    {message.status === 'in-progress' && 'We\'re working on your request'}
                                    {message.status === 'resolved' && 'Your issue has been resolved'}
                                    {message.status === 'closed' && 'This conversation is closed'}
                                </span>
                                {message.updatedAt !== message.createdAt && (
                                    <span>Updated {formatDate(message.updatedAt)}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ContactMessages; 