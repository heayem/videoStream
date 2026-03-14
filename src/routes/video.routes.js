const express = require('express');
const router = express.Router();
const VideoController = require('../controllers/video.controller');
const upload = require('../middleware/upload.middleware');

router.get('/', VideoController.list);
router.get('/:id', VideoController.get);
router.post('/', upload.any(), VideoController.upload);
router.patch('/:id', VideoController.update);
router.delete('/:id', VideoController.delete);
router.get('/:id/stream', VideoController.stream);

module.exports = router;
