const express = require('express');
const router = express.Router();

const passport = require('passport');
const { isLoggedIn, isNotLoggeIn } = require('../lib/auth');

// SIGNUP
/*router.get('/signup',isNotLoggeIn, (req, res) => {
  res.render('auth/signup');
});

router.post('/signup', isNotLoggeIn, passport.authenticate('local.signup',{
      successRedirect: '/profile',
      failureRedirect: '/signup',
      failureFlash: true

}));*/

// SIGNIN

router.get('/signin', isNotLoggeIn, (req, res ) => { 
    res.render('auth/signin.hbs'); //hbs
  });


  router.post('/signin',isNotLoggeIn, (req,res,next) => { // para que no me muestre la vista de logeo si la lo estoy 
     

    passport.authenticate('local.signin',{
      successRedirect: '/profile', // si todo se redirecciona bien me manda profile
      failureRedirect: '/signin',// si todo sale mal que me mande a signin
      failureFlash: true
    })(req,res,next);
  });
  

 router.get('/profile', isLoggedIn, (req, res) => {
    res.render('profile');
 });  

  router.get('/logout',isLoggedIn, (req, res) => {
    req.logOut(); // una vez que ya no estare el usuario 
    res.redirect('/signin'); // se redireccionara a esta vista
  });


module.exports = router;

