import React from 'react'
import { useContext } from 'react'
import { ShopContext } from './../context/ShopContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const VerifyPaystack = () => {
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
            
            const response = await axios.post(backendURL+'/api/order/verifyPaystack',{success,orderId},{headers:{token}})
            if (response.data.success) {
                setCartItems({})
                toast.success("Paystack payment successful")
                navigate('/orders')
            }else{
                navigate('/cart')
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
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

export default VerifyPaystack