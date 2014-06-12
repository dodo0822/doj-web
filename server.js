var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var errorhandler = require('errorhandler');
var methodOverride = require('method-override');
var uuid = require('node-uuid');

// ===== schema

var Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost/doj');

var userSchema = new Schema({
	username	: String,
	password	: String,
	email		: String
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

function sendError(res, msg){
	res.send({
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
	sendError(res, 'sorry, you are not authorized.');
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

// ===== express

var app = express();

app.use(bodyParser());
app.use(methodOverride());

app.use(function(req, res, next){
	console.log('%s [%s] %s', getNow(), req.method, req.url);
	next();
});

app.get('/api', function(req, res){
	res.send('DOJ api is running');
});

app.post('/api/user/login', function(req, res){
	console.log('POST /api/user/login ->');
	console.log(req.body);
	User.findOne({ username: req.body.username, password: req.body.password }, function(err, user){
		if(user === null){
			sendError(res, 'user not found');
		} else {
			var tokStr = uuid.v4();
			var tok = new Token({ token: tokStr, user: user._id });
			tok.save(function(err){
				sendOk(res, {
					'userid'	: user._id,
					'token'		: tokStr
				});
			});
		}
	});
});

app.get('/api/user/logout', isAuthGet, function(req, res){
	console.log('GET /api/user/logout ->');
	console.log(req.query);
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

app.post('/api/problem', isAuthPost, function(req, res){
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

app.get('/api/problem/:id', function(req, res){
	Problem.findOne({ '_id': req.params.id }, function(err, prob){
		if(err) return next(err);
		if(prob === null){
			sendError(res, 'problem not found');
		} else {
			sendOk(res, {
				'name'			: prob.name,
				'description'	: prob.description,
				'input'			: prob.input,
				'output'		: prob.output,
				'createDate'	: prob.createDate,
				'updateDate'	: prob.updateDate,
				'author'		: prob.author
			});
		}
	});
});

app.use(function(err, req, res, next){
	console.error(err.stack);
	sendError(res, 'unknown error');
});

app.listen(4242);