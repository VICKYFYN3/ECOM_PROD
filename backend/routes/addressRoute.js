import express from 'express';
import  authUser  from '../middleware/auth.js';
import { 
    getAddresses, 
    addAddress, 
    updateAddress, 
    deleteAddress,
    setDefaultAddress
} from '../controllers/addressController.js';

const addressRouter = express.Router();

addressRouter.post('/list', authUser, getAddresses);
addressRouter.post('/add', authUser, addAddress);
addressRouter.post('/update', authUser, updateAddress);
addressRouter.post('/delete', authUser, deleteAddress);
addressRouter.post('/set-default', authUser, setDefaultAddress);

export default addressRouter;