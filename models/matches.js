const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const resultSchema = new Schema({
    parent: {
        type: String,
        requried: true
    },
    child: {
        type: String,
        required: true
    }
})

const responseSchema = new Schema({
    parent: {
        type: String,
        required: true
    },
    children: [{
        type: String,
        required: true
    }]
}, {
    timestamps: true
});

const matchSchema = new Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    solved: {
      type: Boolean,
      default: false  
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    set1label: {
        type: String,
        default: 'Set 1'
    },
    set1items: {
        type: [{
            type: String,
            required: true
        }]
    },
    set2label: {
        type: String,
        default: 'Set 2'
    },
    set2items: {
        type: [{
            type: String,
            required: true
        }]
    },
    response: [responseSchema],
    result: [resultSchema]
}, {
    timestamps: true
});

var Matches = mongoose.model('Match', matchSchema);
module.exports = Matches;