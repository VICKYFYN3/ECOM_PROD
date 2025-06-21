import jwt from 'jsonwebtoken'

const authUser = async (req, res, next) => {

    const { token } = req.headers;

    if(!token){
        return res.json({success:false , message: 'Not Authorized login again'});

    }
    try {
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)
        
        // Ensure req.body exists (for GET requests that don't have a body)
        if (!req.body) {
            req.body = {};
        }
        
        req.body.userId = token_decode.id
        next()
    } catch (error) {
        res.status(401).json({success:false , message: 'Invalid token'})
        
    }

}
export default authUser;
