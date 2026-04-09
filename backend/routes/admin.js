// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');

router.post('/login', adminController.adminLogin);
router.post('/generate-students', adminAuth, adminController.generateStudents);
router.get('/sessions', adminAuth, adminController.getAllSessions);
router.post('/restart', adminAuth, adminController.restartSession);
router.post('/assign-codes', adminAuth, adminController.assignCodesToStudents); // NEW

module.exports = router;