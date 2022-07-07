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
            req.body.set1items = req.body.set1items.trim().split('\n');
            req.body.set2items = req.body.set2items.trim().split('\n');
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
                    req.body.set1items = req.body.set1items.trim().split('\n');
                    req.body.set2items = req.body.set2items.trim().split('\n');
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

matchRouter.route('/:matchId/response')
    .options(cors.corsWithOptions, (req, res) => {res.sendStatus(200)})
    // Not supported
    .get(cors.cors, (req, res, next) => {
        res.statusCode = 403;
        res.end('GET operation not supported on /matches/' + req.params.matchId + '/response');
    })
    // post a new response to the database
    .post(cors.corsWithOptions, (req, res, next) => {
        Matches.findById(req.params.matchId)
        .then((match) => {
            match.response.push(req.body);
            match.save()
            .then((match) => {
                Matches.findById(match._id)
                .then((match) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(match);
                });
            })
            .catch((err) => next(err));
        })
        .catch((err) => next(err));
    })
    // not supported
    .put(cors.corsWithOptions, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /matches/' + req.params.matchId + '/response');
    })
    // delete all existing responses
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Matches.findById(req.params.matchId)
        .then((match) => {
            if (!match) {
                var err = new Error('Match ' + req.params.matchId + ' not found');
                err.status = 404;
                return next(err);
            }
            else {
                if (match.creator.equals(req.user._id)) {
                    match.response = [];
                    match.save()
                    .then((match) => {
                        Matches.findById(match._id)
                        .then((match) => {
                            res.statusCode = 200,
                            res.setHeader('Content-Type', 'application/json');
                            res.json(match);
                        });
                    });
                }
                else {
                    var err = new Error('You are not authorized to delete this comment!');
                    err.status = 403;
                    return next(err);
                }
            }
        })
        .catch((err) => next(err));
    });

matchRouter.route('/:matchId/response/:responseId')
    .options(cors.cors, (req, res) => {res.sendStatus(200)})
    .get(cors.cors, (req, res, next) => {
        res.statusCode = 403;
        res.end('GET operation not supported on /matches/' + req.params.matchId + '/response/' + req.params.responseId);
    })
    .post(cors.corsWithOptions, (req, res, next) => {
        res.statusCode = 403;
        res.end('POST operation not supported on /matches/' + req.params.matchId + '/response/' + req.params.responseId);
    })
    .put(cors.corsWithOptions, (req, res, next) => {
        Matches.findById(req.params.matchId)
        .then((match) => {
            if (match) {
                match.response.pull({_id: req.params.responseId});
                match.response.push(req.body);
                match.save()
                .then((match) => {
                    Matches.findById(match._id)
                    .then((match) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(match);
                    });
                });
            }
            else {
                var err = new Error("Match not found");
                err.status = 404;
                next(err);
                return
            }
        })
        .catch((err) => next(err));
    })
    .delete(cors.corsWithOptions, (req, res, next) => {
        Matches.findById(req.params.matchId)
        .then((match) => {
            if (match) {
                match.response.pull({_id: req.params.responseId});
                match.save()
                .then((match) => {
                    Matches.findById(match._id)
                    .then((match) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(match);
                    });
                });
            }
            else {
                var err = new Error("Match not found");
                err.status = 404;
                next(err);
                return
            }
        })
        .catch((err) => next(err));
    });

matchRouter.route('/:matchId/result')
    .options(cors.cors, (req, res) => {res.sendStatus(200)})
    // generate results
    // Algorithm used: min-cut max-flow
    .get(cors.corsWithOptions, (req, res, next) => {

        class Node{
            constructor(value, position) {
                this.neighbours = [];
                this.value = value;
                this.position = position;
            }

            addNeighbour(neighbour) {
                this.neighbours.push(neighbour);
            }
        };

        Matches.findById(req.params.matchId)
        .then((match) => {
            match.result = [];
            var leftDict = {}, rightDict = {};
            var left = [], right = [];
            // read from set 1 and set 2 to generate graph nodes
            for (var i = 0; i < match.set1items.length; i++) {
                newNode = new Node(match.set1items[i], i);
                left.push(newNode);
                leftDict[match.set1items[i]] = newNode;
            };
            for (var i = 0; i < match.set2items.length; i++) {
                newNode = new Node(match.set2items[i], i);
                right.push(newNode);
                rightDict[match.set2items[i]] = newNode;
            };
            // read from match.response to generate graph
            for (var i = 0; i < match.response.length; i++) {
                var parent = leftDict[match.response[i].parent];
                for (var j = 0; j < match.response[i].children.length; j++) {
                    parent.addNeighbour(rightDict[match.response[i].children[j]]);
                };
            };
            // TODO:
            // use max flow min cut algo to produce result
            const results = maxBipartiteMatch(left, right);
            // push result into match.result and return match
            for (var i = 0; i < results.length; i++) {
                if (results[i] !== null) {
                    match.result.push({parent: results[i].value, child: right[i].value});
                };
            };
            match.solved = true;
            // save result
            match.save()
            .then((match) => {
                Matches.findById(match._id)
                .then((match) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(match);
                });
            });
        })
        .catch((err) => next(err));
    })
    // not supported
    .post(cors.corsWithOptions, (req, res, next) => {
        res.statusCode = 403;
        res.end('POST operation not supported on /matches/' + req.params.matchId + '/result');
    })
    // not supported
    .put(cors.corsWithOptions, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /matches/' + req.params.matchId + '/result');
    })
    // not supported
    .delete(cors.corsWithOptions, (req, res, next) => {
        res.statusCode = 403;
        res.end('DELETE operation not supported on /matches/' + req.params.matchId + '/result');
    })

function maxBipartiteMatch(leftArray, rightArray) {
    // Keep track of matching result
    let matchResult = new Array(rightArray.length);
    for (var i = 0; i < rightArray.length; i++) {
        matchResult[i] = null;
    };
    for (var j = 0; j < leftArray.length; j++) {
        // keep track of which node have been visited
        let visited = new Array(rightArray.length);
        // reset all node to not visited
        for (var k = 0; k < rightArray.length; k++) {
            visited[k] = null;
        }
        // run depth first search of each node to generate pairing
        dfs(leftArray[j], visited, matchResult);
    };

    return matchResult;
};

function dfs(node, visited, matchResult) {
    // loop through all neighbours of node
    for (var i = 0; i < node.neighbours.length; i++) {
        // check whether neighbour has been visited
        var neighbourPos = node.neighbours[i].position;
        if (visited[neighbourPos] === null) {
            // mark neighbour as visited
            visited[neighbourPos] = true;
            // if neighbour has not been assigned a match or if initially assigned match has another option,
            // assign match to neighbour and return true
            if (matchResult[neighbourPos] === null || 
                dfs(matchResult[neighbourPos], visited, matchResult)) {
                    matchResult[neighbourPos] = node;
                    return true;
            };
        };
    }
    return false;
};

module.exports = matchRouter;