import jwt from "jsonwebtoken";
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET;

export function verifyToken(req,res,next){
const authHeader = req.headers['authorization']; 
const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token required' }); // Token missing
try{
  const decoded=jwt.verify(token,JWT_SECRET);
  req.user=decoded;
  next();
}catch(e){
    return res.status(403).json({ error: "Invalid or expired token." });
}
}

