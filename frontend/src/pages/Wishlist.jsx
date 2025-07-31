import React, { useContext, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';

const Wishlist = () => {
    const { wishlist, removeFromWishlist, addToCart, currency, products } = useContext(ShopContext);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedSize, setSelectedSize] = useState('');
    const [showSizeModal, setShowSizeModal] = useState(false);

    const getProductData = (productId) => {
        return products.find(product => product._id === productId);
    };

    const handleAddToCartClick = (product) => {
        setSelectedProduct(product);
        if (product.sizes && product.sizes.length > 0) {
            setShowSizeModal(true);
        } else {
            addToCart(product._id);
        }
    };

    const handleConfirmAddToCart = () => {
        if (selectedProduct) {
            addToCart(selectedProduct._id, selectedSize || selectedProduct.sizes?.[0]);
            setShowSizeModal(false);
            setSelectedSize('');
        }
    };

    if (!wishlist || wishlist.length === 0) {
        return (
            <div className="text-center py-16 text-gray-500">
                <svg className="mx-auto mb-4 w-12 h-12 text-pink-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                </svg>
                <p>Your wishlist is empty.</p>
            </div>
        );
    }

    return (
        <div>
            <Title text1={'YOUR'} text2={'WISHLIST'} />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {wishlist.map(item => {
                    const product = typeof item === 'string' ? getProductData(item) : item;
                    if (!product) return null;

                    // Check if all sizes are out of stock
                    const allSizesOutOfStock = product.sizes?.every(sizeItem => {
                        const sizeStock = product.sizeStock?.[sizeItem] || 0;
                        return sizeStock <= 0;
                    }) || product.stockQuantity <= 0;

                    return (
                        <div key={product._id} className="bg-white rounded-lg shadow p-4 flex flex-col">
                            <div className="relative aspect-square mb-3">
                                {product.image?.[0] && (
                                    <img 
                                        src={product.image[0]} 
                                        alt={product.name} 
                                        className="w-full h-full object-cover rounded-md" 
                                    />
                                )}
                                <button
                                    className="absolute top-2 right-2 p-1 rounded-full bg-white hover:bg-pink-100 shadow"
                                    onClick={() => removeFromWishlist(product._id)}
                                >
                                    <svg className="w-6 h-6 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-base mb-1 line-clamp-2">{product.name}</h3>
                                    <p className="text-lg font-bold text-gray-900 mb-2">
                                        <span className="text-sm font-medium text-gray-500">{currency}</span>
                                        {Number(product.price).toLocaleString()}
                                    </p>
                                </div>
                                <button
                                    className="mt-2 w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 rounded-md transition-colors"
                                    onClick={() => handleAddToCartClick(product)}
                                    disabled={allSizesOutOfStock}
                                >
                                    {allSizesOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Size Selection Modal */}
            {showSizeModal && selectedProduct && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    {/* Transparent clickable overlay (no visual change) */}
    <div 
      className="absolute inset-0"
      onClick={() => {
        setShowSizeModal(false);
        setSelectedSize('');
      }}
    />
    
    {/* Floating modal panel */}
    <div className="relative bg-white p-6 max-w-md w-full mx-4 rounded-lg border border-gray-200 shadow-lg">
      {/* Product header */}
      <div className="flex gap-4 mb-4 items-center">
        <div className="w-16 h-16 bg-gray-50 rounded overflow-hidden flex-shrink-0">
          {selectedProduct.image?.[0] && (
            <img 
              src={selectedProduct.image[0]} 
              className="w-full h-full object-cover"
              alt={selectedProduct.name}
            />
          )}
        </div>
        <div>
          <h4 className="font-medium text-gray-900 line-clamp-1">{selectedProduct.name}</h4>
          <p className="text-gray-900 font-medium">
            {currency}{Number(selectedProduct.price).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Size selection */}
      <div className="mb-6">
        <p className="text-sm text-gray-700 mb-3">Select size</p>
        <div className="flex flex-wrap gap-2">
          {selectedProduct.sizes?.map((sizeOption) => {
            const stock = selectedProduct.sizeStock?.[sizeOption] || 0;
            const isOutOfStock = stock <= 0;
            const isSelected = sizeOption === selectedSize;
            
            return (
              <button
                key={sizeOption}
                onClick={() => !isOutOfStock && setSelectedSize(sizeOption)}
                className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                  isOutOfStock
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : isSelected
                      ? 'bg-green-50 text-green-700 border-green-500 border-2'
                      : 'bg-white hover:bg-gray-50 border-gray-300'
                }`}
                disabled={isOutOfStock}
              >
                {sizeOption}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded border border-gray-300"
          onClick={() => setShowSizeModal(false)}
        >
          Cancel
        </button>
        <button
          className={`px-4 py-2 text-sm text-white rounded ${
            selectedSize
              ? 'bg-pink-500 hover:bg-pink-600'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
          onClick={handleConfirmAddToCart}
          disabled={!selectedSize}
        >
          Add to Cart
        </button>
      </div>
    </div>
  </div>
)}
        </div>
    );
};

export default Wishlist;