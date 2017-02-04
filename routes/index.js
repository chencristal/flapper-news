var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var passport = require('passport');
var jwt = require('express-jwt');
var multer = require('multer');

// define models
var Post = mongoose.model('Post');
var PostImage = mongoose.model('PostImage');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');
var UserHist = mongoose.model('UserHist');

/*
The userPropery option specifies which property on 
 req to put our payload from our tokens. 
By default it's set on user but we're using payload 
 instead to avoid any conflicts with passport 
 (it shouldn't be an issue since we aren't using 
 both methods of authentication in the same request). 
This also avoids confusion since the payload isn't an instance of our User model.
*/
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './public/uploads/');
  },
  filename: function(req, file, cb) {
    var datetimestamp = Date.now();
    var filename = file.fieldname + '-' + datetimestamp + '.' + 
      file.originalname.split('.')[file.originalname.split('.').length - 1];
    cb(null, filename);
  }
});

var upload = multer({
  storage: storage
}).single('file');

// API path that will upload the files
router.post('/upload', function(req, res, next) {
  upload(req, res, function(err) {
    if (err) {
      res.json({error_code:1, err_desc:err});
      return;
    }

    var post = new Post({
      title: req.body.title,
      link: req.body.link,
      content: req.body.content,
      author: req.body.author,
    });

    var file = new PostImage({
      originalname: req.file.originalname,
      destination: req.file.destination,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
    });

    file.save(function(err, file){
      if (err) { return next(err); }

      post.thumb = file._id;
      post.save(function(err, post){
        if (err) { return next(err); }
        console.log(post);
      });
    });

    res.json({error_code:0, err_desc:null});
  });
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.param('post', function(req, res, next, id) {
  var query = Post.findById(id);

  query.exec(function(err,post){
    if (err) { return next(err); }
    if (!post) { return next(new Error('cannot find post')); }

    req.post = post;
    return next();
  });
});

router.param('comment', function(req, res, next, id) {
  var query = Comment.findById(id);

  query.exec(function(err, comment) {
    if (err) { return next(err); }
    if (!comment) { return next(new Error('cannot find comment')); }

    req.comment = comment;
    return next();
  });
});

// Return a list of posts and associated metadata
router.get('/posts', function(req, res, next) {
  Post
    .find()
    .populate('thumb')
    .exec(function(err, posts){
      if (err) { return next(err); }
      
      console.log(posts);
      res.json(posts);
    });
});

// Get individual post by Id
router.get('/posts/:post', function(req, res, next) {
  req.post.populate('comments', function(err, post) {
    if (err) { return next(err); }
    res.json(post);
  });
});

// Create a new post (require auth)
router.post('/posts', auth, function(req, res, next) {
  var post = new Post(req.body);
  post.author = req.payload.username;   // set the author field when creating posts
  console.log(post);

  post.save(function(err, post){
    if (err) { return next(err); }
    res.json(post);
  });
});


// Add a comment to the post (require auth)
router.post('/posts/:post/comments', auth, function(req, res, next) {
  var comment = new Comment(req.body);
  comment.post = req.post;
  comment.author = req.payload.username;  // set the author field when creating comments

  comment.save(function(err, comment) {
    if (err) { return next(err); }

    req.post.comments.push(comment);
    req.post.save(function(err, post) {
      if (err) { return next(err); }

      res.json(comment);
    });
  });
});


// Upvote the post (require auth)
router.put('/posts/:post/upvote', auth, function(req, res, next) {
  req.post.upvote(function(err, post) {
    if (err) { return next(err); }

    res.json(post);
  });
});

// Upvote the comment (require auth)
router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next) {
  req.comment.upvote(function(err, comment) {
    if (err) { return next(err); }

    res.json(comment);
  });
});


// Register a new user account
router.post('/register', function(req, res, next){
  if (!req.body.username || !req.body.password || !req.body.email) {
    return res.status(400).json({message: 'Please fill out all fields'});
  }
  else if (req.body.username.length < 4) {
    return res.status(400).json({message: 'The username must be at least 4 characters.'});
  }

  var user = new User();
  user.username = req.body.username;
  user.email = req.body.email;
  user.setPassword(req.body.password);

  user.save(function(err) {
    if (err) { return next(err); }

    return res.json({token: user.generateJWT()});
  });
});


// Login account
router.post('/login', function(req, res, next) {
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  // this middleware uses the LocalStrategy we created earlier
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }

    if (user) {
      var login_hist = new UserHist();
      login_hist.userLogin(user._id, function(err, userhist) {
        if (err) { console.error(err); }
      });
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});


module.exports = router;
