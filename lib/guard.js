'use strict';

const patterns = require('./patterns');

/**
 * @typedef {import('./patterns').Pattern} Pattern
 * @typedef {{
 *   pattern: Pattern
 *   allow: boolean
 * }} Rule
 * @typedef {{
 *   pattern: Pattern
 *   accessibilityRules: Rule[]
 *   indexabilityRules: Rule[]
 * }} RuleGroup
 * @typedef {{
 *    rule: string
 *    path: string
 * }} ConfigGroupRule
 * @typedef {{
 *    agents: string[]
 *    rules: ConfigGroupRule[]
 * }} ConfigGroup
 * @typedef {{
 *   groups: ConfigGroup[]
 * }} Config
 * @typedef {{
 *   isAllowed: (userAgent: string, path: string) => boolean
 *   isDisallowAll: (userAgent: string) => boolean
 *   isIndexable: (userAgent: string, path: string) => boolean
 * }} Guard
 */

/**
 * @param {{ pattern: { specificity: number} }} obj1
 * @param {{ pattern: { specificity: number} }} obj2
 * @returns {number}
 */
function moreSpecificFirst (obj1, obj2) {
  return obj2.pattern.specificity - obj1.pattern.specificity;
}

/**
 * @param {Config} config
 * @returns {Guard}
 */
module.exports = function makeGuard (config) {
  /**
   * @type {RuleGroup[]}
   */
  const groups = [];

  for (const group of config.groups) {
    // flatten agents

    /** @type {Map<string, 'allow' | 'disallow'>} */
    const allowByPath = new Map();

    for (const { rule, path } of group.rules) {
      const normalizedRule = rule.toLowerCase();
      if (path && (normalizedRule === 'allow' || normalizedRule === 'disallow')) {
        const repeatedPath = allowByPath.get(path);
        const overwrite = repeatedPath && (normalizedRule === 'allow');
        if (overwrite || !repeatedPath) {
          allowByPath.set(path, normalizedRule);
        }
      }
    }

    /** @type {Rule[]} */
    const accessibilityRules = [];
    for (const [path, rule] of allowByPath.entries()) {
      accessibilityRules.push({
        pattern: patterns.path(path),
        allow: rule !== 'disallow'
      });
    }

    accessibilityRules.sort(moreSpecificFirst);

    /** @type {Rule[]} */
    const indexabilityRules = [];
    for (const { rule, path } of group.rules) {
      const normalizedRule = rule.toLowerCase();
      if (path && normalizedRule === 'noindex') {
        indexabilityRules.push({
          pattern: patterns.path(path),
          allow: false
        });
      }
    }

    indexabilityRules.sort(moreSpecificFirst);

    for (const agent of group.agents) {
      groups.push({
        pattern: patterns.userAgent(agent),
        accessibilityRules,
        indexabilityRules
      });
    }
  }

  groups.sort(moreSpecificFirst);

  /**
   * @param {string} userAgent
   * @returns {RuleGroup | null}
   */
  function findGroup (userAgent) {
    for (const group of groups) {
      if (group.pattern.test(userAgent)) {
        return group;
      }
    }
    return null;
  }

  /**
   * @param {Rule[]} rules
   * @param {string} path
   * @returns {boolean}
   */
  function matchRule (rules, path) {
    for (const rule of rules) {
      if (rule.pattern.test(path)) {
        return rule.allow;
      }
    }
    // no rule matched? assume true
    return true;
  }

  /**
   * @param {'accessibilityRules' | 'indexabilityRules'} ruleSet
   * @param {string} userAgent
   * @param {string} path
   * @returns {boolean}
   */
  function isRuleSetAllowed (ruleSet, userAgent, path) {
    const group = findGroup(userAgent);
    if (group) {
      return matchRule(group[ruleSet], path);
    }
    // no group matched? assume allowed
    return true;
  }

  /**
   * @param {string} userAgent
   * @param {string} path
   * @returns {boolean}
   */
  function isAllowed (userAgent, path) {
    return isRuleSetAllowed('accessibilityRules', userAgent, path);
  }

  /**
   * @param {string} userAgent
   * @param {string} path
   * @returns {boolean}
   */
  function isIndexable (userAgent, path) {
    return isRuleSetAllowed('indexabilityRules', userAgent, path);
  }

  /**
   * @param {string} userAgent
   * @returns {boolean}
   */
  function isDisallowAll (userAgent) {
    const group = findGroup(userAgent);
    if (group) {
      const allowRules = group.accessibilityRules.filter(function ({ pattern, allow }) {
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
