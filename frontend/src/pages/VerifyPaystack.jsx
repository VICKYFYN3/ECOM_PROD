import React from 'react';
import { useContext } from 'react';
import { ShopContext } from './../context/ShopContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

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
                `${backendURL}/api/order/verifyPaystack`,
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
            toast.error('Payment verification failed');
            navigate('/cart');
        }
    };

    useEffect(() => {
        if (reference && orderId) {
            verifyPayment();
        } else {
            navigate('/');
        }
    }, [token, reference, orderId]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            
        </div>
    );
};

export default VerifyPaystack;