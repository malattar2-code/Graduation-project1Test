const express = require('express');
const router = express.Router();

router.get('/test-categories', (req, res) => {
  res.json({ message: 'Categories route is working!' });
});

router.get('/test-categories-page', (req, res) => {
  res.render('site/categories', { 
    categories: [
      { category_name: 'Test 1', category_image: '/test1.jpg' },
      { category_name: 'Test 2', category_image: '/test2.jpg' }
    ],
    title: 'Test Categories'
  });
});

module.exports = router;