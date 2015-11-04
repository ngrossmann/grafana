define([
  'angular',
],
function (angular) {
  'use strict';

  var module = angular.module('grafana.directives');

  module.directive('metricQueryEditorMomo', function() {
    return {controller: 'MomoQueryCtrl', templateUrl: 'app/plugins/datasource/momo/partials/query.editor.html'};
  });
});
