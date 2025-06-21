import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const NewsLetterBox = () => {
    const { backendURL, token, profileData } = useContext(ShopContext);
    const [email, setEmail] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (profileData) {
            setEmail(profileData.email);
        } else {
            setEmail('');
        }
    }, [profileData]);

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        if (!token) {
            toast.error('Please login to subscribe to our newsletter');
            navigate('/login');
            return;
        }
        try {
            const response = await axios.post(`${backendURL}/api/user/subscribe`, {}, {
                headers: {
                    token
                }
            });
            if (response.data.success) {
                toast.success(response.data.message);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error('An error occurred. Please try again later.');
        }
    };

    return (
        <div className='text-center'>
            <p className='text-2xl font-medium text-gray-800'>Subscribe to our newsletter and get 10% off your first purchase</p>
            <p className='text-gray-400 mt-3'>
                Stay up to date with our latest collections, offers, and more.
            </p>
            <form onSubmit={onSubmitHandler} className='w-full sm:w-1/2 flex items-center gap-3 mx-auto my-6 border pl-3'>
                <input
                    className='w-full sm:flex-1 outline-none bg-transparent'
                    type="email"
                    placeholder='Enter your email'
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!!profileData}
                />
                <button type='submit' disabled={profileData?.subscribed} className='bg-black text-white text-xs px-10 py-4 disabled:bg-gray-500'>
                    {profileData?.subscribed ? "SUBSCRIBED" : "SUBSCRIBE"}
                </button>
            </form>
        </div>
    );
};

export default NewsLetterBox;