import orderModel from "../models/orderModel.js"
import userModel from '../models/userModel.js';
import Stripe from 'stripe';
import Paystack from "paystack";
//global variables
const currency = 'ngn'
const deliveryCharge = 10

//gateway interface
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const paystack = Paystack(process.env.PAYSTACK_SECRET_KEY);
// Placing orders using cod

const placeOrder = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod: "COD",
            payment: false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        await userModel.findByIdAndUpdate(userId, { cartData: {} })

        res.json({ success: true, message: "Order Placed" })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })

    }
}

// placing orders using Stripe method
const placeOrderStripe = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body
        const { origin } = req.headers


        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod: "Stripe",
            payment: false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        const line_items = items.map((item) => ({
            price_data: {
                currency: currency,
                product_data: {
                    name: item.name
                },
                unit_amount: item.price * 100
            },
            quantity: item.quantity
        }))

        line_items.push({
            price_data: {
                currency: currency,
                product_data: {
                    name: 'Delivery Charges'
                },
                unit_amount: deliveryCharge * 100
            },
            quantity: 1
        })
        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode: 'payment',
        })
        res.json({success:true,session_url:session.url})
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

//verify Stripe

const verifyStripe = async (req, res) =>{
    const { orderId, success, userId } = req.body

    try {
        if(success === "true"){
            await orderModel.findByIdAndUpdate(orderId ,{payment:true});
            await userModel.findByIdAndUpdate(userId, {cartData: {}});
            res.json({success:true});
        }else{
            await orderModel.findByIdAndDelete(orderId);
            res.json({success:false})
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })        
    }
}

// placing orders using Razorpay
const placeOrderPaystack = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body;
        const { origin } = req.headers;

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod: "Paystack",
            payment: false,
            date: Date.now()
        };

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        // Create Paystack transaction
        const transaction = await paystack.transaction.initialize({
            amount: (amount + deliveryCharge) * 100, // Convert to kobo/cent
            email: address.email,
            reference: `order_${newOrder._id}_${Date.now()}`,
            callback_url: `${origin}/verify-paystack?orderId=${newOrder._id}`,
            currency: currency.toUpperCase(),
            metadata: {
                orderId: newOrder._id.toString(),
                userId
            }
        });

        res.json({
            success: true,
            authorization_url: transaction.data.authorization_url
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

//verify Paystack

const verifyPaystack = async (req, res) => {
    const { orderId, reference } = req.body;

    try {
        const transaction = await paystack.transaction.verify(reference);
        
        if (transaction.data.status === 'success') {
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            const order = await orderModel.findById(orderId);
            if (order) {
                await userModel.findByIdAndUpdate(order.userId, { cartData: {} });
            }
            res.json({ success: true });
        } else {
            await orderModel.findByIdAndDelete(orderId);
            res.json({ success: false });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};




//All orders data for Admin panel

const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({})
        res.json({ success: true, orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

//user order for frontend

const userOrders = async (req, res) => {
    try {
        const { userId } = req.body

        const orders = await orderModel.find({ userId })
        res.json({ success: true, orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

//update order status from admin panel
const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body
        await orderModel.findByIdAndUpdate(orderId, { status })
        res.json({ success: true, message: "Order status updated successfully" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })

    }
}

export { verifyStripe, placeOrder, placeOrderStripe, placeOrderPaystack, allOrders, userOrders, updateStatus, verifyPaystack }