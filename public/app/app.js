var dojApp = angular.module('dojApp', ['ngRoute', 'dojApp.controllers', 'dojApp.services', 'dojApp.directives', 'ui.codemirror']);

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
		when('/problem', {
			templateUrl: 'app/views/problem_list.html',
			controller: 'ProblemListController'
		}).
		when('/problem/view/:id', {
			templateUrl: 'app/views/problem_view.html',
			controller: 'ProblemViewController'
		}).
		when('/problem/add', {
			templateUrl: 'app/views/problem_add.html',
			controller: 'ProblemAddController'
		}).
		when('/problem/solve/:id', {
			templateUrl: 'app/views/problem_solve.html',
			controller: 'ProblemSolveController'
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