import React from 'react'
import Title from '../components/Title'
import NewsLetterBox from '../components/NewsLetterBox'
const Contact = () => {
  return (
    <div>
      <div className='text-center text-2xl pt-10 border-t'> 
        <Title text1={'CONTACT'} text2={'US'}/>
      </div>
      <div className='flex flex-col justify-center my-10 md:flex-row gap-10 mb-28'>
        <img className='w-full md:max-w-[480px]' src="https://res.cloudinary.com/duvxwhiho/image/upload/v1749836333/contact_img_bh6ahi.png"alt="" />
        <div className='flex flex-col justify-center items-start gap-6'>
          <p className='font-semibold text-xl text-gray-600'>Our Store</p>
          <p className='text-gray-500'>54709 abuja estate<br />Isolo lagos State , maritime road</p>
          <p className='text-gray-500'>Tel: (+234) 816-694-8210 <br /> Email: vfokezie@gmail.com</p>
          <p className='font-semibold text-xl text-gray-600'>Careers at Forever</p>
          <p className='text-gray-500'>Learn more about our teams and job openings</p>
          <button className='border border-black px-8 py-4 text-sm hover:bg-black hover:text-white transition-all duration-500'>Explore Jobs</button>
        </div>
      </div>
      <NewsLetterBox/>
    </div>
  )
}

export default Contact