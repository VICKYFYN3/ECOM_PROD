import React from 'react';
import { assets } from '../assets/assets';

const Hero = () => {
    return (
        <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row border border-gray-400">
                {/* HERO LEFT SIDE */}
                <div className="w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0">
                    <div className="text-[#414141]">
                        <div className="flex items-center gap-2">
                            <div className="w-8 md:w-11 h-[2px] bg-[#414141]"></div>
                            <p className="font-medium text-sm md:text-base">OUR BESTSELLER</p>
                        </div>
                        <h1 className="prata-regular text-3xl sm:py-3 lg:text-5xl leading-relaxed">Latest Arrivals</h1>
                        <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm md:text-base">SHOP NOW</p>
                            <div className="w-8 md:w-11 h-[2px] bg-[#414141]"></div>
                        </div>
                    </div>
                </div>

                {/* HERO RIGHT SIDE */}
                <div className="w-full sm:w-1/2">
                    <img className="w-full h-full object-cover" src={assets.hero_img} alt="Latest arrivals hero image" />
                </div>
            </div>
        </div>
    );
};

export default Hero;