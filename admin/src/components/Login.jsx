import React, { useState } from 'react'
import axios from 'axios'
import { backendURL } from '../App';
import { toast } from 'sonner';

const Login = ({ setToken }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const onSubmitHandler = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        try {
            const response = await axios.post(backendURL + '/api/user/admin', { email, password })
            if (response.data.success) {
                setToken(response.data.token);
            } else {
                toast.error(response.data.message);
            }

        } catch (error) {
            toast.error(error.message)
        } finally {
            setIsLoggingIn(false);
        }
    }
    return (
        <div className='min-h-screen flex items-center justify-center bg-gray-100'>
            <div className='bg-white shadow-md rounded-lg px-8 py-6 max-w-md'>
                <h1 className='text-2xl font-bold mb-4'>Admin Panel</h1>
                <form onSubmit={onSubmitHandler}>
                    <div className='mb-4 min-w-72'>
                        <p className='text-sm font-medium text-gray-700 mb-2'>Email Address</p>
                        <input onChange={(e) => setEmail(e.target.value)} value={email} className='rounded-md w-full px-3 py-2 border border-gray-300 outline-none' type="email" placeholder='your@email.com' required disabled={isLoggingIn} />
                    </div>
                    <div className='mb-4 min-w-72'>
                        <p className='text-sm font-medium text-gray-700 mb-2'>Password</p>
                        <input onChange={(e) => setPassword(e.target.value)} value={password} className='rounded-md w-full px-3 py-2 border border-gray-300 outline-none' type="password" placeholder='Enter your password' required disabled={isLoggingIn} />
                    </div>
                    <button disabled={isLoggingIn} className='mt-2 w-full py-2 px-4 rounded-md text-white bg-black cursor-pointer disabled:bg-gray-500' type='submit'>
                        {isLoggingIn ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Login