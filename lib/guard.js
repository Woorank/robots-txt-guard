'use strict';

var patterns = require('./patterns');


function moreSpecificFirst(obj1, obj2) {
  return obj2.pattern.specificity - obj1.pattern.specificity;
}

module.exports = function makeGuard(config) {
  var groups = [];

  // flatten agents
  config.groups
    .forEach(function (group) {
      var rules = group.rules
        .filter(function (rule) {
          return !!rule.path;
        })
        .reduce(function (acc, { rule, path}) {
          const repeatedPathIndex = acc.findIndex((element) => {
            return element.path === path;
          });

          if (repeatedPathIndex > -1) {
            if (rule === 'noindex') {
              acc[repeatedPathIndex].indexable = false;
            } else {
              acc[repeatedPathIndex].allow = rule.toLowerCase() !== 'disallow';
            }
          } else {
            acc.push({
              path,
              pattern: patterns.path(path),
              allow: rule.toLowerCase() !== 'disallow',
              indexable: rule.toLowerCase() !== 'noindex'
            });
          }
          return acc
        }, [])
        .sort(moreSpecificFirst);

      group.agents
        .forEach(function (agent) {
          groups.push({
            pattern: patterns.userAgent(agent),
            rules: rules
          });
        });
    });

  groups.sort(moreSpecificFirst);

  function findGroup(userAgent) {
    for (const group of groups) {
      if (group.pattern.test(userAgent)) {
        return group;
      }
    }
    return null;
  }

  function matchRule(rules, path) {
    for (const rule of rules) {
      if (rule.pattern.test(path)) {
        return {
          allow: rule.allow,
          indexable: rule.indexable
        };
      }
    }
    // no rule matched? assume allowed & indexable
    return {
      allow: true,
      indexable: true
    };
  }

  function isAllowed(userAgent, path) {
    var group = findGroup(userAgent);
    if (group) {
      return matchRule(group.rules, path).allow;
    }
    // no group matched? assume allowed
    return true;
  }

  function isDissalowAll(userAgent) {
    var group = findGroup(userAgent);
    if (group) {
      var allowRules = group.rules.filter(function (rule) {
        return rule.allow;
      });
      return allowRules.length <= 0;
    }
    // no group matched? assume allowed
    return false;
  }

  function isIndexable(userAgent, path) {
    var group = findGroup(userAgent);
    if (group) {
      return matchRule(group.rules, path).indexable;
    }
    // no group matched? assume indexable
    return true;
  }

  return {
    isAllowed: isAllowed,
    isDissalowAll: isDissalowAll,
    isIndexable: isIndexable
  };
};
