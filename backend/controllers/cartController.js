// add product to user cart

import userModel from "../models/userModel.js"

const addToCart = async (req,res) => {
    try {
        const { userId,itemId,size } = req.body

        const userData = await userModel.findById(userId)
        let cartData = await userData.cartData;

        if(cartData[itemId]){
            if(cartData[itemId][size]){
                cartData[itemId][size] += 1
            }else{
                cartData[itemId][size] = 1
            }
        }else{
            cartData[itemId] = {}
            cartData[itemId][size] = 1
        }

        await userModel.findByIdAndUpdate(userId,{cartData})

        res.json({success:true , message:'Added to Cart'})
    } catch (error) {
        res.json({success:false, message: error.message})
    }
}

// update user cart
const updateCart = async (req,res) => {
    try {
        const { userId,itemId,size,quantity } = req.body
        const userData = await userModel.findById(userId)
        let cartData = await userData.cartData;

        cartData[itemId][size] = quantity
        await userModel.findByIdAndUpdate(userId,{cartData})
        res.json({success:true,message:"Cart Updated"})

    } catch (error) {
        res.json({success:false, message: error.message})
    }
}

//get user cart data
const getUserCart = async (req,res) => {
    try {
        const { userId } = req.body
        const userData = await userModel.findById(userId)
        let cartData = await userData.cartData;

        res.json({success:true , cartData});
    } catch (error) {
        res.json({success:false, message: error.message})        
    }
}

// Remove item from user cart
const removeFromCart = async (req, res) => {
    try {
        const { userId, itemId, size } = req.body;
        const userData = await userModel.findById(userId);
        let cartData = userData.cartData;

        if (cartData[itemId] && cartData[itemId][size]) {
            delete cartData[itemId][size];
            if (Object.keys(cartData[itemId]).length === 0) {
                delete cartData[itemId];
            }
            await userModel.findByIdAndUpdate(userId, { cartData });
            res.json({ success: true, message: "Item removed from cart" });
        } else {
            res.json({ success: false, message: "Item not found in cart" });
        }
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export { addToCart, updateCart, getUserCart, removeFromCart };