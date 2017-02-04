var app = angular.module('flapperNews', ['ui.router', 'ui.bootstrap', 'ngFileUpload']);

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('home', {
                url: '/home',
                templateUrl: '/partial/home.html',
                controller: 'MainController',
                resolve: {
                    postPromise: ['posts', function(posts) {
                        return posts.getAll();
                    }]
                }
            });

        $stateProvider.state('add_post', {
            url: '/add_post',
            templateUrl: '/partial/add_post.html',
            controller: 'NewPostController',
            onEnter: ['$state', 'auth', function($state, auth) {
                if (!auth.isLoggedIn()) {
                    $state.go('home');
                }
            }]
        });

        $stateProvider.state('posts', {
            url: '/posts/{id}',
            templateUrl: '/posts.html',
            controller: 'PostsController',
            resolve: {
                post: ['$stateParams', 'posts', function($stateParams, posts) {
                    return posts.get($stateParams.id);
                }]
            }
        });

        $stateProvider.state('login', {
            url: '/login',
            templateUrl: '/partial/login.html',
            controller: 'AuthCtrl',
            onEnter: ['$state', 'auth', function($state, auth) {
                if (auth.isLoggedIn()) {
                    $state.go('home');
                }
            }]
        })
        .state('register', {
            url: '/register',
            templateUrl: '/partial/register.html',
            controller: 'AuthCtrl',
            onEnter: ['$state', 'auth', function($state, auth) {
                if (auth.isLoggedIn()) {
                    $state.go('home');
                }
            }]
        })

        $urlRouterProvider.otherwise('home');
    }
]);

app.filter('startFrom', function(){
    return function(data, start) {
        return data.slice(start);
    }
})
.filter('contentLimit', function(){
    return function(content, limit) {
        if (!content) return '';
        
        if (content.length > limit + 10) {
            return content.substring(0, limit) + '...';
        } else {
            return content;
        }
    }
})
.directive('errSrc', function() {
    return {
        link: function(scope, element, attrs) {
            element.bind('error', function() {
                if (attrs.src != attrs.errSrc) {
                    attrs.$set('src', attrs.errSrc);
                }
            });
        }
    };
});

app.controller('NewPostController', [
    '$scope',
    'posts',
    'auth',
    'Upload',
    '$window',
    '$timeout',
    function ($scope, posts, auth, Upload, $window, $timeout) {
        $scope.addNewPost = function(form) {
            if (!$scope.title || $scope.title == '' ||
                !$scope.link || $scope.link == '' ||
                !$scope.content || $scope.content == '')
                return;

            // $scope.featured.upload = 
            Upload.upload({
                url: '/upload',
                method: 'POST',
                data: {
                    title: $scope.title,
                    link: $scope.link,
                    content: $scope.content,
                    author: auth.currentUser(),
                    file: $scope.featured,
                }
            }).then(function(resp) {    // upload function returns a promise
                if (resp.data.error_code == 0) {
                    $window.alert('Success ' + resp.config.data.file.name + ' uploaded. Response: ');
                    console.log(resp);
                } else {
                    $window.alert('an error occured');
                }
            }, function(resp) {     // catch error
                console.log('Error status: ' + resp.status);
                $window.alert('Error status: ' + resp.status);
            }, function(evt) {
                console.log(evt);
                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
                $scope.featured.progress = 'progress: ' + progressPercentage + '% ';
            });

            $scope.title = '';
            $scope.link = '';
            $scope.content = '';

            if (form) {
                form.$setPristine();
                form.$setUntouched();
            }
        };
    }
]);

app.controller('MainController', [
    '$scope',
    'posts',
    'auth',
    function($scope, posts, auth) {
        $scope.posts = posts.posts;
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.pageSize = 5;
        $scope.currentPage = 1;

        $scope.addPost = function() {
            if (!$scope.title || $scope.title == '') return;
            posts.create({
                title: $scope.title,
                link: $scope.link
            });
            $scope.title = '';
            $scope.link = '';
        };

        $scope.incrementUpvotes = function(post) {
            posts.upvote(post);
        };
    }
]);

