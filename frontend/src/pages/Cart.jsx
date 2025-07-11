import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus } from 'lucide-react';
import CartTotal from '../components/CartTotal'; // Import the new component

const Cart = () => {
  const { products, currency, cartItems, removeFromCart, updateCartItemQuantity } = useContext(ShopContext);
  const [cartData, setCartData] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {

    if(products.length > 0){
    const tempData = [];
    for (const itemId in cartItems) {
      for (const size in cartItems[itemId]) {
        if (cartItems[itemId][size] > 0) {
          tempData.push({
            _id: itemId,
            size: size,
            quantity: cartItems[itemId][size]
          })
        }
      }
    }
    setCartData(tempData);
    }
  }, [cartItems,products]);

  useEffect(() => {
    let total = 0;
    cartData.forEach(item => {
      const productData = products.find(product => product._id === item._id);
      if (productData) {
        total += productData.price * item.quantity;
      }
    });
    setSubtotal(total);
  }, [cartData, products]);

  const handleQuantityChange = (itemId, size, newQuantity) => {
    if (newQuantity >= 1) {
      updateCartItemQuantity(itemId, size, newQuantity);
    }
  };

  const handleRemoveItem = (itemId, size) => {
    removeFromCart(itemId, size);
  };

  const navigateToProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Title text1={'YOUR'} text2={'CART'} />
      </div>

      {cartData.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl text-gray-500">Your cart is empty</p>
          <Link to="/collection">
            <button className="mt-4 bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition cursor-pointer">
              Continue Shopping
            </button>
          </Link>
        </div>
      ) : (
        <>
          <div className="hidden md:grid grid-cols-[3fr_1fr_1fr_1fr] gap-4 py-3 border-b border-gray-200 font-medium text-gray-500">
            <div>Product</div>
            <div className="text-center">Size</div>
            <div className="text-center">Quantity</div>
            <div className="text-right">Price</div>
          </div>

          <div className="divide-y divide-gray-100">
            {cartData.map((item, index) => {
              const productData = products.find(product => product._id === item._id);
              return (
                <div key={index} className="py-6 flex flex-col md:grid md:grid-cols-[3fr_1fr_1fr_1fr] gap-4 items-center">
                  {/* Product Info */}
                  <div className="flex items-center gap-4 w-full">
                    <div
                      className="w-20 h-20 md:w-24 md:h-24 bg-gray-50 rounded flex items-center justify-center overflow-hidden cursor-pointer"
                      onClick={() => navigateToProduct(item._id)}
                    >
                      <img
                        className="w-full h-full object-cover"
                        src={productData?.image[0]}
                        alt={productData?.name}
                      />
                    </div>
                    <div className="flex-1">
                      <p
                        className="font-medium cursor-pointer hover:text-gray-700"
                        onClick={() => navigateToProduct(item._id)}
                      >
                        {productData?.name}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{productData?.category}</p>
                      <button
                        className="text-red-500 flex items-center gap-1 mt-2 text-sm md:hidden cursor-pointer"
                        onClick={() => handleRemoveItem(item._id, item.size)}
                      >
                        <Trash2 size={14} className="cursor-pointer" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>

                  {/* Size */}
                  <div className="flex justify-between md:justify-center items-center w-full md:w-auto">
                    <span className="md:hidden text-gray-500">Size:</span>
                    <span className="px-3 py-1 border rounded bg-gray-50">{item.size}</span>
                  </div>

                  {/* Quantity */}
                  <div className="flex justify-between md:justify-center items-center w-full md:w-auto">
                    <span className="md:hidden text-gray-500">Quantity:</span>
                    <div className="flex items-center border rounded">
                      <button
                        className="px-2 py-1 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleQuantityChange(item._id, item.size, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={16} className="cursor-pointer" />
                      </button>
                      <input
                        type="text"
                        className="w-10 text-center border-x py-1"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) {
                            handleQuantityChange(item._id, item.size, val);
                          }
                        }}
                      />
                      <button
                        className="px-2 py-1 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleQuantityChange(item._id, item.size, item.quantity + 1)}
                      >
                        <Plus size={16} className="cursor-pointer" />
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex justify-between md:justify-end items-center w-full md:w-auto">
                    <span className="md:hidden text-gray-500">Price:</span>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">
                        {currency}{(productData?.price * item.quantity).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                      <button
                        className="text-gray-400 hover:text-red-500 hidden md:block cursor-pointer"
                        onClick={() => handleRemoveItem(item._id, item.size)}
                      >
                        <Trash2 size={18} className="cursor-pointer" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="flex flex-col md:flex-row md:justify-between gap-6">
              <div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Coupon code"
                    className="w-full md:w-64 px-4 py-2 border rounded"
                  />
                  <button className="absolute right-0 top-0 h-full px-4 text-gray-500 hover:text-gray-700 cursor-pointer">
                    Apply
                  </button>
                </div>
                <Link to="/collection">
                  <button className="cursor-pointer mt-4 text-gray-700 hover:text-gray-900 flex items-center gap-2">
                    <span>← Continue Shopping</span>
                  </button>
                </Link>
              </div>
              
              {/* Replace the original order summary with CartTotal component */}
              <CartTotal 
                subtotal={subtotal} 
                currency={currency}
                showShippingFee={false}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;