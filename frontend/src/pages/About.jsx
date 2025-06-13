import React from 'react'
import Title from '../components/Title'
import NewsLetterBox from '../components/NewsLetterBox'
const About = () => {
  return (
    <div>
      <div className='text-2xl text-center pt-8 border-t'>
        <Title text1={'ABOUT'} text2={'US'} />
      </div>
      <div className='my-10 flex flex-col md:flex-row gap-16'>
        <img className='w-full md:max-w-[450px]' src="https://res.cloudinary.com/duvxwhiho/image/upload/v1749836333/about_img_rhpm8a.png" alt="" />
        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-gray-600'>
          <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Excepturi ratione provident omnis tenetur, eaque harum voluptatem impedit! Ut fugiat alias ipsam ipsa quae quibusdam consectetur soluta beatae. Quae, porro voluptate.</p>
          <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Excepturi ratione provident omnis tenetur, eaque harum voluptatem impedit! Ut fugiat alias ipsam ipsa quae quibusdam consectetur soluta beatae. Quae, porro voluptate.</p>
          <b className='text-gray-800'>Our Mission</b>
          <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Excepturi ratione provident omnis tenetur, eaque harum voluptatem impedit! Ut fugiat alias ipsam ipsa quae quibusdam consectetur soluta beatae. Quae, porro voluptate.</p>
        </div>
      </div>
      <div className='text-2xl py-4'>
        <Title text1={'WHY'} text2={'CHOOSE US'} />
      </div>
      <div className='flex flex-col md:flex-row text-sm mb-20'>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>Quality Assurance:</b>
          <p className='text-gray-600'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Atque iusto eaque nostrum, consectetur et, ad autem explicabo numquam fugiat vero laboriosam soluta tenetur ducimus id quam temporibus, voluptatum ut saepe?</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>Convenience:</b>
          <p className='text-gray-600'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Atque iusto eaque nostrum, consectetur et, ad autem explicabo numquam fugiat vero laboriosam soluta tenetur ducimus id quam temporibus, voluptatum ut saepe?</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>Exceptional Customer Service:</b>
          <p className='text-gray-600'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Atque iusto eaque nostrum, consectetur et, ad autem explicabo numquam fugiat vero laboriosam soluta tenetur ducimus id quam temporibus, voluptatum ut saepe?</p>
        </div>
      </div>
      <NewsLetterBox />
    </div>
    
  )
}

export default About