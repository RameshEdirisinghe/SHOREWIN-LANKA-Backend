const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const uploadController = require('../controllers/upload.controller');
const multer = require('multer');
const upload = multer();

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post('/', productController.createProduct);
// New endpoint for image upload (expects multipart/form-data)
router.post('/upload-image', upload.single('file'), uploadController.uploadImage);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
