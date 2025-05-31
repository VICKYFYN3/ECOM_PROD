import React from 'react';
import { Link } from 'react-router-dom';

const ProductItem = ({ id, image, name, price, currency = "₦" }) => {
    return (
        <Link to={`/product/${id}`} className='group block'>
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
                            {price}
                        </p>
                        
                        {/* Optional: Add to cart icon or wishlist */}
                        <div className='opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                            <div className='w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors'>
                                <svg className='w-4 h-4 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v6m0 0v6m0-6h6m-6 0H6' />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ProductItem;