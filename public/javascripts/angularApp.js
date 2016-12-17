var app = angular.module('flapperNews', ['ui.router']);

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {
        $stateProvider.state('home', {
            url: '/home',
            templateUrl: '/home.html',
            controller: 'MainController',
            resolve: {
                postPromise: ['posts', function(posts){
                    return posts.getAll();
                }]
            }
        });

        $stateProvider.state('posts', {
            url: '/posts/{id}',
            templateUrl: '/posts.html',
            controller: 'PostsController'
        });

        $urlRouterProvider.otherwise('home');
    }
]);

app.controller('MainController', [
    '$scope',
    'posts',
    function($scope, posts){
        $scope.test = 'Hello World!';        
        $scope.posts = posts.posts;

        $scope.addPost = function() {
            if ($scope.title == '') return;
            $scope.posts.push({
                title: $scope.title,
                link: $scope.link, 
                upvotes: 0,
                comments: [
                    {author: 'Joe', body: 'Cool posts!', upvotes: 0},
                    {author: 'Bob', body: 'Great idea but everything is wrong!', upvotes: 0},
                ]
            });
            $scope.title = '';
            $scope.link = '';
        }

        $scope.incrementUpvotes = function(post) {
            post.upvotes += 1;
        }
    }
]);

app.controller('PostsController', [
    '$scope',
    '$stateParams',
    'posts',
    function($scope, $stateParams, posts) {
        $scope.post = posts.posts[$stateParams.id];

        $scope.addComment = function() {
            if ($scope.body === '') return;
            if ($scope.post.comments === undefined)
                $scope.post.comments = [];
            $scope.post.comments.push({
                body: $scope.body,
                author: 'user',
                upvotes: 0
            });
            $scope.body = '';
        }

        $scope.incrementUpvotes = function(comment) {
            comment.upvotes += 1;
        }
    }
]);

app.factory('posts',[
    '$http',
    function($http){
        var o = {
            posts: [
                {title: 'post 1', upvotes: 5},
                {title: 'post 2', upvotes: 2},
                {title: 'post 3', upvotes: 15},
                {title: 'post 4', upvotes: 9},
                {title: 'post 5', upvotes: 4}
            ]
        };
        o.getAll = function() {
            return $http.get('/posts').then(function(response){
                angular.copy(response.data, o.posts);
            });
        }
        return o;
    }
]);