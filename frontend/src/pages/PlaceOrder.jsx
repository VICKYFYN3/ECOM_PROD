import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Title from '../components/Title';
import CartTotal from '../components/CartTotal';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';


const PlaceOrder = () => {
  const { products, currency, cartItems } = useContext(ShopContext);
  const [subtotal, setSubtotal] = useState(0);
  const [method, setMethod] = useState('cod');
  const { backendURL, token, setCartItems, getCartTotal, delivery_fee } = useContext(ShopContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
    phone: ''
  })
  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;

    setFormData(data => ({ ...data, [name]: value }))
  }
  const onSubmitHandler = async (event) => {
    event.preventDefault()
    try {
      let orderItems = []
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            const itemInfo = structuredClone(products.find(product => product._id === items))
            if (itemInfo) {
              itemInfo.size = item
              itemInfo.quantity = cartItems[items][item]
              orderItems.push(itemInfo)
            }
          }
        }
      }
      let orderData = {
        address: formData,
        items: orderItems,
        amount: getCartTotal() + delivery_fee

      }
      switch (method) {
        //api calls for cod
        case 'cod': {
          const response = await axios.post(backendURL + '/api/order/place', orderData, { headers: { token } })
          if (response.data.success) {
            setCartItems({})
            navigate('/orders')
          } else {
            toast.error(response.data.message)
          }
          break;
        }
        case 'stripe': {
          const responseStripe = await axios.post(backendURL + '/api/order/stripe', orderData, { headers: { token } })
          if (responseStripe.data.success) {
            const { session_url } = responseStripe.data
            window.location.replace(session_url)
          } else {
            toast.error(responseStripe.data.message)
          }
          break;
        }
        case 'paystack': {
          const responsePaystack = await axios.post(
            backendURL + '/api/order/paystack',
            orderData,
            { headers: { token } }
          );

          if (responsePaystack.data.success) {
            const { authorization_url } = responsePaystack.data;
            window.location.replace(authorization_url);
          } else {
            toast.error(responsePaystack.data.message);
          }
          break;
        }

        default:

          break;
      }

    } catch (error) {
      console.log(error);
      toast.error(error.message)

    }
  }
  // Check if cart is empty
  const isCartEmpty = () => {
    return Object.values(cartItems).every(item =>
      Object.values(item).every(quantity => quantity === 0)
    );
  };

  useEffect(() => {
    let total = 0;
    for (const itemId in cartItems) {
      for (const size in cartItems[itemId]) {
        if (cartItems[itemId][size] > 0) {
          const productData = products.find(product => product._id === itemId);
          if (productData) {
            total += productData.price * cartItems[itemId][size];
          }
        }
      }
    }
    setSubtotal(total);
  }, [cartItems, products]);

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t'>
      {/* ---------------Left Side------------ */}
      <div className='flex flex-col gap-4 w-full sm:max-w-[480px]'>
        <div className='text-xl sm:text-2xl my-3'>
          <Title text1={'DELIVERY'} text2={'INFORMATION'} />
        </div>
        <div className='flex gap-2'>
          <input required onChange={onChangeHandler} name='firstName' value={formData.firstName} type='text' placeholder='First name' className='border border-gray-300 rounded py-1.5 px-3 w-full' />
          <input required onChange={onChangeHandler} name='lastName' value={formData.lastName} type='text' placeholder='Last name' className='border border-gray-300 rounded py-1.5 px-3 w-full' />
        </div>
        <input required onChange={onChangeHandler} name='email' value={formData.email} type='email' placeholder='Email address' className='border border-gray-300 rounded py-1.5 px-3 w-full' />
        <input required onChange={onChangeHandler} name='street' value={formData.street} type='text' placeholder='Street address' className='border border-gray-300 rounded py-1.5 px-3 w-full' />
        <div className='flex gap-2'>
          <input required onChange={onChangeHandler} name='city' value={formData.city} type='text' placeholder='City' className='border border-gray-300 rounded py-1.5 px-3 w-full' />
          <input required onChange={onChangeHandler} name='state' value={formData.state} type='text' placeholder='State' className='border border-gray-300 rounded py-1.5 px-3 w-full' />
        </div>
        <div className='flex gap-2'>
          <input required onChange={onChangeHandler} name='zipcode' value={formData.zipcode} type='number' placeholder='Zipcode' className='border border-gray-300 rounded py-1.5 px-3 w-full' />
          <input required onChange={onChangeHandler} name='country' value={formData.country} type='text' placeholder='Country' className='border border-gray-300 rounded py-1.5 px-3 w-full' />
        </div>
        <input required onChange={onChangeHandler} name='phone' value={formData.phone} type='number' placeholder='Phone' className='border border-gray-300 rounded py-1.5 px-3 w-full' />
      </div>

      {/* -----------Right Side---------- */}
      <div className='mt-8'>
        <div className='min-w-80'>
          <div className='text-xl sm:text-2xl my-3'>
            <Title text1={'ORDER'} text2={'SUMMARY'} />
          </div>
          <div>
            <CartTotal
              subtotal={isCartEmpty() ? 0 : subtotal}
              currency={currency}
              showCheckoutButton={false}
              shippingFee={10}
              showShippingFee={true}
              forceZeroTotal={isCartEmpty()}
            />
          </div>
          <div className='mt-12'>
            <Title text1={'PAYMENT'} text2={'METHOD'} />
            {/* -----payment method selection------------ */}
            <div className='flex gap-3 flex-col lg:flex-row'>
              {/* Stripe option */}
              <div onClick={() => setMethod('stripe')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
                <div className={`w-3.5 h-3.5 border rounded-full ${method === 'stripe' ? 'bg-green-400' : ''}`}></div>
                <img className='h-5 mx-4' src={assets.stripe_logo} alt="Stripe" />
              </div>

              {/* Paystack option */}
              <div onClick={() => setMethod('paystack')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
                <div className={`w-3.5 h-3.5 border rounded-full ${method === 'paystack' ? 'bg-green-400' : ''}`}></div>
                <img className='h-5 mx-4' src={assets.paystack_logo} alt="Paystack" />
              </div>

              {/* COD option */}
              <div onClick={() => setMethod('cod')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
                <div className={`w-3.5 h-3.5 border rounded-full ${method === 'cod' ? 'bg-green-400' : ''}`}></div>
                <p className='text-gray-500 text-sm font-medium mx-4'>CASH ON DELIVERY</p>
              </div>
            </div>
            {/* --------------Place Order Button---------------- */}
            <div className='w-full text-end mt-8'>
              <button type='submit' className=" bg-black text-white px-16 py-3 text-sm cursor-pointer">PLACE ORDER</button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;