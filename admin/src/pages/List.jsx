import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { backendURL, currency } from '../App'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const List = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    if (!token) {
        navigate('/'); // Redirect to login
        return null;
    }
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(false)
    const [editingStock, setEditingStock] = useState({}) // Track which stock input is being edited
    const [editingProduct, setEditingProduct] = useState(null) // Track which product is being edited
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [editLoading, setEditLoading] = useState(false)

    // Edit form state
    const [editForm, setEditForm] = useState({
        name: '',
        description: '',
        price: '',
        category: 'Men',
        subCategory: 'Topwear',
        bestseller: false,
        sizes: [],
        sizeStocks: {}
    })

    // Image states for editing
    const [editImages, setEditImages] = useState({
        image1: null,
        image2: null,
        image3: null,
        image4: null
    })

    const fetchList = async () => {
        setLoading(true)
        try {
            const response = await axios.get(backendURL + '/api/product/list')
            if (response.data.success) {
                setList(response.data.products);
            } else {
                toast.error(response.data.message)
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    // Open edit modal and populate form
    const openEditModal = (product) => {
        setEditingProduct(product)
        setEditForm({
            name: product.name,
            description: product.description,
            price: product.price.toString(),
            category: product.category,
            subCategory: product.subCategory,
            bestseller: product.bestseller || false,
            sizes: product.sizes || [],
            sizeStocks: product.sizeStock || {}
        })
        setEditImages({
            image1: null,
            image2: null,
            image3: null,
            image4: null
        })
        setEditModalOpen(true)
    }

    // Close edit modal
    const closeEditModal = () => {
        setEditModalOpen(false)
        setEditingProduct(null)
        setEditForm({
            name: '',
            description: '',
            price: '',
            category: 'Men',
            subCategory: 'Topwear',
            bestseller: false,
            sizes: [],
            sizeStocks: {}
        })
        setEditImages({
            image1: null,
            image2: null,
            image3: null,
            image4: null
        })
    }

    // Handle edit form submission
    const handleEditSubmit = async (e) => {
        e.preventDefault()
        if (!editingProduct) return

        setEditLoading(true)
        try {
            const formData = new FormData()

            formData.append("name", editForm.name)
            formData.append("description", editForm.description)
            formData.append("price", editForm.price)
            formData.append("category", editForm.category)
            formData.append("subCategory", editForm.subCategory)
            formData.append("bestseller", editForm.bestseller)
            formData.append("sizes", JSON.stringify(editForm.sizes))
            formData.append("sizeStocks", JSON.stringify(editForm.sizeStocks))

            // Only append new images if they exist
            editImages.image1 && formData.append("image1", editImages.image1)
            editImages.image2 && formData.append("image2", editImages.image2)
            editImages.image3 && formData.append("image3", editImages.image3)
            editImages.image4 && formData.append("image4", editImages.image4)

            const response = await axios.post(
                backendURL + "/api/product/update",
                formData,
                { 
                    headers: { 
                        token,
                        'Content-Type': 'multipart/form-data'
                    },
                    params: { productId: editingProduct._id }
                }
            )

            if (response.data.success) {
                toast.success('Product updated successfully')
                closeEditModal()
                await fetchList()
            } else {
                toast.error(response.data.message)
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setEditLoading(false)
        }
    }

    // Handle size selection in edit form
    const handleEditSizeToggle = (size) => {
        setEditForm(prev => {
            const newSizes = prev.sizes.includes(size) 
                ? prev.sizes.filter(item => item !== size) 
                : [...prev.sizes, size]
            
            const newSizeStocks = { ...prev.sizeStocks }
            if (newSizes.includes(size) && !prev.sizeStocks[size]) {
                newSizeStocks[size] = 0
            } else if (!newSizes.includes(size)) {
                delete newSizeStocks[size]
            }
            
            return {
                ...prev,
                sizes: newSizes,
                sizeStocks: newSizeStocks
            }
        })
    }

    // Handle image file selection for editing
    const handleEditImageChange = (imageKey, file) => {
        setEditImages(prev => ({
            ...prev,
            [imageKey]: file
        }))
    }

    // Only allow size-specific stock updates
    const updateStock = async (productId, change, size) => {
        if (!size) {
            toast.error("Size must be specified for stock updates");
            return;
        }

        try {
            const response = await axios.post(
                backendURL + "/api/product/update-stock",
                { productId, quantity: change, size },
                { headers: { token } }
            );

            if (response.data.success) {
                toast.success(`Stock updated for size ${size}`);
                await fetchList();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // New function to update stock via direct input
    const updateStockDirect = async (productId, newValue, size) => {
        if (!size) {
            toast.error("Size must be specified for stock updates");
            return;
        }

        // Validate input
        const numericValue = parseInt(newValue);
        if (isNaN(numericValue) || numericValue < 0) {
            toast.error("Stock must be a non-negative number");
            return;
        }

        try {
            // Get current stock for this size
            const currentProduct = list.find(item => item._id === productId);
            const currentStock = currentProduct?.sizeStock?.[size] || 0;
            const change = numericValue - currentStock;

            const response = await axios.post(
                backendURL + "/api/product/update-stock",
                { productId, quantity: change, size },
                { headers: { token } }
            );

            if (response.data.success) {
                toast.success(`Stock updated for size ${size}`);
                await fetchList();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Handle input change
    const handleStockInputChange = (productId, size, value) => {
        setEditingStock(prev => ({
            ...prev,
            [`${productId}-${size}`]: value
        }));
    };

    // Handle input blur (save on blur)
    const handleStockInputBlur = (productId, size) => {
        const inputValue = editingStock[`${productId}-${size}`];
        if (inputValue !== undefined) {
            updateStockDirect(productId, inputValue, size);
            // Clear the editing state
            setEditingStock(prev => {
                const newState = { ...prev };
                delete newState[`${productId}-${size}`];
                return newState;
            });
        }
    };

    // Handle Enter key press
    const handleStockInputKeyPress = (e, productId, size) => {
        if (e.key === 'Enter') {
            e.target.blur(); // This will trigger the blur handler
        }
    };

    const removeProduct = async (id) => {
        try {
            const response = await axios.post(backendURL + '/api/product/remove', { id }, { headers: { token } })
            if (response.data.success) {
                toast.success(response.data.message);
                await fetchList();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => {
        fetchList()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading products...</span>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-sm">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">All Products</h2>
                <p className="text-sm text-gray-600 mt-1">{list.length} products found</p>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Image
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Stock Management
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {list.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex-shrink-0 h-16 w-16">
                                            <img
                                                className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                                                src={item.image[0]}
                                                alt={item.name}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                        {currency}{item.price}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-3">
                                            {/* Total Stock Display (Read-only) */}
                                            <div className="bg-gray-100 px-3 py-2 rounded-lg">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-gray-700">Total Stock:</span>
                                                    <span className="text-lg font-bold text-gray-900">{item.stockQuantity || 0}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">Calculated from size stocks</p>
                                            </div>

                                            {/* Size-specific Stock Controls */}
                                            {item.sizes && item.sizes.length > 0 ? (
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Size Stock Management</h4>
                                                    {item.sizes.map(size => {
                                                        const sizeStock = item.sizeStock?.[size] || 0;
                                                        const isEditing = editingStock[`${item._id}-${size}`] !== undefined;
                                                        const displayValue = isEditing ? editingStock[`${item._id}-${size}`] : sizeStock;
                                                        
                                                        return (
                                                            <div key={size} className="flex items-center justify-between bg-white border rounded-lg px-3 py-2">
                                                                <span className="text-sm font-medium text-gray-600 min-w-[1.5rem]">{size}:</span>
                                                                <div className="flex items-center space-x-2">
                                                                    <button
                                                                        onClick={() => updateStock(item._id, -1, size)}
                                                                        className="w-7 h-7 flex items-center justify-center bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                                        disabled={sizeStock <= 0}
                                                                        title={`Reduce ${size} stock`}
                                                                    >
                                                                        -
                                                                    </button>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={displayValue}
                                                                        onChange={(e) => handleStockInputChange(item._id, size, e.target.value)}
                                                                        onBlur={() => handleStockInputBlur(item._id, size)}
                                                                        onKeyPress={(e) => handleStockInputKeyPress(e, item._id, size)}
                                                                        className="w-12 h-7 text-center text-sm font-bold text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                        title={`Click to edit ${size} stock directly`}
                                                                    />
                                                                    <button
                                                                        onClick={() => updateStock(item._id, 1, size)}
                                                                        className="w-7 h-7 flex items-center justify-center bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                                                                        title={`Increase ${size} stock`}
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 bg-yellow-50 rounded-lg">
                                                    <p className="text-sm text-yellow-700">No sizes defined for this product</p>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            <button
                                                onClick={() => openEditModal(item)}
                                                className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => removeProduct(item._id)}
                                                className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Compact Mobile Card View */}
            <div className="md:hidden">
                <div className="divide-y divide-gray-100">
                    {list.map((item, index) => (
                        <div key={index} className="p-3 bg-white">
                            {/* Top Row: Image, Name, Action Buttons */}
                            <div className="flex items-start space-x-3 mb-2">
                                <img
                                    className="h-16 w-16 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                                    src={item.image[0]}
                                    alt={item.name}
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-gray-900 leading-tight mb-1">
                                        {item.name}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                            {item.category}
                                        </span>
                                        <span className="text-sm font-bold text-gray-900">
                                            {currency}{item.price}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col space-y-1 flex-shrink-0">
                                    <button
                                        onClick={() => openEditModal(item)}
                                        className="px-2 py-1 text-xs font-medium rounded text-white bg-blue-500 hover:bg-blue-600 transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => removeProduct(item._id)}
                                        className="px-2 py-1 text-xs font-medium rounded text-white bg-red-500 hover:bg-red-600 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {/* Stock Section */}
                            <div className="bg-gray-50 rounded-lg p-2">
                                {/* Total Stock - Compact */}
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-600">Total Stock:</span>
                                    <span className="text-sm font-bold text-gray-900">{item.stockQuantity || 0}</span>
                                </div>

                                {/* Size Stock Controls - Ultra Compact */}
                                {item.sizes && item.sizes.length > 0 ? (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Size Stock:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {item.sizes.map(size => {
                                                const sizeStock = item.sizeStock?.[size] || 0;
                                                const isEditing = editingStock[`${item._id}-${size}`] !== undefined;
                                                const displayValue = isEditing ? editingStock[`${item._id}-${size}`] : sizeStock;
                                                
                                                return (
                                                    <div key={size} className="flex items-center bg-white rounded border px-1 py-1">
                                                        <span className="text-xs font-medium text-gray-700 mr-1">{size}</span>
                                                        <div className="flex items-center">
                                                            <button
                                                                onClick={() => updateStock(item._id, -1, size)}
                                                                className="w-5 h-5 flex items-center justify-center bg-red-100 text-red-600 rounded text-xs hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                disabled={sizeStock <= 0}
                                                            >
                                                                -
                                                            </button>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={displayValue}
                                                                onChange={(e) => handleStockInputChange(item._id, size, e.target.value)}
                                                                onBlur={() => handleStockInputBlur(item._id, size)}
                                                                onKeyPress={(e) => handleStockInputKeyPress(e, item._id, size)}
                                                                className="w-8 h-5 text-center text-xs font-bold text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                title={`Click to edit ${size} stock directly`}
                                                            />
                                                            <button
                                                                onClick={() => updateStock(item._id, 1, size)}
                                                                className="w-5 h-5 flex items-center justify-center bg-green-100 text-green-600 rounded text-xs hover:bg-green-200"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-1 bg-yellow-50 rounded">
                                        <p className="text-xs text-yellow-700">No sizes defined</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Empty State */}
            {list.length === 0 && !loading && (
                <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-500">Get started by adding your first product.</p>
                </div>
            )}

            {/* Edit Product Modal */}
            {editModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900">Edit Product</h3>
                                <button
                                    onClick={closeEditModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleEditSubmit} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Basic Information */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Product Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Description *
                                        </label>
                                        <textarea
                                            value={editForm.description}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                            rows="4"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Price *
                                        </label>
                                        <input
                                            type="number"
                                            value={editForm.price}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Category *
                                            </label>
                                            <select
                                                value={editForm.category}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            >
                                                <option value="Men">Men</option>
                                                <option value="Women">Women</option>
                                                <option value="Kids">Kids</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Sub Category *
                                            </label>
                                            <select
                                                value={editForm.subCategory}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, subCategory: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            >
                                                <option value="Topwear">Topwear</option>
                                                <option value="Bottomwear">Bottomwear</option>
                                                <option value="Footwear">Footwear</option>
                                                <option value="Accessories">Accessories</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="bestseller"
                                            checked={editForm.bestseller}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, bestseller: e.target.checked }))}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="bestseller" className="ml-2 block text-sm text-gray-900">
                                            Mark as Bestseller
                                        </label>
                                    </div>
                                </div>

                                {/* Images and Sizes */}
                                <div className="space-y-4">
                                    {/* Current Images */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Current Images
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {editingProduct?.image?.map((img, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={img}
                                                        alt={`Product ${index + 1}`}
                                                        className="w-full h-20 object-cover rounded-lg border border-gray-200"
                                                    />
                                                    <span className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                                                        Image {index + 1}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* New Images */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Replace Images (Optional)
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[1, 2, 3, 4].map((num) => (
                                                <div key={num} className="relative">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleEditImageChange(`image${num}`, e.target.files[0])}
                                                        className="hidden"
                                                        id={`editImage${num}`}
                                                    />
                                                    <label
                                                        htmlFor={`editImage${num}`}
                                                        className="block w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors flex items-center justify-center"
                                                    >
                                                        {editImages[`image${num}`] ? (
                                                            <img
                                                                src={URL.createObjectURL(editImages[`image${num}`])}
                                                                alt={`New ${num}`}
                                                                className="w-full h-full object-cover rounded-lg"
                                                            />
                                                        ) : (
                                                            <span className="text-xs text-gray-500">Image {num}</span>
                                                        )}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Sizes */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Available Sizes
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    onClick={() => handleEditSizeToggle(size)}
                                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                                        editForm.sizes.includes(size)
                                                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                                            : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Size Stocks */}
                                    {editForm.sizes.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Stock by Size
                                            </label>
                                            <div className="space-y-2">
                                                {editForm.sizes.map((size) => (
                                                    <div key={size} className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-gray-600">{size}:</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={editForm.sizeStocks[size] || 0}
                                                            onChange={(e) => setEditForm(prev => ({
                                                                ...prev,
                                                                sizeStocks: {
                                                                    ...prev.sizeStocks,
                                                                    [size]: parseInt(e.target.value) || 0
                                                                }
                                                            }))}
                                                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editLoading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                                >
                                    {editLoading ? 'Updating...' : 'Update Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default List