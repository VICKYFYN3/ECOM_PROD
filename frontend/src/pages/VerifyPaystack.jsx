import React from 'react';
import { useContext } from 'react';
import { ShopContext } from './../context/ShopContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const VerifyPaystack = () => {
    const navigate = useNavigate();
    const { token, setCartItems, backendURL } = useContext(ShopContext);
    const [searchParams] = useSearchParams();

    const orderId = searchParams.get('orderId');
    const reference = searchParams.get('reference');

    const verifyPayment = async () => {
        try {
            if (!token || !reference) {
                navigate('/');
                return;
            }
            
            const response = await axios.post(
                backendURL + '/api/order/verifyPaystack',
                { orderId, reference },
                { headers: { token } }
            );
            
            if (response.data.success) {
                setCartItems({});
                toast.success("Payment successful!");
                navigate('/orders');
            } else {
                toast.error("Payment verification failed");
                navigate('/cart');
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
            navigate('/cart');
        }
    };

    useEffect(() => {
        if (reference && orderId) {
            verifyPayment();
        } else {
            navigate('/');
        }
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-lg font-medium">Verifying Paystack payment...</p>
            </div>
        </div>
    );
};

export default VerifyPaystack;