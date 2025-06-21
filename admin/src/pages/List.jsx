import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { backendURL, currency } from '../App'
import { toast } from 'sonner'

const List = ({ token }) => {
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(false)
    const [editingStock, setEditingStock] = useState({}) // Track which stock input is being edited

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
                                        <button
                                            onClick={() => removeProduct(item._id)}
                                            className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
                                        >
                                            Delete
                                        </button>
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
                            {/* Top Row: Image, Name, Delete Button */}
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
                                <button
                                    onClick={() => removeProduct(item._id)}
                                    className="px-2 py-1 text-xs font-medium rounded text-white bg-red-500 hover:bg-red-600 transition-colors flex-shrink-0"
                                >
                                    Delete
                                </button>
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
        </div>
    )
}

export default List