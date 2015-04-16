define([
  'angular',
  'lodash',
  'kbn',
  'moment'
],
function (angular, _, kbn) {
  'use strict';

  var module = angular.module('grafana.services');
  module.factory('MomoDatasource', function($q, $http, templateSrv) {

    // the datasource object passed to constructor
    // is the same defined in config.js
    function MomoDatasource(datasource) {
      this.type = 'momo';
      this.editorSrc = 'app/partials/momo/editor.html';
      this.name = datasource.name;
      this.supportMetrics = true;
      this.url = datasource.url;
      this.grafanaDB = datasource.grafanaDB;
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
      var from = kbn.parseDate(options.range.from).getTime();
      var to = kbn.parseDate(options.range.to).getTime();

      var promises = _.map(options.targets, function(target) {
        return $http({
          url: '/series',
          method: 'GET',
          params: {
            'series': templateSrv.replace(target.metric),
            'from': from,
            'to': to,
            'function': target.function,
            'interval': target.interval,
            'merge': target.merge
          }
        }).then(function(data) {
          if (target.alias) {
            data.data[0].target = createTargetName(data.data[0].target, target.alias);
          }
          return data.data;
        });
      });
      return $q.all(promises).then(function(results) {
        return { data: _.flatten(results) };
      });
    };

    MomoDatasource.prototype.performSuggestQuery = function(query) {
      return $http({
        url: '/metrics',
        method: 'GET',
        params: {'series': query }
      }).then(function(data) { return data.data; });
    };

    MomoDatasource.prototype.metricFindQuery = function(query) {
      var interpolated;
      try {
        interpolated = encodeURIComponent(templateSrv.replace(query));
      }
      catch(err) {
        return $q.reject(err);
      }
      return $http.get('/metrics?series=' + interpolated).then(function(results) {
        return _.map(results.data, function(metric) {
          return {
            text: metric,
            expandable: false
          };
        });
      });
    };

    MomoDatasource.prototype.getDashboard = function(id, isTemp) {
      isTemp = isTemp;
      return $http.get('/dashboard/' + id).then(
        function(response) { return response.data; });
    };

    MomoDatasource.prototype.saveDashboard = function(dashboard) {
      return $http.post('/dashboard', dashboard).then(
        function(response) {
          return { title: response.data.title, url: '/dashboard/db/' + 
            response.data.id };
        }
      );
    };

    MomoDatasource.prototype.searchDashboards = function(queryString) {
      return $http.get('/dashboard?query=' + queryString).then(
        function(response) {
          var dashboards = response.data.dashboards;
          var hits = {
            dashboards: [],
            tags: [],
            tagsOnly: false
          };

          for (var i = 0; i < dashboards.length; i++) {
            var hit = {
              id: dashboards[i].id,
              title: dashboards[i].title,
              tags: dashboards[i].tags
            };
            hits.dashboards.push(hit);
          }   
          return hits;
        });
    };

    return MomoDatasource;

  });

});
