    angular
    .module('FPlan')
    .controller('SeatEditCtrl', SeatEditCtrl);

    function SeatEditCtrl(seat, seats, occupants, days, people, selected_map_uid, $uibModalInstance, $sce, formatSchedule, isSeatFull, full_days) {
        var vm = this;
        vm.days = days;
        vm.temp_seat = angular.copy(seat);
        vm.occupants = occupants;
        vm.people = people;
        vm.seat = seat;
        vm.selected_map_uid = selected_map_uid;

        vm.deleteSeat = function() {
            angular.forEach(vm.people, function(person, key) {
                if(person.hasOwnProperty('map_data') && person.map_data && person.map_data.hasOwnProperty(vm.selected_map_uid) && person.map_data[vm.selected_map_uid].seat == vm.seat.uid) {
                    person.map_data = null;
                }
            });
            vm.occupants = [];
            angular.forEach(seats[vm.selected_map_uid], function(temp_seat, key) {
                if (temp_seat.uid == vm.seat.uid) {
                    seats[vm.selected_map_uid].splice(key, 1)
                }
            });
            var pip = d3.select('[uid=' + vm.seat.uid + ']');
            d3.select(pip.node().parentNode).remove();
            d3.selectAll('.' + seat.uid).remove();
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
            var full = false;
            var displayString = '';
            if (vm.occupants.length > 0) {
                angular.forEach(vm.occupants, function(occ, key) {
                    displayString += occ.name;
                    if (key != vm.occupants.length-1) {
                        displayString += ", ";
                    }
                });

                empty = false;
            }

            if (!empty && isSeatFull(seat.uid)) {
                full = true;
            }

            var pip = d3.select('[uid=' + vm.seat.uid + ']');
            pip.classed('fplan_empty_seat', empty);
            d3.select(pip.node().parentNode).select('text').html(displayString);
            pip.classed('fplan_full_seat', full);

            vm.seat.name = vm.temp_seat.name;
            angular.forEach(vm.occupants, function(occ, key) {
                occ.map_data[vm.selected_map_uid].formatted_schedule = '';
                occ.map_data[vm.selected_map_uid].formatted_schedule = formatSchedule(occ.map_data[vm.selected_map_uid].schedule);
            });
            vm.closeEditWindow();
        }

        vm.preventDayOverlap = function(day, map_data) {
            if (map_data.schedule[day] && full_days[day]) {
                map_data.schedule[day] = false;
            } else {
                full_days[day] = false;
            }
        }

    }



