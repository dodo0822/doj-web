angular.module('dojApp.controllers', ['growlNotifications', 'ngSanitize', 'ngCookies']);

angular.module('dojApp.controllers').controller('ApplicationController', function($scope, AUTH_EVENTS, AuthService, UserService, Session, $location, growlNotifications, $cookies){
	$scope.currentUser = null;
	$scope.loggedIn = false;
	$scope.isAdmin = false;
	
	$scope.init = function(){
		if($cookies.token !== undefined){
			// Fetch user data from server.
			Session.create($cookies.token, $cookies.userid);
			UserService.getUser(Session.userid).then(function(resp){
				$scope.currentUser = resp.data.user;
				if($scope.currentUser.role === 'admin') $scope.isAdmin = true;
				else $scope.isAdmin = false;
				$scope.loggedIn = true;
			});
		}
	};
	
	$scope.$on(AUTH_EVENTS.loginSuccess, function(event, args){
		UserService.getUser(Session.userid).then(function(resp){
			$scope.currentUser = resp.data.user;
			if($scope.currentUser.role === 'admin') $scope.isAdmin = true;
			else $scope.isAdmin = false;
			$scope.loggedIn = true;
			
			$cookies.token = Session.token;
			$cookies.userid = Session.userid;
		});
		growlNotifications.add('Successfully logged in.');
	});
	
	$scope.$on(AUTH_EVENTS.logoutSuccess, function(event, args){
		$scope.loggedIn = false;
		$scope.isAdmin = false;
		growlNotifications.add('Successfully logged out.');
		delete $cookies.token;
		delete $cookies.userid;
	});
	
	$scope.logout = function(){
		AuthService.logout();
		$scope.currentUser = null;
		$scope.$broadcast(AUTH_EVENTS.logoutSuccess);
		$location.path("/");
	};
	
	$scope.go = function(target){
		$location.path(target);
	};
});

angular.module('dojApp.controllers').controller('HomeController', function($scope){
	$scope.message = 'Welcome to DOJ!';
});

angular.module('dojApp.controllers').controller('ProblemListController', function($scope, ProblemService){
	
	$scope.problems = [];
	
	$scope.init = function(){
		ProblemService.getProblemList().then(function(resp){
			$scope.problems = resp.data.problems;
		});
	};
	
});

angular.module('dojApp.controllers').controller('ProblemAddController', function($scope){
	$scope.message = 'Welcome to DOJ!';
});

angular.module('dojApp.controllers').controller('LoginController', function($scope, $rootScope, AUTH_EVENTS, AuthService, $location){
	
	$scope.credentials = {
		username: '',
		password: ''
	};
	
	$scope.message = '';
	
	$scope.login = function(credentials){
		AuthService.login(credentials).then(function(){
			console.log('success');
			$location.path("/");
			$rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
		}, function(){
			console.log('fail');
			$scope.message = 'Login failed!';
			$rootScope.$broadcast(AUTH_EVENTS.loginFailed);
		});
	}
	
});