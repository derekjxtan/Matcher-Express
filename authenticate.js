const User = require('./models/users');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');

const config = require('./config');

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

exports.getToken = (user) => {
    return jwt.sign(user, config.secretKey, {expiresIn: config.tokenExpiry});
};

var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

exports.jwtPassport = passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    User.findOne({_id: jwt_payload._id}, (err, user) => {
        // err in authentication
        if (err) {
            return done(err, false);
        }
        // user found
        if (user) {
            return done(null, user);
        }
        // no err in authentication, but user doesn't exist
        else {
            return done(null, false);
        }
    });
}));

exports.verifyUser = passport.authenticate('jwt', {session: false});

exports.verifyAdmin = function(req, res, next) {
    if (req.user.admin) {
        return next();
    }
    else {
        var err = new Error("You are not authorized to perform this operation");
        err.status = 403;
        return next(err);
    }
}