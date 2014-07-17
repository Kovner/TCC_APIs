//modules ==========================================

// ExpressJS 4.0 used for the middleware and web framework
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var flash = require('connect-flash');

var app = express();

app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser());
// ejs (embedded javascript) used as the template engine
app.engine('html', require('ejs').renderFile);
app.use(cookieParser('Ronaldinho'));
app.use(session());
app.use(flash());

//'database' of users
//Each user is a property in this object whose value is that user's pw.
// EG if a user's login is mike/hello then users['mike'] == "hello"
var users = {};

app.get('/', function(req,res) {
	res.render('login.ejs', {
		error: req.flash('error'),
		success: req.flash('success')
	});
});

app.get('/signup', function(req,res) {
	res.render('signup.ejs', {
		error: req.flash('error'),
		success: req.flash('success')
	});
});

app.post('/user', function(req,res) {
	if(req.body.user.length === 0) {
		req.flash('error', "please choose a username");
		res.redirect('/signup');
	} else if(req.body.pass.length === 0) {
		req.flash('error', "please choose a password");
	} else if(users[req.body.user]) {
		req.flash('error', 'user already exists');
		res.redirect('/signup');
	} else if(req.body.pass != req.body.conf) {
		req.flash('error', "password and pw confirmation don't match");
		res.redirect('/signup');
	} else {
		users[req.body.user] = req.body.pass;
		req.flash('success', "User added");
		res.redirect('/');
	}
});

app.post('/login', function(req,res) {
	if(req.body.password === users[req.body.user]) {
		req.session.user = req.body.user;
		res.redirect('/about');
	} else {
		req.flash('error', "Username or password incorrect.");
		res.redirect('/');
	}
});

app.get('/about', function(req, res) {
	res.render('aboutcompany.ejs');
});

var port = Number(process.env.PORT || 8001);
app.listen(port);
console.log("Listening on port " + port);