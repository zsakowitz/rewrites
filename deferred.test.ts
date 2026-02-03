// Tests for deferred.ts.

// To run this, install `promises-aplus-tests@1.2.1`. This isn't installed by
// default because NPM complains about vulnerabilities.
//
// Make sure to install `1.2.1`. No higher version, no lower version!

import tests from "promises-aplus-tests"
import { Deferred } from "./deferred.js"

tests({
    pending: () => new Deferred(),
    resolve: Deferred.resolve,
    reject: Deferred.reject,
})
