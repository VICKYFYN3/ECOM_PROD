import React, { useState } from 'react'
import { assets } from '../assets/assets'
import axios from 'axios';
import { backendURL } from '../App';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Add = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    if (!token) {
        navigate('/'); // Redirect to login
        return null;
    }

    const [image1, setImage1] = useState(false);
    const [image2, setImage2] = useState(false);
    const [image3, setImage3] = useState(false);
    const [image4, setImage4] = useState(false);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("Men");
    const [subCategory, setSubCategory] = useState("Topwear");
    const [bestseller, setBestseller] = useState(false);
    const [sizes, setSizes] = useState([]);
    const [loading, setLoading] = useState(false);
    // Remove stockQuantity state as it will be calculated
    // New state for enhanced features
    const [showPreview, setShowPreview] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    // eslint-disable-next-line no-unused-vars
    const [quickFillTemplate, setQuickFillTemplate] = useState("");
    const [sizeStocks, setSizeStocks] = useState({});

    // Calculate total stock from individual size stocks
    const totalStock = Object.values(sizeStocks).reduce((total, stock) => total + (stock || 0), 0);

    // Quick fill templates
    const templates = {
        "t-shirt": {
            name: "Premium Cotton T-Shirt",
            description: "Comfortable, breathable cotton t-shirt perfect for everyday wear. Made from 100% premium cotton with a relaxed fit.",
            price: "2500",
            category: "Men",
            subCategory: "Topwear",
            sizes: ["S", "M", "L", "XL"],
            sizeStocks: { "S": 10, "M": 15, "L": 20, "XL": 10 }
        },
        "jeans": {
            name: "Classic Denim Jeans",
            description: "Durable denim jeans with a classic straight fit. Perfect for casual and semi-formal occasions.",
            price: "8500",
            category: "Men",
            subCategory: "Bottomwear",
            sizes: ["S", "M", "L", "XL", "XXL"],
            sizeStocks: { "S": 8, "M": 12, "L": 15, "XL": 10, "XXL": 5 }
        },
        "dress": {
            name: "Elegant Evening Dress",
            description: "Beautiful evening dress perfect for special occasions. Made from high-quality fabric with elegant design.",
            price: "12000",
            category: "Women",
            subCategory: "Topwear",
            sizes: ["S", "M", "L", "XL"],
            sizeStocks: { "S": 6, "M": 10, "L": 12, "XL": 8 }
        }
    };

    const handleQuickFill = (template) => {
        const data = templates[template];
        setName(data.name);
        setDescription(data.description);
        setPrice(data.price);
        setCategory(data.category);
        setSubCategory(data.subCategory);
        setSizes(data.sizes);
        setSizeStocks(data.sizeStocks);
        setQuickFillTemplate("");
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragActive(false);
    };

    const handleDrop = (e, setImage) => {
        e.preventDefault();
        setDragActive(false);
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            setImage(files[0]);
        }
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setImage1(false);
        setImage2(false);
        setImage3(false);
        setImage4(false);
        setPrice('');
        setSizes([]);
        setBestseller(false);
        setCategory("Men");
        setSubCategory("Topwear");
        setSizeStocks({});
    };

    // Handle size selection and automatically initialize stock
    const handleSizeToggle = (size) => {
        setSizes(prev => {
            const newSizes = prev.includes(size) 
                ? prev.filter(item => item !== size) 
                : [...prev, size];
            
            // Update sizeStocks when sizes change
            setSizeStocks(prevStocks => {
                const newStocks = { ...prevStocks };
                if (newSizes.includes(size) && !prevStocks[size]) {
                    newStocks[size] = 0; // Initialize with 0
                } else if (!newSizes.includes(size)) {
                    delete newStocks[size]; // Remove if size is deselected
                }
                return newStocks;
            });
            
            return newSizes;
        });
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();

            formData.append("name", name)
            formData.append("description", description)
            formData.append("price", price)
            formData.append("category", category)
            formData.append("subCategory", subCategory)
            formData.append("bestseller", bestseller)
            formData.append("sizes", JSON.stringify(sizes))
            formData.append("sizeStocks", JSON.stringify(sizeStocks)) // Send size stocks instead of total stock
            image1 && formData.append("image1", image1)
            image2 && formData.append("image2", image2)
            image3 && formData.append("image3", image3)
            image4 && formData.append("image4", image4)

            const response = await axios.post(backendURL + "/api/product/add", formData, { headers: { token } })

            if (response.data.success) {
                toast.success(response.data.message)
                resetForm();
            } else {
                toast.error(response.data.message)
            }

        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Header with Quick Actions */}
            <div className="mb-8">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
                        <p className="text-gray-600 mt-1">Fill in the details below to add a new product to your store</p>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            type="button"
                            onClick={() => setShowPreview(!showPreview)}
                            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            {showPreview ? 'Hide' : 'Show'} Preview
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            Clear All
                        </button>
                    </div>
                </div>

                {/* Quick Fill Templates */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">Quick Fill Templates</h3>
                    <div className="flex flex-wrap gap-2">
                        {Object.keys(templates).map((template) => (
                            <button
                                key={template}
                                type="button"
                                onClick={() => handleQuickFill(template)}
                                className="px-3 py-1 text-xs font-medium text-blue-700 bg-white rounded-full hover:bg-blue-100 transition-colors capitalize"
                            >
                                {template.replace('-', ' ')}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-blue-700 mt-2">Click a template to auto-fill form with sample data</p>
                </div>
            </div>

            <form onSubmit={onSubmitHandler} className='space-y-8'>
                {/* Image Upload Section with Drag & Drop */}
                <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className='text-lg font-semibold text-gray-900 mb-4'>Product Images</h3>
                    <p className='text-sm text-gray-600 mb-4'>Upload up to 4 high-quality images (drag & drop supported)</p>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                        {[
                            { image: image1, setImage: setImage1, id: "image1" },
                            { image: image2, setImage: setImage2, id: "image2" },
                            { image: image3, setImage: setImage3, id: "image3" },
                            { image: image4, setImage: setImage4, id: "image4" }
                        ].map((item, index) => (
                            <div key={item.id} className="relative">
                                <label
                                    htmlFor={item.id}
                                    className="group cursor-pointer block"
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, item.setImage)}
                                >
                                    <div className={`relative border-2 border-dashed rounded-lg p-4 transition-all duration-200 bg-white ${dragActive
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-300 hover:border-blue-400 group-hover:bg-blue-50'
                                        }`}>
                                        <img
                                            className='w-full h-24 object-cover rounded-md'
                                            src={!item.image ? assets.upload_area : URL.createObjectURL(item.image)}
                                            alt={`Upload ${index + 1}`}
                                        />
                                        {!item.image && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-xs text-gray-500">Drop or click</span>
                                            </div>
                                        )}
                                    </div>
                                </label>
                                {item.image && (
                                    <button
                                        type="button"
                                        onClick={() => item.setImage(false)}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
                                    >
                                        ×
                                    </button>
                                )}
                                <input
                                    onChange={(e) => item.setImage(e.target.files[0])}
                                    type="file"
                                    id={item.id}
                                    hidden
                                    accept="image/*"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Basic Information */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Product Name *
                            <span className="text-xs text-gray-500 font-normal ml-1">({name.length}/100)</span>
                        </label>
                        <input
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200'
                            type="text"
                            placeholder='Enter product name'
                            maxLength="100"
                            required
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Price *</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-500">₦</span>
                            <input
                                onChange={(e) => setPrice(e.target.value)}
                                value={price}
                                className='w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200'
                                placeholder='0.00'
                                type="number"
                                step="0.01"
                                min="0"
                                required
                            />
                        </div>
                        {price && (
                            <p className="text-xs text-gray-500 mt-1">
                                Formatted: ₦{parseFloat(price).toLocaleString()}
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Product Description *
                        <span className="text-xs text-gray-500 font-normal ml-1">({description.length}/500)</span>
                    </label>
                    <textarea
                        onChange={(e) => setDescription(e.target.value)}
                        value={description}
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none'
                        rows="4"
                        placeholder='Describe your product in detail...'
                        maxLength="500"
                        required
                    />
                </div>

                {/* Categories with Smart Defaults */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Category</label>
                        <select
                            onChange={(e) => {
                                setCategory(e.target.value);
                                // Smart subcategory reset
                                if (e.target.value === "Kids") {
                                    setSubCategory("Topwear");
                                }
                            }}
                            value={category}
                            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white'
                        >
                            <option value="Men">Men</option>
                            <option value="Women">Women</option>
                            <option value="Kids">Kids</option>
                        </select>
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Sub Category</label>
                        <select
                            onChange={(e) => setSubCategory(e.target.value)}
                            value={subCategory}
                            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white'
                        >
                            <option value="Topwear">Topwear</option>
                            <option value="Bottomwear">Bottomwear</option>
                            <option value="Winterwear">Winterwear</option>
                        </select>
                    </div>
                </div>

                {/* Sizes with Quick Select */}
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-3'>Available Sizes</label>
                    <div className="mb-3">
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setSizes(['S', 'M', 'L']);
                                    setSizeStocks({ S: 0, M: 0, L: 0 });
                                }}
                                className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
                            >
                                Standard (S,M,L)
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSizes(['S', 'M', 'L', 'XL', 'XXL', 'XXXL','XXXXL']);
                                    setSizeStocks({ S: 0, M: 0, L: 0, XL: 0, XXL: 0 ,XXXL: 0,XXXXL:0});
                                }}
                                className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
                            >
                                All Sizes
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSizes([]);
                                    setSizeStocks({});
                                }}
                                className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                    <div className='flex flex-wrap gap-3 mb-4'>
                        {['S', 'M', 'L', 'XL','XXL','XXXL','XXXXL'].map((size) => (
                            <button
                                key={size}
                                type="button"
                                onClick={() => handleSizeToggle(size)}
                                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all duration-200 ${sizes.includes(size)
                                    ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                                    }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>

                    {/* Stock by Size */}
                    {sizes.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <label className='block text-sm font-medium text-gray-700 mb-3'>Stock by Size *</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                                {sizes.map(size => (
                                    <div key={size} className="flex flex-col">
                                        <label className="text-sm font-medium text-gray-600 mb-1">{size}</label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={sizeStocks[size] || ""}
                                            onChange={(e) => setSizeStocks(prev => ({
                                                ...prev,
                                                [size]: parseInt(e.target.value) || 0
                                            }))}
                                            required
                                        />
                                    </div>
                                ))}
                            </div>
                            
                            {/* Display Total Stock (Read-only) */}
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-blue-900">Total Stock Quantity:</span>
                                    <span className="text-lg font-bold text-blue-900">{totalStock}</span>
                                </div>
                                <p className="text-xs text-blue-700 mt-1">
                                    This is calculated automatically from individual size stocks
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bestseller */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className='flex items-center space-x-3'>
                        <input
                            className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2'
                            onChange={() => setBestseller(prev => !prev)}
                            checked={bestseller}
                            type="checkbox"
                            id='bestseller'
                        />
                        <label className='text-sm font-medium text-gray-700 cursor-pointer' htmlFor="bestseller">
                            Mark as Bestseller
                        </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-7">This product will be featured in the bestsellers section</p>
                </div>

                {/* Preview Section */}
                {showPreview && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-yellow-800 mb-4">Product Preview</h3>
                        <div className="bg-white rounded-lg p-4 border">
                            <div className="flex space-x-4">
                                <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0">
                                    {image1 && (
                                        <img
                                            src={URL.createObjectURL(image1)}
                                            alt="Preview"
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{name || "Product Name"}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{description || "Product description..."}</p>
                                    <div className="flex items-center space-x-4 mt-2">
                                        <span className="font-semibold text-green-600">
                                            ₦{price ? parseFloat(price).toLocaleString() : "0"}
                                        </span>
                                        {bestseller && (
                                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                                Bestseller
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2 mt-2">
                                        <span className="text-xs text-gray-500">Sizes:</span>
                                        {sizes.map(size => (
                                            <span key={size} className="px-2 py-1 text-xs bg-gray-100 rounded">
                                                {size} ({sizeStocks[size] || 0})
                                            </span>
                                        ))}
                                    </div>
                                    <div className="mt-2">
                                        <span className="text-xs text-gray-500">Total Stock: </span>
                                        <span className="text-sm font-medium text-gray-900">{totalStock}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                        {!name || !description || !price || sizes.length === 0 || totalStock === 0 ? (
                            <span className="text-red-500">Please fill in all required fields and set stock quantities</span>
                        ) : (
                            <span className="text-green-500">✓ Ready to submit</span>
                        )}
                    </div>
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={() => setShowPreview(!showPreview)}
                            className="px-6 py-3 font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                        >
                            Preview
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name || !description || !price || sizes.length === 0 || totalStock === 0}
                            className={`px-8 py-3 font-medium rounded-lg focus:ring-4 focus:ring-blue-200 transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2 ${loading || !name || !description || !price || sizes.length === 0 || totalStock === 0
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            {loading && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                            <span>{loading ? 'Adding Product...' : 'Add Product'}</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}

export default Add