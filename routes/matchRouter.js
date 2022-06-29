const express = require('express');
const bodyParser = require('body-parser');
const authenticate = require('../authenticate');
const User = require('../models/users');
const Matches = require('../models/matches');
const cors = require('./cors');

var matchRouter = express.Router();
matchRouter.use(bodyParser.json());

matchRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => {res.sendStatus(200);})
    // get all matches created by current user
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Matches.find({creator: req.user._id})
        .populate('creator')
        .then((matches) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(matches);
        }, (err) => next(err))
        .catch((err) => next(err));
    })
    // create new match for current user
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        if (req.body != null) {
            // set creator field of req
            req.body.creator = req.user._id;
            // convert string of setitems into an array
            req.body.set1items = req.body.set1items.split('\n');
            req.body.set2items = req.body.set2items.split('\n');
            Matches.create(req.body)
            .then((match) => {
                Matches.findById(match._id)
                .populate('creator')
                .then((match) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(match);
                })
            }, (err) => next(err))
            .catch((err) => next(err));
        }
        else {
            var err = new Error('Match not found request body');
            err.status = 404;
            next(err);
        }
    })
    // PUT not allowed for this route
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /matches');
    })
    // delete all of current user's matches
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Matches.deleteMany({creator: req.user._id})
        .then((resp) => {
            res.statusCode = 200,
            res.setHeader('Content-Type', 'application/json');
            res.json(resp);
        }, (err) => next(err))
        .catch((err) => next(err));
    });

matchRouter.route('/:matchId')
    .options(cors.corsWithOptions, (req, res) => {res.sendStatus(200)})
    // get match with matchId
    .get(cors.cors, (req, res, next) => {
        Matches.findById(req.params.matchId)
        .then((match) => {
            res.statusCode = 200,
            res.setHeader('Content-Type', 'application/json');
            res.json(match);
        }, (err) => next(err))
        .catch((err) => next(err));
    })
    // POST not allowed for this route
    .post(cors.corsWithOptions, (req, res, next) => {
        res.statusCode = 403;
        res.end('POST operation not supported on /matches');
    })
    // update a particular match
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Matches.findById(req.params.matchId)
        .then((match) => {
            if (match != null) {
                if (!match.creator.equals(req.user._id)) {
                    var err = new Error('You are not authorized to update this comment!');
                    err.status = 403;
                    return next(err);
                }
                else {
                    Matches.findByIdAndUpdate(match._id, {
                        $set: req.body
                    }, {new: true})
                    .then((match) => {
                        Matches.findById(match._id)
                        .then((match) => {
                            res.statusCode = 200,
                            res.setHeader('Content-Type', 'application/json');
                            res.json(match);
                        });
                    });
                }
            }
            else {
                var err = new Error('Match ' + req.params.matchId + ' not found');
                err.status = 404;
                return next(err);
            }
        }, (err) => next(err))
        .catch((err) => next(err));
    })
    // delete a particular match
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Matches.findById(req.params.matchId)
        .then((match) => {
            if (match != null) {
                if (!match.creator.equals(req.user._id)) {
                    var err = new Error('You are not authorized to delete this comment!');
                    err.status = 403;
                    return next(err);
                }
                else {
                    Matches.findByIdAndDelete(match._id)
                    .then((resp) => {
                        res.statusCode = 200,
                        res.setHeader('Content-Type', 'application/json');
                        res.json(resp);
                    });
                }
            }
            else {
                var err = new Error('Match ' + req.params.matchId + ' not found');
                err.status = 404;
                return next(err);
            }
        }, (err) => next(err))
        .catch((err) => next(err));
    });

module.exports = matchRouter;