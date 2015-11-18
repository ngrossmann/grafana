// vim: expandtab sw=2 st=2 smarttab:
define([
  'angular'
],
function (angular) {
  'use strict';

  var module = angular.module('grafana.controllers');

  module.controller('MomoQueryCtrl', function($scope, $timeout) {

    $scope.init = function() {
      var target = $scope.target;
      target.errors = {};
      target.function = target.function || 'mean';
      target.merge = target.merge || 'false';
      target.interval = target.interval || '1m';
      $scope.functions = ['max', 'min', 'mean', 'sum'];
      $scope.mergeOptions = ['false', 'true'];

      if (!$scope.target.downsampleAggregator) {
        $scope.target.downsampleAggregator = 'sum';
      }

      $scope.$on('typeahead-updated', function() {
        $timeout($scope.get_data);
      });
    };

    $scope.duplicate = function() {
      var clone = angular.copy($scope.target);
      $scope.panel.targets.push(clone);
    };

    $scope.suggestMetrics = function(query, callback) {
      var debugCallback = function(data) {
        callback(data);
      };
      $scope.datasource
        .performSuggestQuery(query, 'metrics')
        .then(debugCallback);
    };

    $scope.init();
  });
});
