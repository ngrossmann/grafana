define([
  'angular'
],
function (angular) {
  'use strict';

  var module = angular.module('grafana.controllers');

  module.controller('MomoTargetCtrl', function($scope, $timeout) {

    $scope.init = function() {
      var target = $scope.target;
      target.errors = {};
      target.function = target.function || 'mean';
      target.interval = target.interval || '1m';
      $scope.functions = ['max', 'min', 'mean', 'sum'];

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
      $scope.datasource
        .performSuggestQuery(query, 'metrics')
        .then(callback);
    };


  });

});
