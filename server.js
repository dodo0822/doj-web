var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var errorhandler = require('errorhandler');
var methodOverride = require('method-override');
var uuid = require('node-uuid');
var path = require('path');

// ===== schema

var Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost/doj');

var userSchema = new Schema({
	username	: String,
	password	: String,
	email		: String,
	role		: { type: String, default: 'user' }
});

var tokenSchema = new Schema({
	token		: String,
	user		: { type: Schema.Types.ObjectId, ref: 'User' },
	createDate	: { type: String, default: Date.now }
});

var problemSchema = new Schema({
	name		: String,
	description	: String,
	input		: String,
	output		: String,
	createDate	: { type: String, default: Date.now },
	updateDate	: { type: String, default: Date.now },
	author		: { type: Schema.Types.ObjectId, ref: 'User' }
});

var submissionSchema = new Schema({
	problem		: { type: Schema.Types.ObjectId, ref: 'Problem' },
	createDate	: { type: String, default: Date.now },
	judgeStatus	: String,
	message		: String,
	submitter	: { type: Schema.Types.ObjectId, ref: 'User' }
});

tokenSchema.methods.hasExpired = function(){
	var now = new Date();
	return (now - createDate) > 2;
};

var User		= mongoose.model('User', userSchema);
var Token		= mongoose.model('Token', tokenSchema);
var Problem		= mongoose.model('Problem', problemSchema);
var Submission	= mongoose.model('Submission', submissionSchema);

// ===== util functions

function collectObject(){
	var ret = {};
	var len = arguments.length;
	for(var i = 0; i < len; ++i){
		for(p in arguments[i]){
			if(arguments[i].hasOwnProperty(p)){
				ret[p] = arguments[i][p];
			}
		}
	}
	return ret;
}

function sendError(res, msg, code){
	code = typeof code !== 'undefined' ? code : 500;
	res.status(code).send({
		'status'	: 'error',
		'message'	: msg
	});
}

function sendOk(res, payload){
	var obj = { 'status': 'ok' };
	var ret = collectObject(obj, payload);
	res.send(ret);
}

function sendUnauth(res){
	sendError(res, 'sorry, you are not authorized.', 401);
}

function sendForbidden(res){
	sendError(res, 'sorry, but you don\'t have the permission.', 403);
}

function getNow(){
	return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

function isAuthGet(req, res, success){
	Token.findOne({ user: req.query.userid, token: req.query.token }, function(err, token){
		if(token === null){
			sendUnauth(res);
		} else {
			req['userid'] = token.user;
			return success();
		}
	});
}

function isAdminGet(req, res, success){
	Token.findOne({ user: req.query.userid, token: req.query.token }).populate('user').exec(function(err, token){
		if(token.user.role !== 'admin'){
			sendForbidden(res);
		} else {
			return success();
		}
	});
}

function isAuthPost(req, res, success){
	Token.findOne({ user: req.body.userid, token: req.body.token }, function(err, token){
		if(token === null){
			sendUnauth(res);
		} else {
			req['userid'] = token.user;
			return success();
		}
	});
}

function isAdminPost(req, res, success){
	Token.findOne({ user: req.body.userid, token: req.body.token }).populate('user').exec(function(err, token){
		if(token.user.role !== 'admin'){
			sendForbidden(res);
		} else {
			return success();
		}
	});
}

// ===== express

var app = express();

app.use(bodyParser());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next){
	console.log('%s [%s] %s', getNow(), req.method, req.url);
	next();
});

app.get('/api', function(req, res){
	res.send('DOJ api is running');
});

app.post('/api/user', function(req, res, next){
	var user = new User({
		username	: req.body.username,
		password	: req.body.password,
		email		: req.body.email
	});
	user.save(function(err, obj){
		if(err) return next(err);
		sendOk(res, {
			message	: 'successfully saved',
			user	: {
				username	: req.body.username,
				password	: req.body.password,
				email		: req.body.email,
				id			: obj._id
			}
		});
	});
});

app.get('/api/user/:id', function(req, res, next){
	User.findOne({ '_id': req.params.id }, function(err, user){
		if(err) return next(err);
		if(user === null){
			sendError(res, 'user not found');
		} else {
			sendOk(res, { user: {
				'username'	: user.username,
				'email'		: user.email,
				'role'		: user.role
			}});
		}
	});
});

app.post('/api/login', function(req, res, next){
	User.findOne({ username: req.body.username, password: req.body.password }, function(err, user){
		if(user === null){
			sendError(res, 'user not found', 401);
		} else {
			var tokStr = uuid.v4();
			var tok = new Token({ token: tokStr, user: user._id });
			tok.save(function(err){
				sendOk(res, {
					'userid': user._id,
					'token'	: tokStr
				});
			});
		}
	});
});

app.get('/api/logout', isAuthGet, function(req, res, next){
	Token.findOne({ user: req.query.userid, token: req.query.token }, function(err, token){
		if(err) return next(err);
		token.remove(function(err){
			if(err) return next(err);
			sendOk(res, {
				'message': 'successfully logged out'
			});
		});
	});
});

app.post('/api/problem', isAuthPost, isAdminPost, function(req, res, next){
	var prob = new Problem({
		name		: req.body.name,
		description	: req.body.description,
		input		: req.body.input,
		output		: req.body.output,
		author		: req.userid
	});
	prob.save(function(err, obj){
		if(err) return next(err);
		sendOk(res, {
			'message': 'successfully saved',
			'id': obj._id
		});
	});
});

app.get('/api/problem', function(req, res, next){
	Problem.find(function(err, prob){
		if(err) return next(err);
		var problems = [];
		prob.forEach(function(problem){
			var p = {
				name	: problem.name,
				author	: problem.author,
				id		: problem._id
			};
			problems.push(p);
		});
		sendOk(res, {problems: problems});
	});
});

app.get('/api/problem/:id', function(req, res, next){
	Problem.findOne({ '_id': req.params.id }).populate('author').exec(function(err, prob){
		if(err) return next(err);
		if(prob === null){
			sendError(res, 'problem not found');
		} else {
			sendOk(res, { problem: {
				'name'			: prob.name,
				'description'	: prob.description,
				'input'			: prob.input,
				'output'		: prob.output,
				'createDate'	: prob.createDate,
				'updateDate'	: prob.updateDate,
				'author'		: prob.author
			}});
		}
	});
});

app.use(function(err, req, res, next){
	console.error(err.stack);
	sendError(res, 'unknown error');
});

app.listen(4242);
