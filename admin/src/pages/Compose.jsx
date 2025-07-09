import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { backendURL } from '../App';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Compose = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    if (!token) {
        navigate('/'); // Redirect to login
        return null;
    }
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [subscriberCount, setSubscriberCount] = useState(0);
    const [isSending, setIsSending] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

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

    const handleImageUpload = async (file) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);

            console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);

            const response = await axios.post(`${backendURL}/api/user/upload/newsletter-image`, formData, {
                headers: { 
                    token,
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('Upload response:', response.data);

            if (response.data.success) {
                setSelectedImage(response.data.imageUrl);
                setImagePreview(URL.createObjectURL(file));
                toast.success('Image uploaded successfully');
            } else {
                toast.error(response.data.message || 'Failed to upload image');
            }
        } catch (error) {
            console.error('Upload error:', error);
            
            let errorMessage = 'Failed to upload image';
            if (error.response) {
                // Server responded with error
                errorMessage = error.response.data.message || errorMessage;
                console.error('Server error:', error.response.data);
            } else if (error.request) {
                // Network error
                errorMessage = 'Network error. Please check your connection.';
                console.error('Network error:', error.request);
            } else {
                // Other error
                errorMessage = error.message || errorMessage;
                console.error('Other error:', error.message);
            }
            
            toast.error(errorMessage);
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageUpload(file);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            handleImageUpload(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
    };

    const onSendHandler = async (e) => {
        e.preventDefault();
        if (!subject || !message) {
            toast.error('Subject and message are required');
            return;
        }

        setIsSending(true);
        try {
            const newsletterData = {
                subject,
                message,
                imageUrl: selectedImage
            };

            const response = await axios.post(`${backendURL}/api/user/newsletter/send`, newsletterData, {
                headers: { token }
            });

            if (response.data.success) {
                toast.success(response.data.message);
                setSubject('');
                setMessage('');
                removeImage();
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

                {/* Image Upload Section */}
                <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Newsletter Image (Optional)</label>
                    
                    {!selectedImage ? (
                        <div className="space-y-3">
                            <div
                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                            >
                                <div className="space-y-2">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="text-gray-600">
                                        <span className="font-medium">Drag and drop</span> your image here
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                                </div>
                            </div>
                            
                            <div className="text-center">
                                <span className="text-gray-500 text-sm">or</span>
                            </div>
                            
                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('imageInput').click()}
                                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                                >
                                    Select Image
                                </button>
                                <input
                                    id="imageInput"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            <img
                                src={imagePreview}
                                alt="Newsletter preview"
                                className="w-full max-h-64 object-cover rounded-lg border border-gray-200"
                            />
                            <button
                                type="button"
                                onClick={removeImage}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}
                    
                    {isUploading && (
                        <div className="mt-2 text-sm text-blue-600 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            Uploading image...
                        </div>
                    )}
                </div>

                <div className="mb-4">
                    <label htmlFor="message" className="block text-gray-700 font-medium mb-2">Message</label>
                    <textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows="10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Write your newsletter content here. You can use HTML tags for formatting."
                        required
                    ></textarea>
                </div>
                <button
                    type="submit"
                    disabled={isSending || isUploading}
                    className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200 disabled:bg-blue-300"
                >
                    {isSending ? 'Sending...' : 'Send Newsletter'}
                </button>
            </form>
        </div>
    );
};

export default Compose; 