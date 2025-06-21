import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { backendURL } from '../App';

const Compose = ({ token }) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [subscriberCount, setSubscriberCount] = useState(0);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        const fetchSubscriberCount = async () => {
            try {
                const response = await axios.get(`${backendURL}/api/user/subscribers/count`, {
                    headers: { token }
                });
                if (response.data.success) {
                    setSubscriberCount(response.data.count);
                }
            } catch (error) {
                // Error handling
            }
        };

        if (token) {
            fetchSubscriberCount();
        }
    }, [token]);

    const onSendHandler = async (e) => {
        e.preventDefault();
        if (!subject || !message) {
            toast.error('Subject and message are required');
            return;
        }

        setIsSending(true);
        try {
            const response = await axios.post(`${backendURL}/api/user/newsletter/send`, { subject, message }, {
                headers: { token }
            });

            if (response.data.success) {
                toast.success(response.data.message);
                setSubject('');
                setMessage('');
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error('Failed to send newsletter');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="p-4 bg-white shadow-md rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Compose Newsletter</h2>
                <div className="text-lg">
                    Subscribers: <span className="font-bold">{subscriberCount}</span>
                </div>
            </div>
            <form onSubmit={onSendHandler}>
                <div className="mb-4">
                    <label htmlFor="subject" className="block text-gray-700 font-medium mb-2">Subject</label>
                    <input
                        type="text"
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="message" className="block text-gray-700 font-medium mb-2">Message</label>
                    <textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows="10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    ></textarea>
                </div>
                <button
                    type="submit"
                    disabled={isSending}
                    className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200 disabled:bg-blue-300"
                >
                    {isSending ? 'Sending...' : 'Send Newsletter'}
                </button>
            </form>
        </div>
    );
};

export default Compose; 