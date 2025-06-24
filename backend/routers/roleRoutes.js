// routes/rolesRouter.jsx
import express from 'express';import { createRole, deleteRole, getAllRoles, getRoleById, updateRole } from '../controllers/roleController.js';
;

const router = express.Router()

router.post('/createRole', createRole);
router.get('/getAllRoles', getAllRoles);
router.get('/getRoleById/:id', getRoleById);
router.patch('/updateRole/:id', updateRole);
router.delete('/deleteRole/:id', deleteRole);

export default router;
