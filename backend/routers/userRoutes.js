import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { changePassword, createUser, deleteUser, getAllUsers, getUserById, loginUser, updateUser } from '../controllers/userController.js';


const router = express.Router();
router.post('/register', createUser);
router.post('/login', loginUser);
router.get('/getAllUsers', getAllUsers);
router.get('/getUserById/:id', getUserById);
router.patch('/updateUser',verifyToken, updateUser);
router.delete('/:id', deleteUser);
router.patch('/change-password', verifyToken, changePassword);



export default router;
