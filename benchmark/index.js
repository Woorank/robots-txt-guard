const parse = require('robots-txt-parse');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const guard = require('..');

async function loadRobotsTxt (filename) {
  return parse(fs.createReadStream(path.resolve(__dirname, filename)));
}

function measure (thing, fn) {
  const startTime = performance.now();
  const result = fn();
  const duration = performance.now() - startTime;
  console.log(`[${thing}] Duration: ${duration}`);
  return result;
}

async function main () {
  const config = await loadRobotsTxt('./big-robots.txt');
  const theGuard = measure('create guard', () => guard(config));
  measure('use guard', () => {
    theGuard.isAllowed('googlebot', '/foo/bar');
    theGuard.isAllowed('googlebot', '/bar/baz');
    theGuard.isAllowed('*', '/foo/quux');
    theGuard.isAllowed('*', '/quux/baz');
  });
}

main();
