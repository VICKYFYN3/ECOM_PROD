import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title'
import ProductItem from './ProductItem'
import { useNavigate } from 'react-router-dom'

const RelatedProducts = ({ category, subCategory }) => {
    const { products, currency } = useContext(ShopContext)
    const [related, setRelated] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        if (products.length > 0) {
            let productsCopy = products.slice();

            const categoryFiltered = productsCopy.filter(item => category === item.category);

            const subCategoryFiltered = categoryFiltered.filter(item => subCategory === item.subCategory);

            setRelated(subCategoryFiltered.slice(0, 5));
        }
    }, [products, category, subCategory]);

    const handleProductClick = (id) => {
        navigate(`/product/${id}`, { replace: true });
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    return (
        <div className='my-24'>
            <div className='text-center text-3xl py-2'>
                <Title text1={'RELATED'} text2={'PRODUCTS'} />
            </div>
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
                {
                    related.map((item, index) => (
                        <div key={index} onClick={() => handleProductClick(item._id)}>
                            <ProductItem
                                name={item.name} id={item._id} price={item.price} image={item.image} currency={currency} stockQuantity={item.stockQuantity}
                            />
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default RelatedProducts