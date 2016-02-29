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
        var smooth_click_thresh = 0;
        var map_svg, zoom, drag;
        vm.sidebar_closed=false;

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
                    if (key == 0) {
                        setVisibleMap(0, true);
                    }
                });
            })
        }


        var setVisibleMap = function(el, force) { //reset all visibility just to be safe, then set new element
            if (vm.maps[el].uid != vm.selected_map_uid || force) { //Only when map has changed or on first load
                vm.selected_map_uid = vm.maps[el].uid;
                map_svg = map_container.select('#' + vm.maps[el].uid);
                map_svg.style('display', null).call(zoom).on('click', addSeatClickEvent);
                addExistingSeats(el);
            }
        }

        function addSeatClickEvent() {
            if (!d3.event.defaultPrevented) { //this is a drag detection
                var seat_obj = {
                    name: 'New',
                    coords: d3.mouse(this),
                    uid: guid(),
                };
                $scope.$apply(function() {
                    vm.seats[vm.selected_map_uid].push(seat_obj);
                });
                addSeatToMap(seat_obj);
            }
        }

        function addSeatToMap(seat) {
            map_svg.append("circle")
            .classed(seat.uid, true)
            .attr('uid', seat.uid)
            .classed('fplan_marker', true)
            .attr("cx", seat.coords[0])
            .attr("cy", seat.coords[1])
            .attr("fill", "orange")
            .attr("r", 10)
            .on('click', seatEdit)
            .on('mouseover', seatHoverEnter)
            .on('mouseout', seatHoverExit)
            .call(drag);
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
                resolve: {
                    seat: function () {
                        return seat_obj[0];
                    },
                    occupants: function() {
                        return getOccupants(seat_obj[0].uid);
                    },
                    people: function() {
                        return vm.people;
                    }
                }
            });
        }

        var addExistingSeats = function(el) {
            if (vm.seats.hasOwnProperty(vm.selected_map_uid)) {
                angular.forEach(vm.seats[vm.selected_map_uid], function(seat, key) {
                    addSeatToMap(seat);
                });
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
            map_svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
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
            map_svg.attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")");
        }

        var centerClick = function() {
            zoom.translate([0, 0]);
            map_svg.attr("transform", "translate(0,0)scale(" + zoom.scale() + ")");
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

        var formatSchedule = function(schedule) {
            //date/time in general is a nightmare
            var retstring = '';
            angular.forEach(days, function(day, key) {
                if(schedule[day]) {
                    retstring += " <b>" + day[0].toUpperCase() + "</b> ";
                } else {
                    retstring += " " + day[0].toUpperCase() + " ";
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
            setVisibleMap(0);
            //exposed functions
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
