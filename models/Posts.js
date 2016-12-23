var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
    title: String,
    link: String,
    created_at: { type: Date, default: Date.now },
    upvotes: { type: Number, default: 0 },
    comments: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'Comment'
    }]
});

PostSchema.methods.upvote = function(cb) {
    this.upvotes += 1;
    this.save(cb);
}

mongoose.model('Post', PostSchema);