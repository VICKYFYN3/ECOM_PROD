import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';

const ProductItem = ({ id, image, name, price, stockQuantity, currency = "₦" }) => {
    const { wishlist, addToWishlist, removeFromWishlist, token } = useContext(ShopContext);
    const isInWishlist = wishlist && wishlist.some(item => (item._id || item.id) === id);

    const handleWishlistClick = (e) => {
        e.preventDefault(); // Prevent Link navigation
        if (!token) {
            addToWishlist(id); // Will show login toast
            return;
        }
        if (isInWishlist) {
            removeFromWishlist(id);
        } else {
            addToWishlist(id);
        }
    };

    return (
        <Link to={`/product/${id}`} className='group block relative'>
            {stockQuantity === 0 && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                    Out of Stock
                </div>
            )}
            {stockQuantity > 0 && stockQuantity < 10 && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                    Only {stockQuantity} left
                </div>
            )}
            <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-gray-200'>
                {/* Image Container with proper aspect ratio */}
                <div className='relative aspect-square overflow-hidden bg-gray-50'>
                    <img
                        src={image[0]}
                        alt={name}
                        className='w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105'
                    />
                    {/* Overlay gradient on hover */}
                    <div className='absolute inset-0 bg-gradient-to-t from-black/0 via-transparent to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300'></div>
                </div>

                {/* Content Section */}
                <div className='p-4 space-y-2'>
                    {/* Product Name */}
                    <h3 className='font-semibold text-gray-900 text-base leading-tight line-clamp-2 group-hover:text-gray-700 transition-colors duration-200'>
                        {name}
                    </h3>

                    {/* Price */}
                    <div className='flex items-center justify-between'>
                        <p className='text-lg font-bold text-gray-900'>
                            <span className='text-sm font-medium text-gray-500'>{currency}</span>
                            {Number(price).toLocaleString()}
                        </p>
                        {/* Wishlist Button */}
                        <button
                            className='ml-2 p-1 rounded-full hover:bg-pink-100 transition-colors'
                            onClick={handleWishlistClick}
                            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                        >
                            {isInWishlist ? (
                                // Filled heart
                                <svg className='w-6 h-6 text-pink-500' fill='currentColor' viewBox='0 0 20 20'>
                                    <path d='M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z' />
                                </svg>
                            ) : (
                                // Outline heart
                                <svg className='w-6 h-6 text-gray-400 hover:text-pink-500' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' d='M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z' />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ProductItem;