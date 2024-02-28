const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

router.post(
  '/signup',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  authController.signup,
);
router.post('/login', authController.login);

// Reset user password links
router.post('/forgotPassword', authController.forgotPassword);  
router.patch('/resetPassword/:token', authController.resetPassword);

// Email Verification Liknks
router.post('/resendEmailVerification', authController.resendEmailActivation);
router.patch('/accountActivation/:token', authController.activateUserAccount);
router.patch(
  '/updateMyPassword',
  authController.protect,
  authController.updatePassword,
);

// Restrict routes to only logged in users
router.use(authController.protect);

router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);
router.delete('/deleteMe', userController.deleteMe);

// restrict routes to only logged in admins and editors
router.use(authController.restrictTo('admin', 'editor'));

router.get('/', userController.getAllUsers);
router.route('/:id').get(userController.getUser);

// restrict routes to only logged in admins
router.use(authController.restrictTo('admin'));
router
  .route('/:id')
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
