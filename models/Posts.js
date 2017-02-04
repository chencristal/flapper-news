var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
    title: String,
    link: String,
    author: String,
    content: String,
    created_at: { type: Date, default: Date.now },
    upvotes: { type: Number, default: 0 },
    comments: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'Comment'
    }],
    thumb: {
        type: mongoose.Schema.Types.ObjectId, ref: 'PostImage'
    }
});

PostSchema.methods.upvote = function(cb) {
    this.upvotes += 1;
    this.save(cb);
}

mongoose.model('Post', PostSchema);


var PostImageSchema = new mongoose.Schema({
    originalname: String,
    destination: String,
    filename: String,
    path: String,
    size: {type: Number, default: 0},
    created_at: { type: Date, default: Date.now }
});

mongoose.model('PostImage', PostImageSchema);