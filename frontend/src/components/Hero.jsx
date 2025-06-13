import React from 'react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
    const navigate = useNavigate();
    
    const handleNavigateToCollection = () => {
        navigate('/collection');
    };

    return (
        <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row border min-h-[450px] border-gray-400">
                {/* HERO LEFT SIDE */}
                <div className="w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0 bg-gradient-to-br from-white to-gray-100">
                    <div className="text-[#414141] max-w-md px-8">
                        {/* Decorative line */}
                        <div className="h-px bg-gray-800 mb-6 w-full"></div>
                        
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-px bg-[#414141]"></div>
                            <p className="font-medium text-sm md:text-base tracking-widest text-gray-700">OUR BESTSELLER</p>
                        </div>
                        
                        <h1 className="prata-regular text-4xl sm:text-5xl lg:text-6xl leading-tight text-gray-900 mb-8">
                            Latest <span className="relative">
                                Arrivals
                                <span className="absolute -bottom-2 left-0 w-full h-1 bg-amber-400"></span>
                            </span>
                        </h1>
                        
                        <div className="group relative inline-block cursor-pointer" onClick={handleNavigateToCollection}>
                            <div className="flex items-center gap-3 mb-2">
                                <p className="font-semibold text-sm md:text-base tracking-wider text-gray-800 group-hover:text-amber-600 transition-colors duration-300">SHOP NOW</p>
                                <div className="w-8 md:w-11 h-[2px] bg-[#414141] group-hover:w-12 group-hover:bg-amber-600 transition-all duration-300"></div>
                            </div>
                            <div className="h-0.5 w-0 bg-amber-500 group-hover:w-full transition-all duration-500"></div>
                        </div>
                    </div>
                </div>

                {/* HERO RIGHT SIDE */}
                <div className="w-full sm:w-1/2 relative overflow-hidden min-h-[450px] sm:min-h-full">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10"></div>
                    
                    <img 
                        className="w-full h-full min-h-[450px] sm:min-h-full object-cover object-center" 
                        src="https://res.cloudinary.com/duvxwhiho/image/upload/v1749837940/hero_img_1_mtcf66.png"
                        alt="Latest arrivals hero image" 
                    />
                    
                    {/* Floating call-to-action button */}
                    <div className="absolute bottom-8 left-8 z-20">
                        <div className="flex items-center gap-3" onClick={handleNavigateToCollection}>
                            <div className="w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center group cursor-pointer hover:bg-white transition-colors duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800 group-hover:text-amber-500 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </div>
                            <p className="text-white font-medium">DISCOVER COLLECTION</p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Decorative floating elements */}
            <div className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full border border-amber-300 opacity-30 pointer-events-none"></div>
            <div className="absolute bottom-1/3 left-1/4 w-16 h-16 rounded-full border border-gray-400 opacity-20 pointer-events-none"></div>
        </div>
    );
};

export default Hero;