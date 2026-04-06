// backend/routes/test.js
const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

router.post('/start', testController.startTest);
router.post('/answer', testController.submitAnswer);
router.post('/time', testController.updateTime);
router.post('/submit', testController.submitTest);

module.exports = router;