(function() {
    angular
    .module('FPlan')
    .controller('FPlanController', FPlanController);

    function FPlanController($scope, $sce, $uibModal, $filter) {
        //config/class vars
        var days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']; //localization issue down the line :( but better than numeric representations
        var margin = {top: -5, right: -5, bottom: -5, left: -5},
            width = 960 - margin.left - margin.right,
            height = 800 - margin.top - margin.bottom;
        var map_container = d3.select('.fplan_map_container');
        var vm = this;
        vm.selected_map_uid = vm.maps[0].uid;
        vm.selected_map_uid_temp = vm.selected_map_uid;
        var smooth_click_thresh = 0;
        var map_svg, zoom, drag;
        var fill = 'orange';
        vm.sidebar_closed=false;
        vm.config = {};
        width = screen.width;

        var loadMaps= function() {
            angular.forEach(vm.maps, function(map, key) {
                d3.xml(map.url, function(error, documentFragment) {
                    if (error) {console.log(error); return;}
                    var svgNode = documentFragment.getElementsByTagName("svg")[0];
                    svgNode.setAttribute('id', map.uid);
                    svgNode.setAttribute('height', height);
                    svgNode.setAttribute('width', width);
                    if (key != 0) {
                        svgNode.style.display = 'none';
                    }
                    map_container.node().appendChild(svgNode);
                    var map_node = map_container.select('#' + map.uid);
                    map_node.html('<g>' + map_node.html() + '</g>');

                    if (key == 0) {
                        setVisibleMap(vm.maps[0].uid, true);
                    }

                });
            })
        }


        var setVisibleMap = function(uid, force) { //reset all visibility just to be safe, then set new element
            if (uid != vm.selected_map_uid || force) { //Only when map has changed or on first load
                vm.selected_map_uid = uid;
                map_container.selectAll('svg').style('display', 'none');
                map_svg = map_container.select('#' + uid);
                map_svg.style('display', null);
                map_svg.call(zoom).on('click', addSeatClickEvent);
                addExistingSeats(uid);
            }
        }

        function addSeatClickEvent() {
            if (!d3.event.defaultPrevented) { //this is a drag detection
                var seat_obj = {
                    name: 'New',
                    coords: d3.mouse(this),
                    uid: guid(),
                };
                if (vm.seats[vm.selected_map_uid] == null) {
                    vm.seats[vm.selected_map_uid] = [];
                }
                $scope.$apply(function() {
                    vm.seats[vm.selected_map_uid].push(seat_obj);
                });
                addSeatToMap(seat_obj);
            }
        }

        function addSeatToMap(seat) {
            var node = map_svg.select('g').append("circle")
            .classed(seat.uid, true)
            .attr('uid', seat.uid)
            .classed('fplan_marker', true)
            .attr("cx", seat.coords[0])
            .attr("cy", seat.coords[1])
            .attr("fill", fill)
            .attr("r", 10)
            .on('click', seatEdit)
            .on('mouseover', seatHoverEnter)
            .on('mouseout', seatHoverExit)
            .call(drag);

            if (getOccupants(seat.uid).length <= 0) {
                node.classed('fplan_empty_seat', true);
            } else if (isSeatFull(seat.uid)) {
                node.classed('fplan_full_seat', true);
            }

        }

        function seatHoverEnter(uid) {
            if (!uid) {
                uid = d3.select(this).attr('uid');
            }
            seatHoverEvent(true, uid);
        }

        function seatHoverExit(uid) {
            if (!uid) {
                uid = d3.select(this).attr('uid');
            }
            seatHoverEvent(false, uid);
        }

        function seatHoverEvent(e, uid) {
            d3.selectAll('.' + uid).classed('hovered', e);
        }

        function seatEdit() {
            if (d3.event.defaultPrevented) return; // click suppressed
            d3.event.stopPropagation(); //don't treat this as a map click
            var seat_obj = $filter("filter")(vm.seats[vm.selected_map_uid], {uid:d3.select(this).attr('uid')});
            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: 'app/templates/seat-edit.html',
                controller: 'SeatEditCtrl as vm',
                size: 'large',
                backdrop:'static', //enforces transactions
                resolve: {
                    seat: function () {return seat_obj[0];},
                    seats: function () {return vm.seats},
                    occupants: function() {return getOccupants(seat_obj[0].uid);},
                    people: function() { return vm.people; },
                    selected_map_uid: function() { return vm.selected_map_uid;},
                    days: function() { return days; },
                    formatSchedule: function() {return formatSchedule},
                    isSeatFull: function() {return isSeatFull},
                    full_days: function() {return getFullDays(seat_obj[0].uid)}
                }
            });
        }

        var addExistingSeats = function(uid) {
            if (!vm.config.hasOwnProperty(uid) || (vm.config.hasOwnProperty(uid) && !vm.config[uid].seats_loaded)) {
                if (vm.seats.hasOwnProperty(uid)) {
                    angular.forEach(vm.seats[uid], function(seat, key) {
                        addSeatToMap(seat);
                    });
                }
                vm.config[uid] = {seats_loaded: true};
            }
        }

        var configD3Controls = function() {
            zoom = d3.behavior.zoom()
            .scaleExtent([1, 10])
            .on("zoom", zoomed);

            drag = d3.behavior.drag()
            //.origin(function(d) { return d; })
            .on("dragstart", dragstarted)
            .on("drag", dragged)
            .on("dragend", dragended);
        }

        function zoomed() {
            map_svg.select('g').attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        }

        function dragstarted(d) {
            d3.event.sourceEvent.stopPropagation();
            d3.select(this).classed("dragging", true);
        }

        function dragged(d) {
            d3.select(this).attr("cx", d3.event.x).attr("cy",  d3.event.y);
        }

        function dragended(d) {
            var seat_obj = $filter("filter")(vm.seats[vm.selected_map_uid], {uid:d3.select(this).attr('uid')});
            var coords = [parseInt(d3.select(this).attr("cx")), parseInt(d3.select(this).attr("cy"))];
            seat_obj[0].coords = coords;
            d3.select(this).classed("dragging", false);
        }

        var zoomClick = function(direction) {
            var extent = zoom.scaleExtent();
            var factor = 0.2;
            if (direction != 0) {
                var target_zoom = zoom.scale() * (1 + factor * direction);
            } else { //0 is our reset val
                target_zoom = extent[0];
            }
            if (target_zoom < extent[0]) {
                target_zoom = extent[0];
             } else if (target_zoom > extent[1]) {
                target_zoom = extent[1];
             }
            zoom.scale(target_zoom);
            map_svg.select('g').attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")");
        }

        var centerClick = function() {
            zoom.translate([0, 0]);
            map_svg.select('g').attr("transform", "translate(0,0)scale(" + zoom.scale() + ")");
        }

        var getOccupants = function(suid) {
            var ret = [];
            angular.forEach(vm.people, function(person, key) {
                if (person.hasOwnProperty('map_data') && person.map_data && person.map_data.hasOwnProperty(vm.selected_map_uid) && person.map_data[vm.selected_map_uid].seat == suid) {
                    if (!person.map_data[vm.selected_map_uid].hasOwnProperty('formatted_schedule')) {
                        person.map_data[vm.selected_map_uid].formatted_schedule = formatSchedule(person.map_data[vm.selected_map_uid].schedule);
                    }
                    this.push(person);
                }
            }, ret);
            return ret;
        }

        var getFullDays = function(suid) {
            var check_schedule = {};
            angular.forEach(days, function(day, key) {
                check_schedule[day] = false;
            });
            angular.forEach(vm.people, function(person, key) {
                if (person.hasOwnProperty('map_data') && person.map_data && person.map_data.hasOwnProperty(vm.selected_map_uid) && person.map_data[vm.selected_map_uid].seat == suid) {
                    angular.forEach(person.map_data[vm.selected_map_uid].schedule, function(day, key) {
                        if (day) {
                            check_schedule[key] = true;
                        }
                    });
                }
            });
            return check_schedule;
        }

        var isSeatFull = function(suid) {
            var check_schedule = getFullDays(suid);
            var ret = true;
            angular.forEach(check_schedule, function(day, key) {
                if (!day) {
                    ret = false;
                }
            });

            return ret;
        }

        var formatSchedule = function(schedule) {
            //date/time in general is a nightmare
            var retstring = '';
            angular.forEach(days, function(day, key) {
                if(schedule[day]) {
                    retstring += " <b class='fplan_selected_day'>" + day[0].toUpperCase() + "</b> ";
                } else {
                    retstring += "<span class='fplan_not_selected_day'> " + day[0].toUpperCase() + "</span> ";
                }
            });
            return $sce.trustAsHtml(retstring);
        }

        function guid(){ //broofa's function from stack overflow
            return 'sxxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
        }

        var addNewPerson = function() {
            var person_obj = {
                'name': vm.temp_name,
                'uid': guid(),
                'map_data': null,
            }
            vm.temp_name = '';
            vm.people.push(person_obj);
        }

        var init = function() {
            configD3Controls();
            loadMaps();
            //exposed functions
            vm.setVisibleMap = setVisibleMap;
            vm.zoomClick = zoomClick;
            vm.centerClick = centerClick;
            vm.getOccupants = getOccupants;
            vm.formatSchedule = formatSchedule;
            vm.addNewPerson = addNewPerson;
            vm.seatHoverEnter = seatHoverEnter;
            vm.seatHoverExit = seatHoverExit;
        }

        init();
    }

})();
