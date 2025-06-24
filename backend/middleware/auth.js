import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const verifyToken = (req,res,next)=>{
    const token = req.header('Authorization');
    if(!token){
        return res.status(401).json({error: 'Access denied'});

    }
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user= decoded.user;
        next();
    }
    catch(error){
        res.status(401).json({error:"Invalid or expired token"})
    }
    
};