angular.module('dojApp.controllers', []);

angular.module('dojApp.controllers').controller('ApplicationController', function($scope, USER_ROLES, AUTH_EVENTS, AuthService, UserService, Session){
	$scope.currentUser = null;
	$scope.userRoles = USER_ROLES;
	
	$scope.$on(AUTH_EVENTS.loginSuccess, function(event, args){
		console.log('fetching user data');
		UserService.getUser(Session.userid).then(function(resp){
			$scope.currentUser = resp.data.user;
		});
	});
	
	$scope.logout = function(){
		AuthService.logout();
		$scope.currentUser = null;
	}
});

angular.module('dojApp.controllers').controller('HomeController', function($scope){
	$scope.message = 'Welcome to DOJ!';
});

angular.module('dojApp.controllers').controller('LoginController', function($scope, $rootScope, AUTH_EVENTS, AuthService){
	
	$scope.credentials = {
		username: '',
		password: ''
	};
	
	$scope.login = function(credentials){
		AuthService.login(credentials).then(function(){
			console.log('success');
			$rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
		}, function(){
			console.log('fail');
			$rootScope.$broadcast(AUTH_EVENTS.loginFailed);
		});
	}
	
});