#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const testDir = __dirname
const files = fs.readdirSync(testDir)
  .filter(f => f.endsWith('.test.js'))
  .sort()

const results = { pass: 0, fail: 0, failures: [] }

global.test = (name, fn) => {
  try {
    fn()
    results.pass++
    process.stdout.write(`  ✓ ${name}\n`)
  } catch (e) {
    results.fail++
    results.failures.push({ name, error: e })
    process.stdout.write(`  ✗ ${name}\n    ${e.message}\n`)
  }
}

for (const file of files) {
  process.stdout.write(`\n${file}\n`)
  require(path.join(testDir, file))
}

process.stdout.write(`\n${results.pass} passed, ${results.fail} failed\n`)
if (results.fail > 0) {
  process.stdout.write('\nFailures:\n')
  for (const f of results.failures) {
    process.stdout.write(`- ${f.name}\n  ${f.error.stack || f.error.message}\n`)
  }
  process.exit(1)
}
