import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { backendURL } from '../App'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ContactMessages = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    if (!token) {
        navigate('/'); // Redirect to login
        return null;
    }
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)
    const [stats, setStats] = useState({})
    const [selectedMessage, setSelectedMessage] = useState(null)
    const [showResponseModal, setShowResponseModal] = useState(false)
    const [responseText, setResponseText] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        page: 1
    })

    const fetchMessages = async () => {
        setLoading(true)
        try {
            const queryParams = new URLSearchParams({
                page: filters.page,
                limit: 10,
                ...(filters.status && { status: filters.status }),
                ...(filters.priority && { priority: filters.priority })
            }).toString();

            const response = await axios.get(`${backendURL}/api/contact/all?${queryParams}`, {
                headers: { token }
            });
            
            if (response.data.success) {
                setMessages(response.data.data);
            } else {
                toast.error(response.data.message)
            }
        } catch (error) {
            toast.error('Failed to refresh messages');
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const response = await axios.get(backendURL + '/api/contact/stats', {
                headers: { token }
            });
            
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            // Error handling
        }
    }

    const updateMessageStatus = async (messageId, status, response = '') => {
        setIsSubmitting(true);
        try {
            const responseData = await axios.put(
                `${backendURL}/api/contact/${messageId}/status`,
                { status, adminResponse: response },
                { headers: { token } }
            );

            if (responseData.data.success) {
                toast.success('Message status updated successfully');
                setShowResponseModal(false);
                setSelectedMessage(null);
                setResponseText('');
                await fetchMessages();
                await fetchStats();
            } else {
                toast.error(responseData.data.message);
            }
        } catch (error) {
            toast.error('Failed to update message status');
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleStatusUpdate = (message, newStatus) => {
        if (newStatus === 'resolved' || newStatus === 'in-progress') {
            setSelectedMessage(message);
            setShowResponseModal(true);
        } else {
            updateMessageStatus(message._id, newStatus);
        }
    }

    const handleResponseSubmit = () => {
        if (!responseText.trim()) {
            toast.error('Please enter a response');
            return;
        }
        updateMessageStatus(selectedMessage._id, 'resolved', responseText);
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-800';
            case 'in-progress': return 'bg-yellow-100 text-yellow-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'closed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    useEffect(() => {
        fetchMessages();
        fetchStats();
    }, [filters]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading messages...</span>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-sm">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Contact Messages</h2>
                <p className="text-sm text-gray-600 mt-1">Manage customer support inquiries</p>
            </div>

            {/* Stats Cards */}
            <div className="px-6 py-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500">Total Messages</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.totalMessages || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500">New Messages</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.newMessages || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-wrap gap-4">
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="new">New</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                    <select
                        value={filters.priority}
                        onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value, page: 1 }))}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Priorities</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
            </div>

            {/* Messages Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Subject
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Priority
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {messages.map((message) => (
                            <tr key={message._id} className="hover:bg-gray-50 transition-colors duration-150">
                                <td className="px-6 py-4">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{message.name}</div>
                                        <div className="text-sm text-gray-500">{message.email}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900 max-w-xs truncate">{message.subject}</div>
                                    <div className="text-sm text-gray-500 max-w-xs truncate">{message.message}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(message.priority)}`}>
                                        {message.priority}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                                        {message.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(message.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <select
                                        value={message.status}
                                        onChange={(e) => handleStatusUpdate(message, e.target.value)}
                                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="new">New</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Empty State */}
            {messages.length === 0 && !loading && (
                <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
                    <p className="text-gray-500">No contact messages match your current filters.</p>
                </div>
            )}

            {/* Response Modal */}
            {showResponseModal && selectedMessage && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Respond to Message</h3>
                            <button
                                onClick={() => {
                                    setShowResponseModal(false);
                                    setSelectedMessage(null);
                                    setResponseText('');
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Customer Message:</h4>
                            <div className="bg-gray-50 p-3 rounded-md">
                                <p className="text-sm text-gray-900 font-medium">{selectedMessage.subject}</p>
                                <p className="text-sm text-gray-600 mt-1">{selectedMessage.message}</p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Your Response
                            </label>
                            <textarea
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your response to the customer..."
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowResponseModal(false);
                                    setSelectedMessage(null);
                                    setResponseText('');
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleResponseSubmit}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Sending...' : 'Send Response'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ContactMessages 