app.controller('PostsController', [
    '$scope',
    'posts',
    'post',
    'auth',
    function($scope, posts, post, auth) {
        $scope.post = post;
        $scope.isLoggedIn = auth.isLoggedIn;
        
        $scope.addComment = function() {
            if (!$scope.body || $scope.body === '') return;
            if ($scope.post.comments === undefined)
                $scope.post.comments = [];
            posts.addComment(post._id, {
                body: $scope.body,
                author: 'user'
            }).then(function(response){
                $scope.post.comments.push(response.data);
            });
            $scope.body = '';
        };

        $scope.incrementUpvotes = function(comment) {
            posts.upvoteComment(post, comment);
        };
    }
]);

app.controller('AuthCtrl', [
    '$scope',
    '$state',
    'auth',
    function($scope, $state, auth) {
        $scope.user = {};

        $scope.register = function() {
            if (!$scope.user.username || !$scope.user.email || !$scope.user.password) {
                $scope.error = {
                    message: 'Please fill out all fields.'
                };
                return;
            }
            else if ($scope.user.username.length < 4) {
                $scope.error = {
                    message: 'The username must be at least 4 characters.'
                };
                return;
            }

            auth.register($scope.user).then(function(response){
                auth.saveToken(response.data.token);
                $state.go('home');
            }, function(error){
                $scope.error = error.data;
            });
        };

        $scope.logIn = function() {
            auth.logIn($scope.user).then(function(response){
                auth.saveToken(response.data.token);
                $state.go('home');
            }, function(error){
                $scope.error = error.data;
            })
        };
    }
]);

app.controller('NavCtrl', ['$scope', 'auth', function($scope, auth){
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.currentUser = auth.currentUser;
    $scope.logOut = auth.logOut;
}]);


// use the service to share the data in several controllers
app.factory('posts', ['$http', 'auth', function($http, auth){
    var o = {
        posts: []
    };
    o.getAll = function() {
        return $http.get('/posts').then(function(response){
            angular.copy(response.data, o.posts);
        });
    };
    o.create = function(post) {
        return $http.post('/posts', post, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        }).then(function(response){
            o.posts.push(response.data);
        });
    };
    o.upvote = function(post) {
        return $http.put('/posts/' + post._id + '/upvote', null, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        }).then(function(response){
            post.upvotes += 1;
        });
    };
    o.get = function(id) {
        return $http.get('/posts/' + id).then(function(response){
            return response.data;
        });
    };
    o.addComment = function(id, comment) {
        return $http.post('/posts/' + id + '/comments', comment, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        });
    };
    o.upvoteComment = function(post, comment) {
        return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote', null, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        }).then(function(response){
            comment.upvotes += 1;
        });
    };
    return o;
}]);

// auth factory
app.factory('auth', ['$http', '$window', function($http, $window){
    var auth = {};

    auth.saveToken = function(token) {
        $window.localStorage['flapper-news-token'] = token;
    };
    auth.getToken = function() {
        return $window.localStorage['flapper-news-token'];
    };
    auth.isLoggedIn = function() {
        var token = auth.getToken();

        if (token) {
            var payload = JSON.parse($window.atob(token.split('.')[1]));
            return payload.exp > Date.now() / 1000;
        } else {
            return false;
        }
    }

    auth.currentUser = function() {
        if (auth.isLoggedIn()) {
            var token = auth.getToken();
            var payload = JSON.parse($window.atob(token.split('.')[1]));

            return payload.username;
        } 
        else {
            return '';
        }
    }

    auth.register = function(user) {
        return $http.post('/register', user);
    }

    auth.logIn = function(user) {
        return $http.post('/login', user);
    }

    auth.logOut = function() {
        $window.localStorage.removeItem('flapper-news-token');
    }

    return auth;
}]);