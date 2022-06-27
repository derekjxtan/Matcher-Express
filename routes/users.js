var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authenticate = require('../authenticate');
const User = require('../models/users');

var router = express.Router();
router.use(bodyParser.json());

/* GET users listing. */
router.get('/', authenticate.verifyUser, authenticate.verifyAdmin, function(req, res, next) {
  User.find({})
  .then((users) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(users);
  }, (err) => next(err))
  .catch((err) => next(err));
});

// Register
router.post('/register', (req, res, next) => {
  User.register(new User({username: req.body.username}), req.body.password, (err, user) => {
    if (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
    }
    else {
      user.save((err, user) => {
        if (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.json({err: err});
          return;
        }
        passport.authenticate('local')(req, res, () => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({success: true, status: "Registration successful"});
        })
      })
    }
  });
});

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.json({sucesss: false, status: "Login Unsuccessful", err: info});
    }
    req.logIn(user, (err) => {
      if (err) {
        res.statusCode = 401;
        res.setHeader("Content-Type", "application/json");
        res.json({sucesss: false, status: "Login Unsuccessful", err: "Could not log in user!"});
        return;
      }
      var token = authenticate.getToken({_id: req.user._id});
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json({success: true, token: token, status: "You are sucessfully logged in"});
    });
  }) (req, res, next);
});

router.get('/checkJWTtoken', (req, res) => {
  passport.authenticate('jwt', {session: false}, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.json({sucesss: false, status: "JWT invalid", err: info});
    }
    else {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json({sucesss: true, status: "JWT valid", user: user});
    }
  }) (req, res);
})

// Logout
router.get('/logout', (req, res, next) => {
  if (req.session) {
    req.session.destroy();
    res.clearCookie('session-id');
    res.redirect('/');
  }
  else {
    var err = new Error('You are not logged in');
    err.status = 403;
    next(err);
  }
});

module.exports = router;
