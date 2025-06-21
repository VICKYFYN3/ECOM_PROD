import React from 'react'
import { useContext } from 'react'
import { ShopContext } from './../context/ShopContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const Verify = () => {
    const navigate = useNavigate()
    const { token,setCartItems,backendURL } = useContext(ShopContext)
    const [searchParams] = useSearchParams()

    const success = searchParams.get('success')
    const orderId = searchParams.get('orderId')

    const verifyPayment = async () => {
        try {
            if (!token) {
                return null
            }
            
            const response = await axios.post(backendURL+'/api/order/verifyStripe',{success,orderId},{headers:{token}})
            if (response.data.success) {
                setCartItems({})
                toast.success("Stripe payment successful")
                navigate('/orders')
            }else{
                navigate('/cart')
            }
        } catch (error) {
            toast.error('Payment verification failed');
            navigate('/cart');
        }
    }

    useEffect(()=>{
        verifyPayment()
    },[token])

    return (
        <div>
            
        </div>
    )
}

export default Verify