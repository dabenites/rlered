const express = require('express');
const router = express.Router();

const passport = require('passport');
const { isLoggedIn, isNotLoggeIn } = require('../lib/auth');

// SIGNIN

router.get('/signin2', isNotLoggeIn, (req, res ) => { 
    res.render('auth/signin2.hbs', {layout: 'mainLogin'}); //hbs
  });


router.post('/signin2',isNotLoggeIn, (req,res,next) => { // para que no me muestre la vista de logeo si la lo estoy 
     
    passport.authenticate('local.signin',{
      successRedirect: '/dashboard', // si todo se redirecciona bien me manda profile
      failureRedirect: '/signin2',// si todo sale mal que me mande a signin
      failureFlash: true
    })(req,res,next);
  });
  

 router.get('/profile', isLoggedIn, (req, res) => {
    res.render('profile');
 });  

  router.get('/logout',isLoggedIn, (req, res) => {
    req.logOut(); // una vez que ya no estare el usuario 
    res.redirect('/signin2'); // se redireccionara a esta vista
  });


module.exports = router;

