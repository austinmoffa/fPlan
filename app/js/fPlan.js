(function() {
    angular
    .module('FPlan', ['ui.bootstrap', 'fileread'])
    .directive('fPlan', fPlan);

    function fPlan() {
        var directive = {
            restrict: 'EA',
            templateUrl: 'app/templates/fplan.html',
            scope: {
                maps: '=',
                people: '=',
                seats: '=',
            },
            controller: 'FPlanController',
            controllerAs: 'vm',
            bindToController: true
        };
        return directive;
    }
})();

