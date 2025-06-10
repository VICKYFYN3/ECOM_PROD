import React, { useState } from 'react'
import { assets } from '../assets/assets'
import axios from 'axios';
import { backendURL } from '../App';
import { toast } from 'sonner';

const Add = ({token}) => {

    const [image1,setImage1] = useState(false);
    const [image2,setImage2] = useState(false);
    const [image3,setImage3] = useState(false);
    const [image4,setImage4] = useState(false);

    const [name,setName] = useState("");
    const [description,setDescription] = useState("");
    const [price,setPrice] = useState("");
    const [category,setCategory] = useState("Men");
    const [subCategory,setSubCategory] = useState("Topwear");
    const [bestseller,setBestseller] = useState(false);
    const [sizes,setSizes] = useState([]);
    const [loading, setLoading] = useState(false);

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();

            formData.append("name",name)
            formData.append("description",description)
            formData.append("price",price)
            formData.append("category",category)
            formData.append("subCategory",subCategory)
            formData.append("bestseller",bestseller)
            formData.append("sizes",JSON.stringify(sizes))

            image1 && formData.append("image1",image1)
            image2 && formData.append("image2",image2)
            image3 && formData.append("image3",image3)
            image4 && formData.append("image4",image4)

            const response = await axios.post(backendURL + "/api/product/add",formData,{headers:{token}})

            if(response.data.success){
                toast.success(response.data.message)
                setName('')
                setDescription('')
                setImage1(false)
                setImage2(false)
                setImage3(false)
                setImage4(false)
                setPrice('')
                setSizes([])
            }else{
                toast.error(response.data.message)
            }
            
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
                <p className="text-gray-600 mt-1">Fill in the details below to add a new product to your store</p>
            </div>

            <form onSubmit={onSubmitHandler} className='space-y-8'>
                {/* Image Upload Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className='text-lg font-semibold text-gray-900 mb-4'>Product Images</h3>
                    <p className='text-sm text-gray-600 mb-4'>Upload up to 4 high-quality images of your product</p>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                        {[
                            { image: image1, setImage: setImage1, id: "image1" },
                            { image: image2, setImage: setImage2, id: "image2" },
                            { image: image3, setImage: setImage3, id: "image3" },
                            { image: image4, setImage: setImage4, id: "image4" }
                        ].map((item, index) => (
                            <label key={item.id} htmlFor={item.id} className="group cursor-pointer">
                                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors duration-200 bg-white group-hover:bg-blue-50">
                                    <img 
                                        className='w-full h-24 object-cover rounded-md' 
                                        src={!item.image ? assets.upload_area : URL.createObjectURL(item.image)} 
                                        alt={`Upload ${index + 1}`} 
                                    />
                                </div>
                                <input 
                                    onChange={(e)=>item.setImage(e.target.files[0])} 
                                    type="file" 
                                    id={item.id} 
                                    hidden 
                                    accept="image/*"
                                />
                            </label>
                        ))}
                    </div>
                </div>

                {/* Basic Information */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Product Name *</label>
                        <input 
                            onChange={(e)=>setName(e.target.value)} 
                            value={name} 
                            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200' 
                            type="text" 
                            placeholder='Enter product name' 
                            required 
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Price *</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-500">$</span>
                            <input 
                                onChange={(e)=>setPrice(e.target.value)} 
                                value={price} 
                                className='w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200' 
                                placeholder='0.00' 
                                type="number" 
                                step="0.01"
                                min="0"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>Product Description *</label>
                    <textarea 
                        onChange={(e)=>setDescription(e.target.value)} 
                        value={description} 
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none' 
                        rows="4"
                        placeholder='Describe your product in detail...' 
                        required 
                    />
                </div>

                {/* Categories */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Category</label>
                        <select 
                            onChange={(e)=>setCategory(e.target.value)} 
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
                            onChange={(e)=>setSubCategory(e.target.value)} 
                            value={subCategory}
                            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white'
                        >
                            <option value="Topwear">Topwear</option>
                            <option value="Bottomwear">Bottomwear</option>
                            <option value="Winterwear">Winterwear</option>
                        </select>
                    </div>
                </div>

                {/* Sizes */}
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-3'>Available Sizes</label>
                    <div className='flex flex-wrap gap-3'>
                        {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                            <button
                                key={size}
                                type="button"
                                onClick={()=>setSizes(prev => prev.includes(size) ? prev.filter(item => item !== size): [...prev, size])}
                                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all duration-200 ${
                                    sizes.includes(size) 
                                        ? "bg-blue-500 text-white border-blue-500 shadow-sm" 
                                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                                }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
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

                {/* Submit Button */}
                <div className="flex justify-end pt-6 border-t border-gray-200">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`px-8 py-3 font-medium rounded-lg focus:ring-4 focus:ring-blue-200 transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2 ${
                            loading 
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
            </form>
        </div>
    )
}

export default Add