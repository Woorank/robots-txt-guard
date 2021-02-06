/* global describe, it */

'use strict';

const guard = require('../lib/guard');
const assert = require('chai').assert;

describe('guard', function () {
  it('should pick most specific rule', function () {
    // both groups should behave the same, regardless of the order of the rules
    const robotsTxt = guard({
      groups: [{
        agents: ['agent1'],
        rules: [
          { rule: 'allow', path: '/' },
          { rule: 'disallow', path: '/fish' }
        ]
      }, {
        agents: ['agent2'],
        rules: [
          { rule: 'disallow', path: '/fish' },
          { rule: 'allow', path: '/' }
        ]
      }]
    });

    assert.ok(robotsTxt.isAllowed('agent1', '/hello'), '1');
    assert.notOk(robotsTxt.isAllowed('agent1', '/fish'), '2');

    assert.ok(robotsTxt.isAllowed('agent2', '/hello'), '3');
    assert.notOk(robotsTxt.isAllowed('agent2', '/fish'), '4');

    assert.ok(robotsTxt.isAllowed('default', '/hello'), '5');
  });

  // https://stackoverflow.com/a/4589497/419436
  it('allow should get priority', function () {
    // all groups should behave the same, regardless of the order of the rules
    const robotsTxt = guard({
      groups: [{
        agents: ['agent1'],
        rules: [
          { rule: 'allow', path: '/fish' },
          { rule: 'disallow', path: '/fish' }
        ]
      }, {
        agents: ['agent2'],
        rules: [
          { rule: 'disallow', path: '/fish' },
          { rule: 'allow', path: '/fish' }
        ]
      }, {
        agents: ['agent3'],
        rules: [
          { rule: 'disallow', path: '/fish' },
          { rule: 'ALLOW', path: '/fish' }
        ]
      }]
    });

    assert.ok(robotsTxt.isAllowed('agent1', '/hello'), '1');
    assert.ok(robotsTxt.isAllowed('agent1', '/fish'), '2');

    assert.ok(robotsTxt.isAllowed('agent2', '/hello'), '3');
    assert.ok(robotsTxt.isAllowed('agent2', '/fish'), '4');

    assert.ok(robotsTxt.isAllowed('agent3', '/hello'), '5');
    assert.ok(robotsTxt.isAllowed('agent3', '/fish'), '6');

    assert.ok(robotsTxt.isAllowed('default', '/hello'), '7');
  });

  it('should have the correct behaviour when no / is added at the end of the path', function () {
    // both groups should behave the same, regardless of the order of the rules
    const robotsTxt = guard({
      groups: [{
        agents: ['agent1'],
        rules: [
          { rule: 'allow', path: '/fish' },
          { rule: 'disallow', path: '/' }
        ]
      }, {
        agents: ['agent2'],
        rules: [
          { rule: 'disallow', path: '/fish' }
        ]
      }]
    });

    assert.notOk(robotsTxt.isAllowed('agent1', '/hello'), '1');
    assert.ok(robotsTxt.isAllowed('agent1', '/fish'), '2');
    assert.ok(robotsTxt.isAllowed('agent1', '/fish01'), '3');
    assert.ok(robotsTxt.isAllowed('agent1', '/fish/'), '4');

    assert.ok(robotsTxt.isAllowed('agent2', '/hello'), '5');
    assert.notOk(robotsTxt.isAllowed('agent2', '/fish'), '6');
    assert.notOk(robotsTxt.isAllowed('agent2', '/fish01'), '7');
    assert.notOk(robotsTxt.isAllowed('agent2', '/fish/'), '8');

    assert.ok(robotsTxt.isAllowed('default', '/hello'), '9');

    assert.notOk(robotsTxt.isDisallowAll('agent1'), '10');
    assert.notOk(robotsTxt.isDisallowAll('agent2'), '11');
  });

  it('should have the correct behaviour when / is added at the end of the path', function () {
    // both groups should behave the same, regardless of the order of the rules
    const robotsTxt = guard({
      groups: [{
        agents: ['agent1'],
        rules: [
          { rule: 'allow', path: '/fish/' },
          { rule: 'disallow', path: '/' }
        ]
      }, {
        agents: ['agent2'],
        rules: [
          { rule: 'disallow', path: '/fish/' }
        ]
      }]
    });

    assert.notOk(robotsTxt.isAllowed('agent1', '/hello'), '1');
    assert.notOk(robotsTxt.isAllowed('agent1', '/fish'), '2');
    assert.notOk(robotsTxt.isAllowed('agent1', '/fish01'), '3');
    assert.ok(robotsTxt.isAllowed('agent1', '/fish/'), '4');
    assert.ok(robotsTxt.isAllowed('agent1', '/fish/path1'), '5');

    assert.ok(robotsTxt.isAllowed('agent2', '/hello'), '6');
    assert.ok(robotsTxt.isAllowed('agent2', '/fish'), '7');
    assert.ok(robotsTxt.isAllowed('agent2', '/fish01'), '8');
    assert.notOk(robotsTxt.isAllowed('agent2', '/fish/'), '9');

    assert.ok(robotsTxt.isAllowed('default', '/hello'), '10');

    assert.notOk(robotsTxt.isDisallowAll('agent1'), '11');
    assert.notOk(robotsTxt.isDisallowAll('agent2'), '12');
  });

  it('noindex shouldn\'t interfere with allow', function () {
    // both groups should behave the same, regardless of the order of the rules
    const robotsTxt = guard({
      groups: [{
        agents: ['agent1'],
        rules: [
          { rule: 'noindex', path: '/fish' },
          { rule: 'disallow', path: '/fish' }
        ]
      }, {
        agents: ['agent2'],
        rules: [
          { rule: 'disallow', path: '/fish' },
          { rule: 'noindex', path: '/fish' }
        ]
      }, {
        agents: ['agent3'],
        rules: [
          { rule: 'disallow', path: '/' },
          { rule: 'noindex', path: '/fish' }
        ]
      }]
    });

    assert.notOk(robotsTxt.isAllowed('agent1', '/fish'), '1');
    assert.notOk(robotsTxt.isAllowed('agent2', '/fish'), '2');
    assert.notOk(robotsTxt.isAllowed('agent3', '/fish'), '3');
  });

  it('should pick most specific agent', function () {
    // both groups should behave the same, regardless of the order of the rules
    const robotsTxt = guard({
      groups: [{
        agents: ['agent', 'agent2'],
        rules: [
          { rule: 'disallow', path: '/disallow1' }
        ]
      }, {
        agents: ['*'],
        rules: [
          { rule: 'disallow', path: '/disallow2' }
        ]
      }, {
        agents: ['agent1'],
        rules: [
          { rule: 'disallow', path: '/disallow3' }
        ]
      }]
    });

    assert.notOk(robotsTxt.isAllowed('agent1', '/disallow3'), '1');
    assert.ok(robotsTxt.isAllowed('agent1', '/disallow1'), '2');
    assert.ok(robotsTxt.isAllowed('agent1', '/disallow2'), '3');

    assert.notOk(robotsTxt.isAllowed('hello', '/disallow2'), '4');
    assert.ok(robotsTxt.isAllowed('hello', '/disallow1'), '5');
    assert.ok(robotsTxt.isAllowed('hello', '/disallow3'), '6');

    assert.notOk(robotsTxt.isAllowed('agent', '/disallow1'), '7');
    assert.ok(robotsTxt.isAllowed('agent', '/disallow2'), '8');
    assert.ok(robotsTxt.isAllowed('agent', '/disallow3'), '9');

    assert.notOk(robotsTxt.isAllowed('agent2', '/disallow1'), '10');
    assert.ok(robotsTxt.isAllowed('agent2', '/disallow2'), '11');
    assert.ok(robotsTxt.isAllowed('agent2', '/disallow3'), '12');
  });

  it('should pick most specific agent', function () {
    // both groups should behave the same, regardless of the order of the rules
    const robotsTxt = guard({
      groups: [{
        agents: ['*'],
        rules: [
          { rule: 'disallow', path: '' }
        ]
      }]
    });

    assert.ok(robotsTxt.isAllowed('agent', '/'), '1');
    assert.ok(robotsTxt.isAllowed('agent', '/path'), '2');
  });

  it('should detect disallow all', function () {
    // both groups should behave the same, regardless of the order of the rules
    const robotsTxt = guard({
      groups: [{
        agents: ['*'],
        rules: [
          { rule: 'disallow', path: '/' }
        ]
      }, {
        agents: ['googlebot'],
        rules: [
          { rule: 'disallow', path: '/' },
          { rule: 'allow', path: '/fish' }
        ]
      }]
    });

    assert.isTrue(robotsTxt.isDisallowAll('somebot'));
    assert.isFalse(robotsTxt.isDisallowAll('googlebot'));
  });

  it('should detect disallow all', function () {
    const robotsTxt = guard({
      groups: [{
        agents: ['*'],
        rules: [
          { rule: 'disallow', path: '/' },
          { rule: 'noindex', path: '/fish' }
        ]
      }]
    });

    assert.isTrue(robotsTxt.isDisallowAll('somebot'));
  });

  it('should detect that not all paths are disallowed when only disallowing specific paths', function () {
    const robotsTxt = guard({
      groups: [{
        agents: ['*'],
        rules: [
          { rule: 'disallow', path: '/fish' }
        ]
      }]
    });

    assert.isFalse(robotsTxt.isDisallowAll('somebot'));
  });

  it('should correctly detect if path is allowed with noindex', function () {
    const robotsTxt = guard(
      {
        groups: [
          {
            agents: ['*'],
            rules: [
              { rule: 'allow', path: '/path1' },
              { rule: 'disallow', path: '/*/path2/' },
              { rule: 'noindex', path: '/*/path2/' },
              { rule: 'noindex', path: '/*/path3/' }
            ]
          }
        ]
      }
    );

    assert.ok(robotsTxt.isAllowed('agent', '/'), '1');
    assert.ok(robotsTxt.isAllowed('agent', '/path1'), '2');
    assert.notOk(robotsTxt.isAllowed('agent', '/*/path2/'), '3');
    assert.ok(robotsTxt.isAllowed('agent', '/*/path3/'), '4');
  });

  it('should detect if path is indexable', function () {
    const robotsTxt = guard(
      {
        groups: [
          {
            agents: ['*'],
            rules: [
              { rule: 'allow', path: '/path1' },
              { rule: 'noindex', path: '/path1' },
              { rule: 'disallow', path: '/*/path2/' },
              { rule: 'noindex', path: '/*/path2/' },
              { rule: 'noindex', path: '/*/path3/' },
              { rule: 'allow', path: '/path4/' },
              { rule: 'disallow', path: '/path5/' }
            ]
          },
          {
            agents: ['googlebot'],
            rules: [
              { rule: 'disallow', path: '/path1' },
              { rule: 'allow', path: '/path2' },
              { rule: 'noindex', path: '/path3' }
            ]
          }
        ]
      }
    );

    assert.ok(robotsTxt.isIndexable('*', '/'), '1');
    assert.notOk(robotsTxt.isIndexable('*', '/path1'), '2');
    assert.notOk(robotsTxt.isIndexable('*', '/*/path2/'), '3');
    assert.notOk(robotsTxt.isIndexable('*', '/*/path3/'), '4');
    assert.ok(robotsTxt.isIndexable('*', '/path4/'), '5');
    assert.ok(robotsTxt.isIndexable('*', '/path5/'), '6');

    assert.ok(robotsTxt.isIndexable('googlebot', '/path1/'), '7');
    assert.ok(robotsTxt.isIndexable('googlebot', '/path2/'), '8');
    assert.notOk(robotsTxt.isIndexable('googlebot', '/path3/'), '9');
  });
});
