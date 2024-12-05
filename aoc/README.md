[util.js](util.js) is the utility library.

[index.js](index.js) runs each file in parallel. If a file name isn't in the
`queued` array of the `index.js` file, it isn't complete and may not give
correct results.

**Do not use an individual day's test case as a standard for comparison unless
it is in the `index.js` file.**

The `.check()` function from `util.js` ensures a result is correct. The answers
are hardcoded to my inputs, and will likely fail on your inputs, as inputs may
be different for each person.

My inputs are not saved here. Run [load.js](load.js) with the `ILOWI_AOC_COOKIE`
environment variable set to `session=...` (your `Cookie` header as sent to your
browser) to download all inputs. Inputs are downloaded asynchronously on
Node.JS, synchronously in the browser, and are cached in both.
