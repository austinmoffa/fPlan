    angular
    .module('FPlan')
    .controller('SeatEditCtrl', SeatEditCtrl);

    function SeatEditCtrl(seat, seats, occupants, days, people, selected_map_uid, $uibModalInstance, $sce, formatSchedule) {
        var vm = this;
        vm.days = days;
        vm.temp_seat = angular.copy(seat);
        vm.occupants = occupants;
        vm.people = people;
        vm.seat = seat;
        vm.selected_map_uid = selected_map_uid;

        vm.deleteSeat = function() {
            vm.occupants = [];
            angular.forEach(vm.people, function(person, key) {
                person.map_data = null;
            });
            angular.forEach(seats[vm.selected_map_uid], function(temp_seat, key) {
                if (temp_seat.uid == vm.seat.uid) {
                    seats[vm.selected_map_uid].splice(key, 1)
                }
            });
            d3.selectAll('.' + seat.uid).remove();
            //d3.selectAll('#' + seat.uid).remove();
            vm.closeEditWindow();
        }

        vm.closeEditWindow = function() {
            $uibModalInstance.close();
        }

        vm.assignPersonToSeat = function() {
            var per = vm.new_schedule_person;
            if (!per) return;
            vm.new_schedule_person = '';
            per.map_data = {};
            per.map_data[vm.selected_map_uid] = {
                seat: seat.uid,
                schedule: {}
            };
            vm.occupants.push(per);
        }

        vm.saveSeatEdits = function() {
            var empty = true;
            if (vm.occupants.length > 0) {
                empty = false;
            }
            d3.select('[uid=' + vm.seat.uid + ']').classed('fplan_empty_seat', empty);
            vm.seat.name = vm.temp_seat.name;
            angular.forEach(vm.occupants, function(occ, key) {
                occ.map_data[vm.selected_map_uid].formatted_schedule = '';
                occ.map_data[vm.selected_map_uid].formatted_schedule = formatSchedule(occ.map_data[vm.selected_map_uid].schedule);
            });
            vm.closeEditWindow();
        }
    }



