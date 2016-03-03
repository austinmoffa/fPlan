angular.module('fileread', [])
.directive("fileread", [function ($sce) {
        return {
scope: {
    callback: "=",
},
link: function (scope, element, attributes) {
element.bind("change", function (changeEvent) {
        var reader = new FileReader();
        reader.onload = function (loadEvent) {
        scope.$apply(function () {
                var fileread = loadEvent.target.result;
                fileread = fileread.split(',')[1];
                fileread = atob(fileread);
                scope.callback(fileread);

           });
        }
        reader.readAsDataURL(changeEvent.target.files[0]);
        });
}
}
}]);
