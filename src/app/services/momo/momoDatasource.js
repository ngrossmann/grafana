define([
  'angular',
  'lodash',
  'kbn',
  'moment'
],
function (angular, _, kbn) {
  'use strict';

  var module = angular.module('grafana.services');
  module.factory('MomoDatasource', function($q, $http) {

    // the datasource object passed to constructor
    // is the same defined in config.js
    function MomoDatasource(datasource) {
      this.type = 'momo';
      this.editorSrc = 'app/partials/momo/editor.html';
      this.name = datasource.name;
      this.supportMetrics = true;
      this.url = datasource.url;
    }

    MomoDatasource.prototype.query = function(options) {
      /*
       * options.range.from
       * options.range.to
       * options.maxDataPoints = 1600
       * options.interval = 10s
       * options.targets = []
       *   0: metric, function, target: randomWalk, column: "value"
       */
      // get from & to in seconds
      var from = kbn.parseDate(options.range.from).getTime();
      var to = kbn.parseDate(options.range.to).getTime();

      return $http({
        url: 'http://localhost:8080/series',
        method: 'GET',
	params: {'series': options.targets[0].metric, 
		'from': from, 
		'to': to,
		'function': options.targets[0].function,
		'interval': options.targets[0].interval
	}
      }).then(function(data) {
        return {data: [ data.data ]}; 
      } );
    };

    MomoDatasource.prototype.performSuggestQuery = function(query) {
      return $http({
        url: 'http://localhost:8080/metrics',
        method: 'GET',
        params: {'series': query }
      }).then(function(data) { return data.data; });
    };

    return MomoDatasource;

  });

});
