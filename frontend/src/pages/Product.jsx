import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import RelatedProducts from '../components/RelatedProducts';
import { toast } from 'sonner';

const Product = () => {
  const { productId } = useParams();
  const { products, currency, addToCart } = useContext(ShopContext);
  const [productData, setProductData] = useState(null);
  const [image, setImage] = useState('');
  const [size, setSize] = useState('');

  useEffect(() => {
    const product = products.find(item => item._id === productId);
    if (product) {
      setProductData(product);
      setImage(product.image?.length > 0 ? product.image[0] : '');
    } else {
      console.warn("Product not found with ID:", productId);
    }
  }, [productId, products]);

  const handleAddToCart = () => {
    if (!size) {
      toast.warning('Please select a size');
      return;
    }

    // Check size-specific stock - sizeStock is now a plain object, not a Map
    const sizeStock = productData.sizeStock?.[size] || 0;
    if (sizeStock <= 0) {
      toast.error('This product is out of stock in the selected size');
      return;
    }

    addToCart(productData._id, size);
    toast.success(`${productData.name} (Size: ${size}) added to cart!`);
  };

  // Calculate star display
  const averageRating = productData?.averageRating || 0;
  const fullStars = Math.floor(averageRating);
  const hasHalfStar = averageRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  const ratingCount = productData?.ratingCount || 0;

  // Check if all sizes are out of stock
  const allSizesOutOfStock = productData?.sizes?.every(sizeItem => {
    const sizeStock = productData.sizeStock?.[sizeItem] || 0;
    return sizeStock <= 0;
  }) || productData?.stockQuantity <= 0;

  if (!productData) {
    return <div className="text-center text-gray-500 py-10">Loading product...</div>;
  }

  return (
    <div className='border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100'>
      {/* Product Data */}
      <div className='flex gap-12 sm:gap-12 flex-col sm:flex-row'>
        {/* Product Image */}
        <div className='flex-1 flex flex-col-reverse gap-3 sm:flex-row'>
          <div className='flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full'>
            {productData.image?.length > 0 ? (
              productData.image.map((item, index) => (
                <img
                  onClick={() => setImage(item)}
                  src={item}
                  key={index}
                  className='w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer'
                  alt="Product"
                />
              ))
            ) : (
              <p className="text-gray-400">No images available</p>
            )}
          </div>
          <div className='w-full sm:w-[80%]'>
            {image ? (
              <img className='w-full h-auto' src={image} alt="Product" />
            ) : (
              <p className="text-center text-gray-400">No image selected</p>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className='flex-1'>
          <h1 className='font-medium text-2xl mt-2'>{productData.name}</h1>
          <div className='flex items-center gap-1 mt-2'>
            {[...Array(fullStars)].map((_, index) => (
              <img key={`full-${index}`} src={assets.star_icon} alt="Star" className="w-4" />
            ))}
            {hasHalfStar && (
              <img key="half" src={assets.star_half_icon} alt="Half Star" className="w-4" />
            )}
            {[...Array(emptyStars)].map((_, index) => (
              <img key={`empty-${index}`} src={assets.star_dull_icon} alt="Empty Star" className="w-4" />
            ))}
            <p className='pl-2 text-sm text-gray-600'>({ratingCount} reviews)</p>
          </div>
          <p className='mt-5 text-3xl font-medium'>{currency}{productData.price}</p>
          <p className='mt-5 text-gray-500 md:w-4/5'>{productData.description}</p>
          <div className='flex flex-col gap-4 my-8'>
            <p>Select Size</p>
            <div className='flex gap-2'>
              {productData.sizes?.length > 0 ? (
                productData.sizes.map((item, index) => {
                  // Get stock for this specific size - sizeStock is now a plain object
                  const sizeStock = productData.sizeStock?.[item] || 0;
                  const isOutOfStock = sizeStock <= 0;
                  const isSelected = item === size;
                  
                  return (
                    <button
                      onClick={() => !isOutOfStock && setSize(item)}
                      key={index}
                      className={`border py-2 px-4 transition-all duration-200 ${
                        isOutOfStock 
                          ? 'opacity-30 cursor-not-allowed bg-gray-200 text-gray-400 border-gray-300' 
                          : isSelected
                            ? 'border-green-500 bg-green-50 text-green-700 cursor-pointer'
                            : 'bg-gray-100 hover:bg-gray-200 cursor-pointer border-gray-300'
                      }`}
                      disabled={isOutOfStock}
                      title={isOutOfStock ? `Size ${item} is out of stock` : `Size ${item} - ${sizeStock} in stock`}
                    >
                      {item}
                    </button>
                  );
                })
              ) : (
                <p className="text-gray-400">No sizes available</p>
              )}
            </div>
          </div>
          <button
            onClick={handleAddToCart}
            className={`px-8 py-3 text-sm transition-all duration-200 ${
              allSizesOutOfStock
                ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                : 'bg-black text-white hover:bg-gray-800 cursor-pointer'
            }`}
            disabled={allSizesOutOfStock}
          >
            {allSizesOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}
          </button>
          <hr className='mt-8 sm:w-4/5' />
          <div className='text-sm text-gray-500 mt-5 flex flex-col gap-1'>
            <p>100% Original Product</p>
            <p>Cash On Delivery</p>
            <p>Easy Return And Exchange Policy within 7 days.</p>
          </div>
        </div>
      </div>

      {/* Description and Ratings section */}
      <div className='mt-20'>
        <div className='flex'>
          <b className='border px-5 py-3 text-sm'>Description</b>
          <p className='border px-5 py-3 text-sm'>Ratings ({ratingCount})</p>
        </div>
        <div className='flex flex-col gap-4 border px-6 py-6 text-sm text-gray-500'>
          <p>{productData.description}</p>
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Debitis enim a quibusdam voluptate perferendis itaque sequi mollitia eveniet odio tempora, facilis facere minima soluta expedita ad quis. Non, eos? Sequi?</p>
        </div>
      </div>

      {/* Display related products */}
      <RelatedProducts
        category={productData.category}
        subCategory={productData.subCategory}
      />
    </div>
  );
};

export default Product;