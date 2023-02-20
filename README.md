# zsakowitz/rewrites

This repository contains lots of test projects that I've created. The name is a
relic from its initial creation, when I used it to rewrite the Iterator Helpers
proposal. Now it contains everything from stacks to language parsers to the JS
standard library implemented solely in the TS type system. Enjoy the 152 files
this repository has to offer.

# File listing

**[#.ts](./#.ts)** (parser): A parser for a programming language where every
instruction is a single symbol.

<br>

**[README.js](./README.js)**: The README generator for this repo.

<br>

**[abort.ts](./abort.ts)** (promise, rewrite): A rewrite of AbortSignals with
Promise-like syntax and then-chaining.

<br>

**[animation.ts](./animation.ts)**: Draws a cool animation with points and lines
connecting them.

<br>

**[any.ts](./any.ts)**: A value that returns itself for any and all operations.
Type: `any`.

<br>

**[await-with-generators.ts](./await-with-generators.ts)** (iterator, promise,
rewrite): Runs a generator function with async/await semantics in place of
fn\*/yield keywords.

<br>

**[bf.ts](./bf.ts)**: A brainf\*\*k parser, executor, and macro transformer.

<br>

**[binary.ts](./binary.ts)** (typesystem): A typed container for holding binary
data that can be sliced.

<br>

**[blackbaud.tsx](./blackbaud.tsx)**: A Blackbaud scraper that gets data in a
format kama sona can understand.

<br>

**[bookmark.ts](./bookmark.ts)**: Generates a bookmark file that can be imported
into Chrome.

<br>

**[bookmarklet.ts](./bookmarklet.ts)** (bookmarklet): Makes a javascript:
bookmarklet with URI safety from a string of JS code.

<br>

**[brainf.ts](./brainf.ts)** (parser): A brainf\*\*\* implementation and macro
expander.

<br>

**[cancel.ts](./cancel.ts)**: A signal that can be used to cancel things.

<br>

**[checker.ts](./checker.ts)** (parser, typesystem): A system that parses a
TypeScript string literal into an arithmetic expression and evaluates it.
Incomplete.

<br>

**[chrome-home.ts](./chrome-home.ts)** (bookmarklet): A JS shortcut that adds
proper keyboard shortcuts to StackBlitz and doubles the speed of a video in
YouTube when activated.

<br>

**[curry.ts](./curry.ts)** (typesystem): A TypeScript type for currying
functions.

<br>

**[debug.ts](./debug.ts)**: A `Debug<T>` type that outputs a human-readable
version of some TypeScript objects. Notably, it condenses the six-line `OkState`
and `ErrorState` types from parser-X.ts into a single string. It can also reduce
an array into a string, but that's a typical day at this point in the TypeScript
challenges.

<br>

**[decorators-old.test.ts](./decorators-old.test.ts)**: A class that unwraps its
value, whether it be a signal or plain value. Used to test `decorators`.

<br>

**[decorators-old.ts](./decorators-old.ts)**: A reactive system that uses
decorators instead of plain values.

<br>

**[deferred.ts](./deferred.ts)** (promise, rewrite): A library for creating
Deferred objects. Compatible with the Promises A+ specification.

<br>

**[dominoes.ts](./dominoes.ts)** (game): An engine that automatically runs
dominoes games.

<br>

**[easy-jsx.tsx](./easy-jsx.tsx)**: A simple JSX implementation.

<br>

**[emitter-1.ts](./emitter-1.ts)** (events, promise, rewrite): A typed event
emitter that uses promises and async iterables instead of callbacks to manage
event listeners.

<br>

**[emitter-2.ts](./emitter-2.ts)**: A strongly types event emitter that uses
async generators.

<br>

**[encode-uri.js](./encode-uri.js)**: Encodes standard input into a javascript:
bookmark.

<br>

**[env.d.ts](./env.d.ts)**: Declares modules without @types/... declarations.

<br>

**[exittable.ts](./exittable.ts)**: Runs function that can be exited from using
an early return mechanism powered by exceptions.

<br>

**[explicit-resource-management.ts](./explicit-resource-management.ts)**: An
implementation of the ECMAScript Explicit Resource Management proposal.

<br>

**[extension.ts](./extension.ts)** (rewrite): An implementation of the new Facet
library for CodeMirror v6.

<br>

**[fraction.ts](./fraction.ts)**: Expresses arbitrary precision fractions using
bigints.

<br>

**[hooks.ts](./hooks.ts)** (rewrite): An implementation of React Hooks.

<br>

**[imply.ts](./imply.ts)**: All boolean operations implemented from a single
IMPLY gate.

<br>

**[impossible.ts](./impossible.ts)** (proxy): Separates call and construct
signatures of an object using proxies.

<br>

**[instant-share.ts](./instant-share.ts)**: A test implementation of the "Share
with Students" chrome extension.

<br>

**[inventory.ts](./inventory.ts)**: Calculates the inventory sequence as
described in https://www.youtube.com/watch?v=rBU9E-ZOZAI.

<br>

**[iota.ts](./iota.ts)**: The simplest lambda calculus based language. Too bad
the advanced type checking breaks TSC.

<br>

**[iterator.ts](./iterator.ts)** (iterator, rewrite): An implementation of the
Iterator Helpers proposal.

<br>

**[js-in-ts.ts](./js-in-ts.ts)** (typesystem): An attempt to rewrite many of the
core JavaScript operations using only the TypeScript typesystem.

<br>

**[jsx.d.ts](./jsx.d.ts)**: JSX types that all JSX libraries in this project
use.

<br>

**[lambda-in-js.js](./lambda-in-js.js)** (untyped): Lambda calculus functions in
JavaScript.

<br>

**[lambda-js.dom-value.test.ts](./lambda-js.dom-value.test.ts)**: Places
textareas into a browser that allow for writing and running lambda calculus
code.

<br>

**[lambda-js.dom.test.ts](./lambda-js.dom.test.ts)**: Places textareas into a
browser that allow for writing and running lambda calculus code. This
automatically injects the S, K, and I functions, and compiles to a lambda
calculus expression rather than a number, pair, or other representation.

<br>

**[lambda-js.ts](./lambda-js.ts)** (parser): A parser and evaluator for lambda
calculus implemented using JavaScript code.

<br>

**[lambda-ts.ts](./lambda-ts.ts)** (parser, typesystem): A parser and evaluator
for lambda calculus implemented in the TS type system.

<br>

**[lambda.ts](./lambda.ts)** (typesystem): A lambda calculus parser that runs at
compile time and runtime.

<br>

**[language.ts](./language.ts)**: A parser for a custom language.

<br>

**[light-the-bulbs.ts](./light-the-bulbs.ts)**: An engine to discover solutions
to "Light the Bulbs" on zSnout.

<br>

**[linked-list.ts](./linked-list.ts)** (immutable): An immutable linked list
implementation.

<br>

**[lock.ts](./lock.ts)**: A lock that can only be used by one activity at a
time.

<br>

**[log-and-bound.ts](./log-and-bound.ts)**: Experiments with ECMAScript
decorators, as they're finally at stage 3!

<br>

**[logged.test.ts](./logged.test.ts)**: A test file for the @logged decorator.

<br>

**[logged.ts](./logged.ts)**: A decorator that logs all kinds of events.

<br>

**[logic.ts](./logic.ts)** (typesystem): Boolean operations implemented in the
TS type system from a single NAND gate.

<br>

**[map.ts](./map.ts)** (rewrite, symbol): A Map implementation that stores its
values as symbols.

<br>

**[math.ts](./math.ts)** (typesystem): Mathematical functions implemented in the
TS typesystem.

<br>

**[matrix.ts](./matrix.ts)**: A Matrix class that can be added, subtracted, and
multiplied.

<br>

**[media.js](./media.js)**: Captures clicks on AirPods 3 or AirPods Pro using a
video and the mediaSession API.

<br>

**[monad.ts](./monad.ts)**: An exploration into various monads. Unfinished.

<br>

**[nand.ts](./nand.ts)**: All boolean logic gates implemented from a single NAND
gate.

<br>

**[nullclass.ts](./nullclass.ts)**: A class that has no members to get around
the issues with `class extends null` in browsers.

<br>

**[numerical-stack.ts](./numerical-stack.ts)**: A Stack implementation that only
accepts numbers.

<br>

**[observable.ts](./observable.ts)** (rewrite, proposal): The
[ES Observable](https://github.com/tc39/proposal-observable) proposal,
implemented in standard JavaScript. Incomplete.

<br>

**[old-lang.ts](./old-lang.ts)** (parser): An attempt to parse a language using
the arcsecond library.

<br>

**[old-result.ts](./old-result.ts)**: A Result monad.

<br>

**[once.ts](./once.ts)**: Wraps a function and only allows it to be called once.

<br>

**[option.ts](./option.ts)**: An Option monad.

<br>

**[private.ts](./private.ts)**: A class that stores private data.

<br>

**[promises.ts](./promises.ts)** (promise): A promise extension with more
methods.

<br>

**[promisify.ts](./promisify.ts)** (promise, rewrite): A typed promisify
function.

<br>

**[puppeteer.ts](./puppeteer.ts)**: A wrapper for puppeteer.

<br>

**[quaternions.ts](./quaternions.ts)**: A library for adding, subtracting, and
multiplying quaternions.

<br>

**[queue.ts](./queue.ts)**: An async generator that yields queued values.

<br>

**[random-item.ts](./random-item.ts)**: Picks a random item from an array.

<br>

**[random-path.ts](./random-path.ts)**: Makes a random path in 1D, 2D, or 3D.

<br>

**[result.ts](./result.ts)**: A generic result type that can express a possibly
failed result.

<br>

**[sandpiles.ts](./sandpiles.ts)**: A library for adding sand piles as described
in a Numberphile video. https://www.youtube.com/watch?v=1MtEUErz7Gg

<br>

**[sarcastic-text.ts](./sarcastic-text.ts)**: Makes text look sArCaStIc.

<br>

**[secrets.ts](./secrets.ts)**: Sample code that is a mockup for chapter 1 of
Brilliant's cryptocurrency course.

<br>

**[sequent.ts](./sequent.ts)**: A parser and evaluator for boolean logic and
sequent calculus.

<br>

**[shadow-dom.ts](./shadow-dom.ts)**: A library for working with the shadow DOM
using decorators.

<br>

**[solid.js](./solid.js)**: Another reactive library. /
<reference types="./jsx.d.ts" />

<br>

**[solid.ts](./solid.ts)**: Another reactive library.

<br>

**[stack.ts](./stack.ts)**: A generic Stack in JavaScript.

<br>

**[string-cooked.ts](./string-cooked.ts)**: A String.cooked function for use
until the proposal is implemented.

<br>

**[string.ts](./string.ts)** (typesystem): String.split and Array.join, but in
the TS typesystem.

<br>

**[tick-oat-two.ts](./tick-oat-two.ts)**: An AI for the TickoaTTwo game created
by Oats Jenkins: https://www.youtube.com/watch?v=ePxrVU4M9uA

<br>

**[type-safe.ts](./type-safe.ts)**: A library of functions that run at compile
time and runtime.

<br>

**[typed-timeout.ts](./typed-timeout.ts)** (rewrite): A typed setTimeout
function and class.

<br>

**[typeof.ts](./typeof.ts)** (typesystem): Converts TS types into string
representations.

<br>

**[validator-1.ts](./validator-1.ts)**: A type-first validator with full typing
support.

<br>

**[validator-2.ts](./validator-2.ts)**: An item validator with static typing
support.

<br>

**[webauthn.test.tsx](./webauthn.test.tsx)**: An HTML page that experiments with
the WebAuthn API.

<br>

**[wikipedia.ts](./wikipedia.ts)**: An engine that can look through Wikipedia
links.

<br>

**[worker-1.ts](./worker-1.ts)**: A simple way to run functions off the main
thread with one-way or bi-directional communication.

<br>

**[worker-2.ts](./worker-2.ts)**: A simple interface for working with web
workers.

<br>

**[yet-another-js-framework.tsx](./yet-another-js-framework.tsx)**: Yet another
JS framework.

<br>

**[ytm-playlist.ts](./ytm-playlist.ts)**: Downloads a YouTube playlist as MP3
files.

<br>

**[animator/action.ts](./animator/action.ts)**: `Action` type and helpers such
as `all` and `sequence` for Animator.

<br>

**[animator/color.ts](./animator/color.ts)**: Color type and helpers for
Animator.

<br>

**[animator/html.ts](./animator/html.ts)**: A short function that constructs
HTML elements for Animator.

<br>

**[animator/node.ts](./animator/node.ts)**: A renderable Node used in Animator.

<br>

**[animator/preview.ts](./animator/preview.ts)**: A previewer for Animator.

<br>

**[animator/rect.ts](./animator/rect.ts)**: A rectangle renderer for Animator.

<br>

**[animator/scene.ts](./animator/scene.ts)**: View and Scene classes for
Animator.

<br>

**[animator/tick.ts](./animator/tick.ts)**: A tick function that resolves after
calling `requestAnimationFrame`.

<br>

**[animator/transition.ts](./animator/transition.ts)**: Basic timing functions
and interpolators for Animator.

<br>

**[animator/value.ts](./animator/value.ts)**: Stores and store getters for
Animator.

<br>

**[animator/vector.ts](./animator/vector.ts)**: A Vector type and helpers for it
for Animator.

<br>

**[genesis/core.ts](./genesis/core.ts)**: The core of a fine-grained reactivity
library.

<br>

**[genesis/derived.ts](./genesis/derived.ts)**: Derived Genesis stores.

<br>

**[genesis/dom.ts](./genesis/dom.ts)**: Reactive DOM components.

<br>

**[genesis/for.ts](./genesis/for.ts)**: A Genesis component that renders a list
of items.

<br>

**[genesis/index.ts](./genesis/index.ts)**: A next-gen fine-grained reactivity
system and component library.

<br>

**[genesis/maybe.ts](./genesis/maybe.ts)**: A Genesis component to conditionally
render an object.

<br>

**[genesis/stores.ts](./genesis/stores.ts)**: Genesis stores to track values,
objects, and computed properties.

<br>

**[motion/action.ts](./motion/action.ts)**: An action type and helpers for
Motion.

<br>

**[motion/animation.ts](./motion/animation.ts)**: Basic animation functions for
Motion.

<br>

**[motion/html.ts](./motion/html.ts)**: A constructor for HTML elements for
Motion.

<br>

**[motion/mapped-signal.ts](./motion/mapped-signal.ts)**: A mapped signal type
for Motion.

<br>

**[motion/node.ts](./motion/node.ts)**: A drawable node for Motion scenes.

<br>

**[motion/point.ts](./motion/point.ts)**: A Point type and signal for Motion.

<br>

**[motion/preview.ts](./motion/preview.ts)**: A previewer for Motion scenes.

<br>

**[motion/rect.ts](./motion/rect.ts)**: A rectangle node for Motion.

<br>

**[motion/scene.ts](./motion/scene.ts)**: A scene runner for Motion.

<br>

**[motion/signal.ts](./motion/signal.ts)**: A signal implementation designed
specifically for animations.

<br>

**[motion/view.ts](./motion/view.ts)**: A view manager for Motion.

<br>

**[parsers/parser-1.ts](./parsers/parser-1.ts)** (parser): A general Parser and
Result class that can be used to parse languages.

<br>

**[parsers/parser-2.ts](./parsers/parser-2.ts)** (parser): An improved system
for parsing text.

<br>

**[parsers/parser-3.test.ts](./parsers/parser-3.test.ts)** (parser, test): The
test script for parser.ts.

<br>

**[parsers/parser-3.ts](./parsers/parser-3.ts)** (parser): Another improved
system for parsing text. Slightly based on Arcsecond.

<br>

**[parsers/parser-4.test.ts](./parsers/parser-4.test.ts)**: Parses expressions
using [parser-4.ts](./parser-4.ts).

<br>

**[parsers/parser-4.ts](./parsers/parser-4.ts)** (parser): Yet another system
for parsing text.

<br>

**[parsers/parser-5.dom.test.ts](./parsers/parser-5.dom.test.ts)**: Puts
textareas into the DOM that can be used to test parser-5.peg.test.ts.

<br>

**[parsers/parser-5.jest.test.ts](./parsers/parser-5.jest.test.ts)**: Tests for
parser-5.

<br>

**[parsers/parser-5.peg.test.ts](./parsers/parser-5.peg.test.ts)**: Parsers
PEG-style grammars into a parser-5 style grammar.

<br>

**[parsers/parser-5.perchance.test.ts](./parsers/parser-5.perchance.test.ts)**
(parser, rewrite): A replica of perchance's parser and runner. May have a
different feature set.

<br>

**[parsers/parser-5.ts](./parsers/parser-5.ts)** (parser): A fifth system for
parsing text.

<br>

**[parsers/parser-6.arithmetic.test.ts](./parsers/parser-6.arithmetic.test.ts)**:
Parser arithmetic using parser-6.ts.

<br>

**[parsers/parser-6.ts](./parsers/parser-6.ts)**: A text parser based on results
and coroutines.

<br>

**[parsers/parser-7.ts](./parsers/parser-7.ts)** (typesystem): An (extremely)
type safe system for parsing text. Works with `--noEmit`.

<br>

**[parsers/parser-7.types.ts](./parsers/parser-7.types.ts)**: Extra types for
parser-7.

<br>

**[signal/decorators.ts](./signal/decorators.ts)**: Decorators that make working
with signals in classes easy.

<br>

**[signal/index.ts](./signal/index.ts)**: Another implementation of signals.

<br>

**[animator/scenes/colors.ts](./animator/scenes/colors.ts)**: An Animator scene
with colored rectangles.

<br>

**[motion/scenes/rectangles.ts](./motion/scenes/rectangles.ts)**: A Motion scene
using rectangles.

<br>

**[signal/impls/reactive-js.ts](./signal/impls/reactive-js.ts)**: A library with
reactive primitives

<br>

**[signal/impls/signal-decorators.ts](./signal/impls/signal-decorators.ts)**: A
set of decorators that make working with signals, memos, and effects easier.

<br>

**[signal/impls/signal.ts](./signal/impls/signal.ts)**: A signal implementation
featuring effects, signals, memos, caching, `untrack`, `batch`, and
unsubscribing.

<br>

**[signal/impls/solid-stores.ts](./signal/impls/solid-stores.ts)** (rewrite): An
implementation of SolidJS's signals, effects, and memos.

<br>

**[signal/impls/stores.ts](./signal/impls/stores.ts)**: An implementation and
comparison of stores from multiple frameworks, each with: `derived`, which
creates a store whose value is computed based on other stores; `effect`, which
runs an effect when the values of one or more stores change; `get`, which
retrieves the value of a store; `readable`, which creates a store that is
read-only; `untrack`, which performs a side effect on multiple stores without
subscribing to them; and `writable`, which creates a store that is readable and
writable.

<br>

**[signal/impls/svelte-stores.ts](./signal/impls/svelte-stores.ts)** (rewrite):
An implementation of Svelte stores.

<br>

**[signal/impls/tiny-store.ts](./signal/impls/tiny-store.ts)**: A simple signal,
effect, memo, and computed library based on SolidJS.
