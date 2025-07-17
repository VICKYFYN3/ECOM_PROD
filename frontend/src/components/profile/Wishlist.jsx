import React, { useContext } from 'react';
import { ShopContext } from '../../context/ShopContext';

const Wishlist = () => {
    const { wishlist, removeFromWishlist, addToCart, currency } = useContext(ShopContext);

    if (!wishlist || wishlist.length === 0) {
        return (
            <div className="text-center py-16 text-gray-500">
                <svg className="mx-auto mb-4 w-12 h-12 text-pink-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                </svg>
                <p>Your wishlist is empty.</p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-xl font-semibold mb-6">My Wishlist</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {wishlist.map(product => (
                    <div key={product._id} className="bg-white rounded-lg shadow p-4 flex flex-col">
                        <div className="relative aspect-square mb-3">
                            <img src={product.image[0]} alt={product.name} className="w-full h-full object-cover rounded-md" />
                            <button
                                className="absolute top-2 right-2 p-1 rounded-full bg-white hover:bg-pink-100 shadow"
                                onClick={() => removeFromWishlist(product._id)}
                                aria-label="Remove from wishlist"
                            >
                                <svg className="w-6 h-6 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900 text-base mb-1 line-clamp-2">{product.name}</h3>
                                <p className="text-lg font-bold text-gray-900 mb-2">
                                    <span className="text-sm font-medium text-gray-500">{currency}</span>
                                    {Number(product.price).toLocaleString()}
                                </p>
                            </div>
                            <button
                                className="mt-2 w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 rounded-md transition-colors"
                                onClick={() => addToCart(product._id, product.sizes && product.sizes[0])}
                                disabled={product.stockQuantity === 0}
                            >
                                {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Wishlist; 