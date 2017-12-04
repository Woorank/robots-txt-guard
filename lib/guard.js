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
      const accessibilityRules = group.rules
        .filter(({ rule, path }) => !!path && ['allow', 'disallow'].includes(rule.toLowerCase()))
        .reduce((acc, { rule, path }) => {
          const repeatedPathIndex = acc.findIndex((element) => {
            return element.path === path;
          });

          if (repeatedPathIndex > -1) {
            if (rule === 'allow') {
              acc[repeatedPathIndex].rule = 'allow';
            }
          } else {
            acc.push({
              rule,
              path
            });
          }
          return acc;
        }, [])
        .map(({ rule, path }) => ({
          pattern: patterns.path(path),
          allow: rule.toLowerCase() !== 'disallow'
        }))
        .sort(moreSpecificFirst);

      const indexabilityRules = group.rules
        .filter(({ rule, path }) => !!path && ['noindex'].includes(rule.toLowerCase()))
        .map(({ rule, path }) => ({
          pattern: patterns.path(path),
          allow: rule.toLowerCase() !== 'noindex'
        }))
        .sort(moreSpecificFirst);

      group.agents
        .forEach(function (agent) {
          groups.push({
            pattern: patterns.userAgent(agent),
            accessibilityRules,
            indexabilityRules
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
        return rule.allow;
      }
    }
    // no rule matched? assume true
    return true;
  }

  function isRuleSetAllowed(ruleSet, userAgent, path) {
    var group = findGroup(userAgent);
    if (group) {
      return matchRule(group[ruleSet], path);
    }
    // no group matched? assume allowed
    return true;
  }

  function isAllowed(userAgent, path) {
    return isRuleSetAllowed('accessibilityRules', userAgent, path);
  }

  function isIndexable(userAgent, path) {
    return isRuleSetAllowed('indexabilityRules', userAgent, path);
  }

  function isDisallowAll(userAgent) {
    var group = findGroup(userAgent);
    if (group) {
      var allowRules = group.accessibilityRules.filter(function ({ pattern, allow }) {
        return allow || pattern.specificity > 1;
      });
      return allowRules.length <= 0;
    }
    // no group matched? assume allowed
    return false;
  }

  return {
    isAllowed: isAllowed,
    isDisallowAll: isDisallowAll,
    isIndexable: isIndexable
  };
};
