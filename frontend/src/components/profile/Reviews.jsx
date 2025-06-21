import React, { useState, useContext, useEffect } from 'react';
import { assets } from '../../assets/assets';
import { ShopContext } from '../../context/ShopContext';
import axios from 'axios';
import { toast } from 'sonner';

const Reviews = () => {
    const { backendURL, token } = useContext(ShopContext);
    const [reviews, setReviews] = useState([]);
    const [reviewableProducts, setReviewableProducts] = useState([]);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [rating, setRating] = useState(5);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Rating text mapping
    const ratingText = {
        1: "I hate it",
        2: "I don't like it",
        3: "I have mixed feelings",
        4: "I like it",
        5: "I love it"
    };

    const fetchReviews = async () => {
        try {
            const response = await axios.post(backendURL + '/api/review/list', {}, {
                headers: { token }
            });
            setReviews(response.data.reviews || []);
        } catch (error) {
            toast.error('Failed to load reviews');
        }
    };

    const fetchReviewableProducts = async () => {
        try {
            const response = await axios.post(backendURL + '/api/review/reviewable-products', {}, {
                headers: { token }
            });
            setReviewableProducts(response.data.products || []);
        } catch (error) {
            toast.error('Failed to load reviewable products');
        }
    };

    useEffect(() => {
        if (token) {
            fetchReviews();
            fetchReviewableProducts();
        }
    }, [token]);

    const handleAddReview = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(backendURL + '/api/review/add', {
                productId: selectedProduct._id,
                rating
            }, {
                headers: { token }
            });

            if (response.data.success) {
                toast.success('Review submitted successfully!');
                setShowReviewForm(false);
                setSelectedProduct(null);
                setRating(5);
                setHoveredRating(0);
                setError('');
                await fetchReviews();
                await fetchReviewableProducts();
            } else {
                toast.error(response.data.message || 'Failed to submit review');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateReview = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(backendURL + '/api/review/update', {
                reviewId: editingReview,
                rating
            }, {
                headers: { token }
            });
            if (response.data.success) {
                await fetchReviews();
                setEditingReview(null);
                setRating(5);
                setHoveredRating(0);
                setError('');
                toast.success('Rating updated successfully');
            } else {
                setError(response.data.message || 'Failed to update rating');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to update rating');
        } finally {
            setLoading(false);
        }
    };

    const handleEditReview = (review) => {
        setEditingReview(review._id);
        setSelectedProduct(null);
        setRating(review.rating);
        setHoveredRating(0);
    };

    const handleDeleteReview = async (reviewId) => {
        setLoading(true);
        try {
            const response = await axios.post(backendURL + '/api/review/delete', { reviewId }, {
                headers: { token }
            });
            if (response.data.success) {
                await fetchReviews();
                // Also refresh reviewable products as the deleted review might make the product reviewable again
                await fetchReviewableProducts();
                toast.success('Rating deleted successfully');
            } else {
                setError(response.data.message || 'Failed to delete rating');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to delete rating');
        } finally {
            setLoading(false);
        }
    };

    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setShowReviewForm(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">My Ratings</h2>
            </div>

            {/* Show reviewable products first */}
            {reviewableProducts?.length > 0 && !showReviewForm && !editingReview && (
                <div className="mb-8">
                    <h3 className="text-lg font-medium mb-4">Products Ready for Rating</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {reviewableProducts?.map(product => (
                            <div
                                key={product._id}
                                className="border rounded-lg p-4 hover:border-blue-500 transition-colors"
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-20 h-20 bg-gray-200 rounded-md overflow-hidden mb-3">
                                        <img
                                            src={product.image?.[0] || product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <h4 className="text-sm font-medium mb-1">{product.name}</h4>
                                    <p className="text-xs text-gray-500 mb-3">
                                        Purchased on {new Date(product.createdAt).toLocaleDateString()}
                                    </p>
                                    <button
                                        onClick={() => handleProductSelect(product)}
                                        className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
                                    >
                                        Rate This Product
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Review Form */}
            {(showReviewForm || editingReview) && (
                <div className="mb-8 border rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-4">
                        {editingReview ? 'Edit Your Rating' : 'Rate This Product'}
                    </h3>

                    {error && (
                        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={editingReview ? handleUpdateReview : handleAddReview}>
                        {selectedProduct && (
                            <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
                                <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-md overflow-hidden">
                                    <img
                                        src={selectedProduct.image?.[0] || selectedProduct.image}
                                        alt={selectedProduct.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium">{selectedProduct.name}</h4>
                                    <p className="text-xs text-gray-500">
                                        Purchased on {new Date(selectedProduct.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">Your Rating</label>
                            <div className="flex items-center gap-2">
                                {/* Rating text display */}
                                <div className="w-32 text-sm font-medium text-gray-600">
                                    {ratingText[hoveredRating || rating]}
                                </div>

                                {/* Star rating */}
                                <div className="flex">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoveredRating(star)}
                                            onMouseLeave={() => setHoveredRating(0)}
                                            className="focus:outline-none transition-colors"
                                        >
                                            <svg
                                                className={`w-8 h-8 ${(hoveredRating || rating) >= star
                                                        ? 'text-yellow-400'
                                                        : 'text-gray-300'
                                                    } hover:text-yellow-400`}
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    if (editingReview) {
                                        setEditingReview(null);
                                    } else {
                                        setShowReviewForm(false);
                                        setSelectedProduct(null);
                                    }
                                    setError('');
                                    setHoveredRating(0);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : editingReview ? 'Update Rating' : 'Submit Rating'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Empty state or existing reviews */}
            {reviewableProducts?.length === 0 && reviews?.length === 0 && !showReviewForm && !editingReview ? (
                <div className="text-center py-10">
                    <img src={assets.empty_reviews} alt="No products to rate" className="w-32 h-32 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Products to Rate</h3>
                    <p className="text-gray-500 mb-4">Complete some orders to rate your purchased products.</p>
                </div>
            ) : reviews?.length > 0 && !showReviewForm && !editingReview ? (
                <div>
                    <h3 className="text-lg font-medium mb-4">Your Previous Ratings</h3>
                    <div className="space-y-4">
                        {reviews?.map(review => (
                            <div key={review._id} className="border p-4 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden">
                                            <img
                                                src={review.product?.image?.[0] || review.product?.image}
                                                alt={review.product?.name || 'Product'}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium">{review.product?.name || 'Unnamed Product'}</h4>
                                            <div className="flex items-center text-yellow-500 text-sm mt-1">
                                                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                                <span className="ml-2 text-gray-600">({review.rating}/5)</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditReview(review)}
                                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteReview(review._id)}
                                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                                            disabled={loading}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default Reviews;