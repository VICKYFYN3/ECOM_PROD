import React from 'react'
import { NavLink } from 'react-router-dom';
import { assets } from '../assets/assets';

const Sidebar = () => {
    return (
        <div className='w-[18%] min-h-screen border-r-2'>
            <div className='flex flex-col gap-4 pt-6 pl-[20%] text-[15px] '>
                <NavLink className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l' to="/add">
                    <img className='w-5 h-5' src={assets.add_icon} alt="" />
                    <p className='hidden md:block'>Add Items</p>
                </NavLink>
                <NavLink className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l' to="/list">
                    <img className='w-5 h-5' src={assets.order_icon} alt="" />
                    <p className='hidden md:block'>List Items</p>
                </NavLink>
                <NavLink className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l' to="/orders">
                    <img className='w-5 h-5' src={assets.order_icon} alt="" />
                    <p className='hidden md:block'>Orders</p>
                </NavLink>
                <NavLink className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l' to="/compose">
                    <img className='w-5 h-5' src={assets.add_icon} alt="" />
                    <p className='hidden md:block'>Compose</p>
                </NavLink>
                <NavLink className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l' to="/contact-messages">
                    <svg className='w-5 h-5' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className='hidden md:block'>Contact Messages</p>
                </NavLink>
            </div>
        </div>
    )
}

export default Sidebar