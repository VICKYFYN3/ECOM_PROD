import React from 'react';
import { useNavigate } from 'react-router-dom';

const CartTotal = ({
    subtotal, 
    currency = '₦',
    showCheckoutButton = true,
    checkoutPath = '/place-order',
    buttonText = 'Proceed to Checkout',
    shippingFee = null,
    showShippingFee = false,
    forceZeroTotal = false
}) => {
    const navigate = useNavigate();

    // Calculate the actual shipping fee
    const actualShippingFee = showShippingFee && shippingFee !== null ? shippingFee : 0;

    // Calculate the final total
    const total = forceZeroTotal ? 0 : (subtotal + actualShippingFee);

    return (
        <div className="bg-gray-50 p-6 rounded w-full md:w-80">
            <h3 className="font-medium mb-4">Order Summary</h3>
            <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span>{currency}{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
                <span className="text-gray-600">Shipping Fee</span>
                {showShippingFee && shippingFee !== null ? (
                    <span>{currency}{shippingFee.toFixed(2)}</span>
                ) : (
                    <span>Calculated at checkout</span>
                )}
            </div>
            <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between font-medium">
                <span>Total</span>
                <span>{currency}{total.toFixed(2)}</span>
            </div>
            {showCheckoutButton && (
                <button
                    onClick={() => navigate(checkoutPath)}
                    className="mt-4 bg-black text-white w-full py-3 rounded hover:bg-gray-800 transition cursor-pointer"
                >
                    {buttonText}
                </button>
            )}
        </div>
    );
};

export default CartTotal;