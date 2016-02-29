    angular
    .module('FPlan')
    .controller('SeatEditCtrl', SeatEditCtrl);

    function SeatEditCtrl(seat, occupants, people, $uibModalInstance) {
        var vm = this;
        vm.temp_seat = angular.copy(seat);
        vm.seat = seat;

        vm.closeEditWindow = function() {
            $uibModalInstance.close();
        }

        vm.saveSeatEdits = function() {
            vm.seat.name = vm.temp_seat.name;
            vm.closeEditWindow();
        }
    }



