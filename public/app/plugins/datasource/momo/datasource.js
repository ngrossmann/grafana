// vim: expandtab sw=2 st=2 smarttab:
define([
  'angular',
  'lodash',
  'moment',
  './directives',
  './query_ctrl'
],
function (angular, _) {
  'use strict';

  var module = angular.module('grafana.services');
  module.factory('MomoDatasource', function($q, backendSrv, templateSrv) {

    // the datasource object passed to constructor
    // is the same defined in config.js
    function MomoDatasource(datasource) {
      this.name = datasource.name;
      this.supportMetrics = true;
      this.url = datasource.url;
      this.datasource = datasource;
    }

    function createTargetName(target, alias) {
      var regex = /\$(\d+)/g;
      var segments = target.split('.');
      return alias.replace(regex, function(match, group) {
        var i = parseInt(group);
        if (_.isNumber(i) && i >= 0 && i < segments.length) {
          return segments[i];
        } else {
          return match;
        }
      });
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
      var from = options.range.from.format('X');
      var to = options.range.to.format('X');
      var url = this.url + '/series';

      var promises = _.map(options.targets, function(target) {
        var request = {
          url: url,
          method: 'GET',
          params: {
            'series': templateSrv.replace(target.target),
            'from': from,
            'to': to,
            'function': target.function,
            'interval': target.interval,
            'merge': target.merge
          }
        };

        return backendSrv.datasourceRequest(request).then(function(data) {
          if (target.alias) {
            data.data = _.map(data.data, function(d) {
              d.target = createTargetName(d.target, target.alias);
              return d;
            });
          }
          return data.data;
        });
      });
      return $q.all(promises).then(function(results) {
        return { data: _.flatten(results) };
      });
    };

    MomoDatasource.prototype.performSuggestQuery = function(query) {
      return backendSrv.datasourceRequest({
        url: this.url + '/metrics',
        method: 'GET',
        params: {'series': query }
      }).then(function(data) { return data.data; });
    };

    MomoDatasource.prototype.metricFindQuery = function(query) {
      var interpolated;
      try {
        interpolated = encodeURIComponent(templateSrv.replace(query));
        var options = {
          url: this.url + '/metrics?series=' + interpolated,
          method: 'GET'
        };
        return backendSrv.datasourceRequest(options).then(
          function(results) {
            return _.map(results.data, function(metric) {
              return {
                text: metric,
                expandable: false
              };
            });
          }
        );
      }
      catch(err) {
        return $q.reject(err);
      }
    };

    MomoDatasource.prototype.testDatasource = function() {
      return this.metricFindQuery('*').then(function () {
        return { status: "success", message: "Data source is working", title: "Success" };
      });
    };

    return MomoDatasource;

  });
});
