angular.module('dojApp.services', []);

angular.module('dojApp.services').service('Session', function(){
	
	this.create = function(token, userid){
		console.log('session created');
		this.token = token;
		this.userid = userid;
	};
	
	this.destroy = function(){
		this.token = null;
		this.userid = null;
	};
	
	return this;
	
});

angular.module('dojApp.services').factory('AuthService', function($http, Session){
	return {
		
		login: function(credentials){
			return $http.post('/api/login', credentials).then(function(resp){
				Session.create(resp.data.token, resp.data.userid);
			});
		},
		
		logout: function(){
			Session.destroy();
		},
		
		isAuthenticated: function(){
			return !!Session.userid;
		}
		
	};
});

angular.module('dojApp.services').factory('UserService', function($http){
	return {
		
		getUser: function(id){
			return $http.post('/api/user/' + id);
		}
		
	};
});

angular.module('dojApp.services').factory('ProblemService', function($http){
	return {
	
		getProblemList: function(){
			return $http.get('/api/problem');
		}
	
	};
});