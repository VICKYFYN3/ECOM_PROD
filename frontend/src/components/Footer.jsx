import React from 'react'
import { assets } from '../assets/assets'
import { NavLink } from 'react-router-dom'

const Footer = () => {
    return (
        <div>
            <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>
                <div>
                    <img className='mb-5 w-32' src={assets.logo} alt="" />
                    <p className='w-full md:w-2/3 text-gray-600'>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. At quaerat aut placeat eligendi libero velit quasi similique asperiores assumenda suscipit sint ipsa dolorum cupiditate obcaecati aliquid repudiandae expedita, optio accusantium.
                    </p>
                </div>
                <div>
                    <p className='text-xl font-medium mb-5'>COMPANY</p>
                    <ul className='flex flex-col gap-1 text-gray-600'>
                        <NavLink to = '/'>
                            <p>HOME</p>
                        </NavLink>
                        <NavLink to = '/about' >
                            <p>ABOUT</p>
                        </NavLink>
                        <li>Delivery</li>
                        <li>Privacy policy</li>
                    </ul>
                </div>
                <div>
                    <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
                    <ul className='flex flex-col gap-1 text-gray-600'>
                        <li>+234 816-694-8210</li>
                        <li>vfokezie@gmail.com</li>
                    </ul>
                </div>
            </div>
            <div>
                <hr />
                <p className='py-5 text-sm text-center'>Copyright 2024@ AgroLink.com - All Right Reserved. <span className='text-gray-400'>By-VickyFyn3</span></p>
            </div>
        </div>
    )
}

export default Footer