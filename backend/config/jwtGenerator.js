import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const generateToken = (user)=>{
    return jwt.sign(
  {
    user: {
      user_id: user.user_id,
      role_id: user.role_id
    }
  },
  process.env.JWT_SECRET,
  { expiresIn: '1d' }
);

};
export default generateToken;