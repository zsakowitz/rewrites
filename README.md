# zsakowitz/rewrites

This repository contains lots of test projects that I've created. The name is a
relic of its initial creation, because I used it to rewrite the Iterator Helpers
library. Now it contains everything from stacks to language parsers to arithmetic
in the TS type system. Enjoy the 47 files this repository has to offer.

# File listing

**[#.ts](./#.ts)** #parser

A parser for a programming language where every instruction is a single symbol.

<br>

**[README.js](./README.js)**

The README generator for this repo.

<br>

**[abort.ts](./abort.ts)** #promise #rewrite

A rewrite of AbortSignals with Promise-like syntax and then-chaining.

<br>

**[await-with-generators.ts](./await-with-generators.ts)** #iterator #promise #rewrite

Runs a generator function with async/await semantics in place of fn\*/yield keywords.

<br>

**[binary.ts](./binary.ts)** #typesystem

A typed container for holding binary data that can be sliced.

<br>

**[bookmarklet.ts](./bookmarklet.ts)** #bookmarklet

Makes a javascript: bookmarklet with URI safety from a string of JS code.

<br>

**[brainf.ts](./brainf.ts)** #parser

A brainf\*\*\* implementation and macro expander.

<br>

**[chrome-home.ts](./chrome-home.ts)** #bookmarklet

A JS shortcut that adds proper keyboard shortcuts to StackBlitz and doubles the speed of a video in YouTube when activated.

<br>

**[deferred.ts](./deferred.ts)** #promise #rewrite

A library for creating Deferred objects. Compatible with the Promises A+ specification.

<br>

**[dominoes.ts](./dominoes.ts)** #game

An engine that automatically runs dominoes games.

<br>

**[emitter.ts](./emitter.ts)** #events #promise #rewrite

A typed event emitter that uses promises and async iterables instead of callbacks to manage event listeners.

<br>

**[env.d.ts](./env.d.ts)**

Declares the promises-aplus-tests module.

<br>

**[extension.ts](./extension.ts)** #rewrite

An implementation of the new Facet library for CodeMirror v6.

<br>

**[imply.ts](./imply.ts)**

All boolean operations implemented from a single IMPLY gate.

<br>

**[impossible.ts](./impossible.ts)** #proxy

Separates call and construct signatures of an object using proxies.

<br>

**[instant-share.ts](./instant-share.ts)**

A test implementation of the "Share with Students" chrome extension.

<br>

**[iterator.ts](./iterator.ts)** #iterator #rewrite

An implementation of the Iterator Helpers proposal.

<br>

**[lambda.js](./lambda.js)** #untyped

Lambda calculus functions in JavaScript.

<br>

**[linked-list.ts](./linked-list.ts)** #immutable

An immutable linked list implementation.

<br>

**[logic.ts](./logic.ts)** #typesystem

Boolean operations implemented in the TS type system from a single NAND gate.

<br>

**[map.ts](./map.ts)** #rewrite #symbol

A Map implementation that stores its values as symbols.

<br>

**[math.ts](./math.ts)** #typesystem

Mathematical functions implemented in the TS typesystem.

<br>

**[matrix.ts](./matrix.ts)**

A Matrix class that can be added, subtracted, and multiplied.

<br>

**[media.js](./media.js)**

Captures clicks on AirPods 3 or AirPods Pro using a video and the mediaSession API.

<br>

**[nand.ts](./nand.ts)**

All boolean logic gates implemented from a single NAND gate.

<br>

**[nullclass.ts](./nullclass.ts)**

A class that has no members to get around the issues with `class extends null` in browsers.

<br>

**[numerical-stack.ts](./numerical-stack.ts)**

A Stack implementation that only accepts numbers.

<br>

**[old-lang.ts](./old-lang.ts)** #parser

An attempt to parse a language using the arcsecond library.

<br>

**[once.ts](./once.ts)**

Wraps a function and only allows it to be called once.

<br>

**[option.ts](./option.ts)**

An Option monad.

<br>

**[parser.ts](./parser.ts)**

A general Parser and Result class that can be used to parse languages.

<br>

**[private.ts](./private.ts)**

A class that stores private data.

<br>

**[promises.ts](./promises.ts)** #promise

A promise extension with more methods.

<br>

**[promisify.ts](./promisify.ts)** #promise #rewrite

A typed promisify function.

<br>

**[quaternions.ts](./quaternions.ts)**

A library for adding, subtracting, and multiplying quaternions.

<br>

**[random-path.ts](./random-path.ts)**

Makes a random path in 1D, 2D, or 3D.

<br>

**[result.ts](./result.ts)**

A Result monad.

<br>

**[sandpiles.ts](./sandpiles.ts)**

A library for adding sand piles as described in a Numberphile video. https://www.youtube.com/watch?v=1MtEUErz7Gg

<br>

**[solid-stores.ts](./solid-stores.ts)** #rewrite

An implementation of SolidJS's signals, effects, and memos.

<br>

**[stack.ts](./stack.ts)**

A generic Stack in JavaScript.

<br>

**[string.ts](./string.ts)** #typesystem

String.split and Array.join, but in the TS typesystem.

<br>

**[svelte-stores.ts](./svelte-stores.ts)** #rewrite

An implementation of Svelte stores.

<br>

**[tiny-store.ts](./tiny-store.ts)**

A simple signal, effect, memo, and computed library based on SolidJS.

<br>

**[typed-timeout.ts](./typed-timeout.ts)** #rewrite

A typed setTimeout function and class.

<br>

**[typeof.ts](./typeof.ts)** #typesystem

Converts TS types into string representations.

<br>

**[validator.ts](./validator.ts)**

A type-first validator with full typing support.

<br>

**[worker.ts](./worker.ts)**

A simple way to run functions off the main thread with one-way or bi-directional communication.
