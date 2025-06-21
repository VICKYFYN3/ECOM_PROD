import React, { useEffect, useState } from 'react';
import { ShopContext } from "./ShopContext";
import axios from 'axios';
import { toast } from 'sonner';

const ShopContextProvider = (props) => {
    const currency = '₦';
    const delivery_fee = 3000;
    const backendURL = import.meta.env.VITE_BACKEND_URL;
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [products, setProducts] = useState([]);
    const [cartItems, setCartItems] = useState({});
    const [token, setToken] = useState('');
    const [profileData, setProfileData] = useState(null);

    // Add to cart function
    const addToCart = async(itemId, size) => {
        if(!size){
            toast.error('Select Product Size');
            return;
        }
        
        let cartData = structuredClone(cartItems);
        
        if(cartData[itemId]){
            if(cartData[itemId][size]){
                cartData[itemId][size] += 1;
            }
            else{
                cartData[itemId][size] = 1;
            }
        }
        else{
            cartData[itemId] = {};
            cartData[itemId][size] = 1;
        }
        
        setCartItems(cartData);
        if(token){
            try {
                await axios.post(backendURL + '/api/cart/add',{itemId,size},{headers:{token}});
                toast.success('Product added to cart');
            } catch (error) {
                toast.error(error.message);
            }
        }
    }
    
    // Remove from cart function
    const removeFromCart = (itemId, size) => {
        let cartData = structuredClone(cartItems);
        
        if(cartData[itemId] && cartData[itemId][size]) {
            delete cartData[itemId][size];
            
            if(Object.keys(cartData[itemId]).length === 0) {
                delete cartData[itemId];
            }
            
            setCartItems(cartData);
            toast.info('Product removed from cart');
        }
    }
    
    // Update cart item quantity
    const updateCartItemQuantity = async (itemId, size, quantity) => {
        if(quantity < 1) return;
        
        let cartData = structuredClone(cartItems);
        
        if(cartData[itemId] && cartData[itemId][size]) {
            cartData[itemId][size] = quantity;
            setCartItems(cartData);
        }
        if(token){
            try {
                await axios.post(backendURL + '/api/cart/update',{itemId,size,quantity} , {headers:{token}});
            } catch (error) {
                toast.error(error.message);
            }
        }
    }
    
    // Get total cart count
    const getCartCount = () => {
        let totalCount = 0;
        for(const items in cartItems){
            for(const item in cartItems[items]){
                try{
                    if(cartItems[items][item] > 0){
                        totalCount += cartItems[items][item];
                    }
                } catch(error){
                    console.error(error);
                }
            }
        }
        return totalCount;
    }
    
    // Get cart total
    const getCartTotal = () => {
        let totalAmount = 0;
        for(const itemId in cartItems) {
            for(const size in cartItems[itemId]) {
                try {
                    const quantity = cartItems[itemId][size];
                    const itemData = products.find(product => product._id === itemId);
                    if(itemData && quantity > 0) {
                        totalAmount += itemData.price * quantity;
                    }
                } catch(error) {
                    console.error("Error calculating cart total:", error);
                }
            }
        }
        return totalAmount;
    }
    
    const getProductsData = async () => {
        try {
            const response = await axios.get(backendURL + '/api/product/list');
            if(response.data.success){
                setProducts(response.data.products);
            }else{
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }
    
    const getUserCart = async (token) => {
        try {
            const response = await axios.post(backendURL + '/api/cart/get',{},{headers:{token}});
            if(response.data.success){
                setCartItems(response.data.cartData);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    const getProfileData = async (token) => {
        try {
            const response = await axios.post(backendURL + '/api/user/profile/get', {}, { headers: { token } });
            if (response.data.success) {
                setProfileData(response.data.profile);
            }
        } catch (error) {
            // Error handling
        }
    };

    useEffect(() => {
        getProductsData();
    }, []);

    useEffect(() => {
        if(!token && localStorage.getItem('token')){
            setToken(localStorage.getItem('token'));
        }
    }, []);

    useEffect(() => {
        if(token){
            getUserCart(token);
            getProfileData(token);
        } else {
            setCartItems({});
            setProfileData(null);
        }
    }, [token]);

    const value = {
        products,
        currency,
        delivery_fee,
        search,
        setSearch,
        showSearch,
        setShowSearch,
        cartItems,
        addToCart,
        setCartItems,
        removeFromCart,
        updateCartItemQuantity,
        getCartCount,
        getCartTotal,
        backendURL,
        setToken,
        token,
        profileData,
    }
    
    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    );
};

export default ShopContextProvider;