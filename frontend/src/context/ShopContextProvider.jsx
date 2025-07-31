import React, { useEffect, useState } from 'react';
import { ShopContext } from "./ShopContext";
import axios from 'axios';
import { toast } from 'sonner';

function mergeCarts(cartA, cartB) {
    // Merge two cart objects, summing quantities for same item/size
    const merged = { ...cartA };
    for (const itemId in cartB) {
        if (!merged[itemId]) merged[itemId] = {};
        for (const size in cartB[itemId]) {
            if (merged[itemId][size]) {
                merged[itemId][size] += cartB[itemId][size];
            } else {
                merged[itemId][size] = cartB[itemId][size];
            }
        }
    }
    return merged;
}

// Utility to merge two wishlists (array of product IDs)
function mergeWishlists(wishlistA, wishlistB) {
    const set = new Set([...(wishlistA || []), ...(wishlistB || [])]);
    return Array.from(set);
}

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
    const [wishlist, setWishlist] = useState([]);

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
        toast.success('Product added to cart');
        if(token){
            try {
                await axios.post(backendURL + '/api/cart/add',{itemId,size},{headers:{token}});
            } catch (error) {
                toast.error(error.message);
            }
        }
    }
    
    // Remove from cart function
    const removeFromCart = async (itemId, size) => {
        let cartData = structuredClone(cartItems);
        if(cartData[itemId] && cartData[itemId][size]) {
            delete cartData[itemId][size];
            if(Object.keys(cartData[itemId]).length === 0) {
                delete cartData[itemId];
            }
            setCartItems(cartData);
            toast.info('Product removed from cart');
            if(token){
                try {
                    await axios.post(backendURL + '/api/cart/remove', { itemId, size }, { headers: { token } });
                } catch (error) {
                    toast.error(error.message);
                }
            }
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
    // Get total wishlist count
const getWishlistCount = () => {
    return wishlist ? wishlist.length : 0;
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

    // Fetch wishlist from backend or localStorage for guests
    const fetchWishlist = async (token) => {
        if (!token) {
            // Guest: load from localStorage
            const guestWishlist = localStorage.getItem('guest_wishlist');
            setWishlist(guestWishlist ? JSON.parse(guestWishlist) : []);
            return;
        }
        try {
            const response = await axios.get(backendURL + '/api/user/wishlist', { headers: { token } });
            if (response.data.success) {
                setWishlist(response.data.wishlist || []);
            } else {
                setWishlist([]);
            }
        } catch (error) {
            setWishlist([]);
        }
    };

    // Add product to wishlist (supports guest and logged-in)
    const addToWishlist = async (productId) => {
        if (!token) {
            // Guest: update localStorage
            let guestWishlist = localStorage.getItem('guest_wishlist');
            guestWishlist = guestWishlist ? JSON.parse(guestWishlist) : [];
            if (!guestWishlist.includes(productId)) {
                const updated = [...guestWishlist, productId];
                localStorage.setItem('guest_wishlist', JSON.stringify(updated));
                setWishlist(updated);
                toast.success('Added to wishlist');
            } else {
                toast.info('Already in wishlist');
            }
            return;
        }
        try {
            const response = await axios.post(backendURL + `/api/user/wishlist/${productId}`, {}, { headers: { token } });
            if (response.data.success) {
                toast.success('Added to wishlist');
                fetchWishlist(token);
            } else {
                toast.error(response.data.message || 'Failed to add to wishlist');
            }
        } catch (error) {
            toast.error('Failed to add to wishlist');
        }
    };
    // Remove product from wishlist (supports guest and logged-in)
    const removeFromWishlist = async (productId) => {
        if (!token) {
            // Guest: update localStorage
            let guestWishlist = localStorage.getItem('guest_wishlist');
            guestWishlist = guestWishlist ? JSON.parse(guestWishlist) : [];
            if (guestWishlist.includes(productId)) {
                const updated = guestWishlist.filter(id => id !== productId);
                localStorage.setItem('guest_wishlist', JSON.stringify(updated));
                setWishlist(updated);
                toast.info('Removed from wishlist');
            } else {
                toast.info('Not in wishlist');
            }
            return;
        }
        try {
            const response = await axios.delete(backendURL + `/api/user/wishlist/${productId}`, { headers: { token } });
            if (response.data.success) {
                toast.info('Removed from wishlist');
                fetchWishlist(token);
            } else {
                toast.error(response.data.message || 'Failed to remove from wishlist');
            }
        } catch (error) {
            toast.error('Failed to remove from wishlist');
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
            fetchWishlist(token);
        } else {
            setCartItems({});
            setProfileData(null);
            setWishlist([]);
        }
    }, [token]);

    // On mount, load guest cart and guest wishlist if not logged in
    useEffect(() => {
        if (!token) {
            const guestCart = localStorage.getItem('guest_cart');
            if (guestCart) {
                setCartItems(JSON.parse(guestCart));
            }
            const guestWishlist = localStorage.getItem('guest_wishlist');
            setWishlist(guestWishlist ? JSON.parse(guestWishlist) : []);
        }
    }, [token]);

    // Persist guest cart and wishlist to localStorage when not logged in
    useEffect(() => {
        if (!token) {
            localStorage.setItem('guest_cart', JSON.stringify(cartItems));
            localStorage.setItem('guest_wishlist', JSON.stringify(wishlist));
        }
    }, [cartItems, wishlist, token]);

    // On login, merge guest cart and guest wishlist with backend, update backend, and clear guest data
    useEffect(() => {
        const mergeAndSyncCartAndWishlist = async () => {
            const guestCart = localStorage.getItem('guest_cart');
            const guestWishlist = localStorage.getItem('guest_wishlist');
            if (token) {
                // --- Cart merge (existing logic) ---
                if (guestCart) {
                    try {
                        const response = await axios.post(backendURL + '/api/cart/get', {}, { headers: { token } });
                        let backendCart = response.data.success ? response.data.cartData : {};
                        const mergedCart = mergeCarts(backendCart, JSON.parse(guestCart));
                        for (const itemId in mergedCart) {
                            for (const size in mergedCart[itemId]) {
                                await axios.post(backendURL + '/api/cart/update', { itemId, size, quantity: mergedCart[itemId][size] }, { headers: { token } });
                            }
                        }
                        setCartItems(mergedCart);
                        localStorage.removeItem('guest_cart');
                    } catch (error) {
                        toast.error('Failed to merge guest cart');
                    }
                }
                // --- Wishlist merge ---
                if (guestWishlist) {
                    try {
                        // Fetch backend wishlist
                        const response = await axios.get(backendURL + '/api/user/wishlist', { headers: { token } });
                        let backendWishlist = response.data.success ? response.data.wishlist || [] : [];
                        const guestWishlistArr = JSON.parse(guestWishlist);
                        // Merge (by productId)
                        const mergedWishlist = mergeWishlists(backendWishlist.map(p => p._id || p), guestWishlistArr);
                        // Add missing items to backend
                        for (const productId of mergedWishlist) {
                            if (!backendWishlist.some(p => (p._id || p) === productId)) {
                                await axios.post(backendURL + `/api/user/wishlist/${productId}`, {}, { headers: { token } });
                            }
                        }
                        fetchWishlist(token);
                        localStorage.removeItem('guest_wishlist');
                    } catch (error) {
                        toast.error('Failed to merge guest wishlist');
                    }
                }
            }
        };
        mergeAndSyncCartAndWishlist();
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
        wishlist,
        fetchWishlist,
        addToWishlist,
        removeFromWishlist,
        getWishlistCount,
    }
    
    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    );
};

export default ShopContextProvider;