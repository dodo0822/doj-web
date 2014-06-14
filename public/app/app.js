var dojApp = angular.module('dojApp', ['ngRoute', 'dojApp.controllers']);

dojApp.config(['$routeProvider', function($routeProvider){

	$routeProvider.
		when('/home', {
			templateUrl: 'app/views/home.html',
			controller: 'HomeController'
		}).
		when('/login', {
			templateUrl: 'app/views/login.html',
			controller: 'LoginController'
		}).
		otherwise({
			redirectTo: '/home'
		});

}]);

dojApp.constant('AUTH_EVENTS', {
	loginSuccess: 'auth-login-success',
	loginFailed: 'auth-login-failed',
	logoutSuccess: 'auth-logout-success'
});

dojApp.constant('USER_ROLES', {
	all: '*',
	admin: 'admin',
	user: 'user'
});

dojApp.service('Session', function(){
	
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

dojApp.factory('AuthService', function($http, Session){
	return {
		
		login: function(credentials){
			return $http.post('/api/login', credentials).then(function(resp){
				Session.create(resp.data.token, resp.data.userid, 'admin');
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

dojApp.factory('UserService', function($http){
	return {
		
		getUser: function(id){
			return $http.post('/api/user/' + id);
		}
		
	};
});