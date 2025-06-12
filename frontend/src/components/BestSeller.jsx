import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title'
import ProductItem from './ProductItem';

const BestSeller = () => {

    const { products } = useContext(ShopContext);
    const [bestSeller, setBestSeller] = useState([]);

    useEffect(() => {
        const bestProduct = products.filter((item)=>(item.bestseller));
        setBestSeller(bestProduct.slice(0,5))
    }, [products])

    return (
        <div className='my-16 px-4 sm:px-6 lg:px-8'>
            {/* Header Section with Enhanced Styling */}
            <div className='text-center mb-12'>
                <div className='relative inline-block'>
                    <Title text1={'BEST'} text2={'SELLER'} />
                    {/* Decorative elements */}
                    <div className='absolute -top-2 -left-4 w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-sm opacity-70'></div>
                    <div className='absolute -bottom-2 -right-4 w-6 h-6 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-sm opacity-70'></div>
                </div>
                
                {/* Enhanced description with gradient background */}
                <div className='relative mt-8 max-w-2xl mx-auto'>
                    <div className='absolute inset-0 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl transform rotate-1'></div>
                    <div className='relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
                        <p className='text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed'>
                            Discover our most coveted pieces, handpicked by our community of style enthusiasts. 
                            These trending favorites combine quality craftsmanship with contemporary design.
                        </p>
                        {/* Floating badge */}
                        <div className='absolute -top-3 -right-3 bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform rotate-12'>
                            🔥 TRENDING
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Grid with Enhanced Layout */}
            <div className='relative'>
                {/* Background decoration */}
                <div className='absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 rounded-3xl'></div>
                
                {/* Products container */}
                <div className='relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 lg:gap-8'>
                        {bestSeller.map((item, index) => (
                            <div 
                                key={index} 
                                className='group transform transition-all duration-500 hover:scale-105 hover:-translate-y-2'
                                style={{
                                    animationDelay: `${index * 100}ms`
                                }}
                            >
                                <div className='relative overflow-hidden rounded-2xl shadow-md group-hover:shadow-2xl transition-all duration-500'>
                                    {/* Bestseller badge */}
                                    <div className='absolute top-3 left-3 z-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg'>
                                        #{index + 1}
                                    </div>
                                    
                                    {/* Glow effect on hover */}
                                    <div className='absolute inset-0 bg-gradient-to-r from-purple-400/0 via-pink-400/0 to-blue-400/0 group-hover:from-purple-400/10 group-hover:via-pink-400/10 group-hover:to-blue-400/10 transition-all duration-500 rounded-2xl'></div>
                                    
                                    <ProductItem 
                                        id={item._id} 
                                        name={item.name} 
                                        image={item.image}  
                                        price={item.price}
                                        stockQuantity={item.stockQuantity}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Bottom decorative element */}
                    <div className='flex justify-center mt-8'>
                        <div className='h-1 w-24 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 rounded-full'></div>
                    </div>
                </div>
                
                {/* Floating elements */}
                <div className='absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-xl opacity-30 animate-pulse'></div>
                <div className='absolute -bottom-6 -right-6 w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-xl opacity-30 animate-pulse' style={{animationDelay: '1s'}}></div>
            </div>
        </div>
    )
}

export default BestSeller