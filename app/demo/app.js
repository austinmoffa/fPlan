angular.module('mainApp', ['FPlan'])
.controller('MainController', function($http) {
    var vm = this;

   $http.get('./app/demo/data/maps.json').then(function(res) {
        vm.maps = res.data;
   });

   $http.get('./app/demo/data/seats.json').then(function(res) {
        vm.seats = res.data;
   });

   $http.get('./app/demo/data/people.json').then(function(res) {
        vm.people = res.data;
   });

});
