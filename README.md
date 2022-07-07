# Matcher-Express
Back-end Server for Matcher app created using Express. Scaffold was created using Express generator. It is meant to be connected to a MongoDB database, and database models are created using mongoose.

 See Front-end react app [here](https://github.com/derekjxtan/Matcher-React)

## Details

### `Database Models`

Mongoose is used to create the schemas for Users and Matches. 

### Users: 

1. UserSchema

"admin" parameter is configured using mongoose, "username", "salt" and "hash" are handled by passport.

### Matches: 

1. MatchSchema

"creator" stores the id of the user that created the match from UserSchema. 

"solved" tracks where results have been generated for the match. 

"name", "description", "set1label", "set1items", "set2label", "set2items" are to be configured by creator upon creation. 

"response" stores an array of responses using ResponseSchema.

"result" stores an array of results using ResultSchema.

2. ResponseSchema

"parent" stores item from set 1, "children" stores array of items from set 2.

3. ResultSchema

"parent stores item from set 1, "child" stores item from set 2.

### `Routes`

### matchRouter.js

Contains most of the APIs used for this app. All APIs related to matches are here (e.g. creating, editing and deleting matches, submitting and deleting responses, generating results).

### users.js

Contains the APIS related to handling users (e.g. log-in, log-out, register new user, querying for all users).

### cors.js

Handles CORS activity.

### `Planned future improvement`

### 1. Allow for maximum utilisation of second set of items

Current implementation generates results by fully creating a single Maximum Bipartite Match. In some cases, where set 1 contains few items compared to set 2, most items in set 2 may be unutilised. An option would be provided to users to maximise usage of second set such that an item from set 1 can match to more than 1 item in set 2. 

Implementation idea: Generate a Maximum Bipartite Match and save this result. Removed the items in set 2 that were used. Repeat the process.

### 2. Allow for duplicate items in either set

Current implementation does not allow duplicate items to be in a single set. In some cases, duplicate items may be needed (e.g. Assigning people to job openings. One job may have mulitple openings and set 2 in this case would have duplicated jobs.)

Implementation idea: When there are duplicates, dictionary of set 2 items will store an array of nodes instead for a given key instead of only 1 node. When generating graph of matches, all of the nodes in the array will be connected to the item in set 1.
