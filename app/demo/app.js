angular.module('mainApp', ['FPlan'])
.controller('MainController', function() {
    var vm = this;
    vm.maps = [
        {
            url:'./app/demo/images/floor1.svg',
            title: 'Test Floor 1',
            uid: 'map_1',
        },
        {
            url:'./app/demo/images/floor2.svg',
            title: 'Test Floor 2',
            uid: 'map_2',
        },
    ];

    vm.seats = {
        map_1:[
            {
                uid: 's1',
                coords: [20, 20],
                name: 'Seat 1',
            },
        ]
    };
    vm.people = [
        {
            name: 'Ian Malcom',
            uid: '123456789',
            map_data: {
                map_1: {
                    seat: 's1',
                    schedule: {
                        monday: true,
                        tuesday: true,
                        wednesday: true,
                        thursday: true,
                        friday: true
                    }
                }
            },
            data: {
                team: 'GIS',
            }

        }
    ]

});
