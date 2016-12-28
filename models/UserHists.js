var mongoose = require('mongoose');

var UserHistSchema = new mongoose.Schema({
	user_id: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	created_at: {type: Date, default: Date.now},
	action: String,
	comment: String
});

UserHistSchema.methods.userLogin = function(user_id, cb) {
	this.user_id = user_id;
	this.created_at = new Date();
	this.action = 'Login';
	this.comment = '';

	this.save(cb);
};


mongoose.model('UserHist', UserHistSchema);
