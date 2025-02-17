# zsakowitz/rewrites

This repository contains lots of test projects that I've created. The name is a
relic from its initial creation, when I used it to rewrite the Iterator Helpers
proposal. Now it contains everything from stacks to language parsers to the JS
standard library implemented solely in the TS type system. Enjoy the 338 files
this repository has to offer.

# File listing

**[#.ts](./#.ts)** (parser): A parser for a programming language where every
instruction is a single symbol.

**[2048.ts](./2048.ts)**: A bot for running algorithms on the 2048 board found
(I believe) at https://2048game.com/.

**[README.ts](./README.ts)**: The README generator for this repo.

**[abort.ts](./abort.ts)** (promise, rewrite): A rewrite of AbortSignals with
Promise-like syntax and then-chaining.

**[animation.ts](./animation.ts)**: Draws a cool animation with points and lines
connecting them.

**[annotations.ts](./annotations.ts)**: Utilities for figuring out the relation
between pages annotated in a book when examined a few times and total percentage
of pages annotated in that same book.

**[any.ts](./any.ts)**: A value that returns itself for any and all operations.
Type: `any`.

**[await-with-generators.ts](./await-with-generators.ts)** (iterator, promise,
rewrite): Runs a generator function with async/await semantics in place of
fn\*/yield keywords.

**[bf.ts](./bf.ts)**: A brainf\*\*k parser, executor, and macro transformer.

**[binary.ts](./binary.ts)** (typesystem): A typed container for holding binary
data that can be sliced.

**[blackbaud.tsx](./blackbaud.tsx)**: A Blackbaud scraper that gets data in a
format kama sona can understand.

**[bookmark.ts](./bookmark.ts)**: Generates a bookmark file that can be imported
into Chrome.

**[bookmarklet.ts](./bookmarklet.ts)** (bookmarklet): Makes a javascript:
bookmarklet with URI safety from a string of JS code.

**[brainf.ts](./brainf.ts)** (parser): A brainf\*\*\* implementation and macro
expander.

**[cancel.ts](./cancel.ts)**: A signal that can be used to cancel things.

**[checker.ts](./checker.ts)** (parser, typesystem): A system that parses a
TypeScript string literal into an arithmetic expression and evaluates it.
Incomplete.

**[chrome-home.ts](./chrome-home.ts)** (bookmarklet): A JS shortcut that adds
proper keyboard shortcuts to StackBlitz and doubles the speed of a video in
YouTube when activated.

**[complex.ts](./complex.ts)**: An arbitrary precision complex number library.

**[conjuncts3.js](./conjuncts3.js)**: @ts-check

**[curry.ts](./curry.ts)** (typesystem): A TypeScript type for currying
functions.

**[debug.ts](./debug.ts)**: A `Debug<T>` type that outputs a human-readable
version of some TypeScript objects. Notably, it condenses the six-line `OkState`
and `ErrorState` types from parser-X.ts into a single string. It can also reduce
an array into a string, but that's a typical day at this point in the TypeScript
challenges.

**[decorators-old.test.ts](./decorators-old.test.ts)**: A class that unwraps its
value, whether it be a signal or plain value. Used to test `decorators`.

**[decorators-old.ts](./decorators-old.ts)**: A reactive system that uses
decorators instead of plain values.

**[deferred.test.ts](./deferred.test.ts)**: Tests for deferred.ts.

**[deferred.ts](./deferred.ts)** (promise, rewrite): A library for creating
Deferred objects. Compatible with the Promises A+ specification.

**[dominoes.ts](./dominoes.ts)** (game): An engine that automatically runs
dominoes games.

**[easy-jsx.tsx](./easy-jsx.tsx)**: A simple JSX implementation.

**[emitter-1.ts](./emitter-1.ts)** (events, promise, rewrite): A typed event
emitter that uses promises and async iterables instead of callbacks to manage
event listeners.

**[emitter-2.ts](./emitter-2.ts)**: A strongly types event emitter that uses
async generators.

**[enchants.ts](./enchants.ts)**: Sourced from
https://github.com/iamcal/enchant-order/blob/main/data.js

**[encode-uri.js](./encode-uri.js)**: Encodes standard input into a javascript:
bookmark.

**[enumerable-weak-set.ts](./enumerable-weak-set.ts)**: An enumerable WeakSet
created using WeakRefs.

**[env.d.ts](./env.d.ts)**: Declares modules without @types/... declarations.

**[exittable.ts](./exittable.ts)**: Runs function that can be exited from using
an early return mechanism powered by exceptions.

**[explicit-resource-management.ts](./explicit-resource-management.ts)**: An
implementation of the ECMAScript Explicit Resource Management proposal.

**[extension.ts](./extension.ts)** (rewrite): An implementation of the new Facet
library for CodeMirror v6.

**[fraction.ts](./fraction.ts)**: Expresses arbitrary precision fractions using
bigints.

**[gamma.ts](./gamma.ts)**: Adapted from npm's `gamma` to work with
`decimal.js`.

**[hooks.ts](./hooks.ts)** (rewrite): An implementation of React Hooks.

**[hurgschetax.ts](./hurgschetax.ts)**:
https://stackoverflow.com/a/37580979/17763661

**[imply.ts](./imply.ts)**: All boolean operations implemented from a single
IMPLY gate.

**[impossible.ts](./impossible.ts)** (proxy): Separates call and construct
signatures of an object using proxies.

**[instant-share.ts](./instant-share.ts)**: A test implementation of the "Share
with Students" chrome extension.

**[inventory.ts](./inventory.ts)**: Calculates the inventory sequence as
described in https://www.youtube.com/watch?v=rBU9E-ZOZAI.

**[iota.ts](./iota.ts)**: The simplest lambda calculus based language. Too bad
the advanced type checking breaks TSC.

**[iterator.ts](./iterator.ts)** (iterator, rewrite): An implementation of the
Iterator Helpers proposal.

**[js-in-ts.ts](./js-in-ts.ts)** (typesystem): An attempt to rewrite many of the
core JavaScript operations using only the TypeScript typesystem.

**[jsx.d.ts](./jsx.d.ts)**: JSX types that all JSX libraries in this project
use.

**[lambda-in-js.js](./lambda-in-js.js)** (untyped): Lambda calculus functions in
JavaScript.

**[lambda-js.dom-value.test.ts](./lambda-js.dom-value.test.ts)**: Places
textareas into a browser that allow for writing and running lambda calculus
code.

**[lambda-js.dom.test.ts](./lambda-js.dom.test.ts)**: Places textareas into a
browser that allow for writing and running lambda calculus code. This
automatically injects the S, K, and I functions, and compiles to a lambda
calculus expression rather than a number, pair, or other representation.

**[lambda-js.ts](./lambda-js.ts)** (parser): A parser and evaluator for lambda
calculus implemented using JavaScript code.

**[lambda-ts.ts](./lambda-ts.ts)** (parser, typesystem): A parser and evaluator
for lambda calculus implemented in the TS type system.

**[lambda.ts](./lambda.ts)** (typesystem): A lambda calculus parser that runs at
compile time and runtime.

**[language.ts](./language.ts)**: A parser for a custom language.

**[light-the-bulbs.ts](./light-the-bulbs.ts)**: An engine to discover solutions
to "Light the Bulbs" on zSnout.

**[linked-list.ts](./linked-list.ts)** (immutable): An immutable linked list
implementation.

**[lock-2.ts](./lock-2.ts)**: A simple lock that only allows one function to
acquire it at a time.

**[lock-with-data.ts](./lock-with-data.ts)**: A lock that stores some data. Its
data can only be read and written to during an exclusive operation.

**[lock.ts](./lock.ts)**: A lock that can only be used by one activity at a
time.

**[log-and-bound.ts](./log-and-bound.ts)**: Experiments with ECMAScript
decorators, as they're finally at stage 3!

**[log-everything.ts](./log-everything.ts)**: Creates a Proxy around an object
that logs any time an action involving it happens. This can be useful for
testing ECMAScript internal methods and other making sure polyfills emulate the
exact behavior of their standardized counterparts.

**[logged.test.ts](./logged.test.ts)**: A test file for the @logged decorator.

**[logged.ts](./logged.ts)**: A decorator that logs all kinds of events.

**[logic.ts](./logic.ts)** (typesystem): Boolean operations implemented in the
TS type system from a single NAND gate.

**[map.ts](./map.ts)** (rewrite, symbol): A Map implementation that stores its
values as symbols.

**[math.ts](./math.ts)** (typesystem): Mathematical functions implemented in the
TS typesystem.

**[matrix.ts](./matrix.ts)**: A Matrix class that can be added, subtracted, and
multiplied.

**[media.js](./media.js)**: Captures clicks on AirPods 3 or AirPods Pro using a
video and the mediaSession API.

**[memo.ts](./memo.ts)**: A decorator that memoizes a function's arguments and
return value.

**[minesweeper.ts](./minesweeper.ts)**: A clone of Google's Minesweeper, with an
AI built in.

**[monad.ts](./monad.ts)**: An exploration into various monads. Unfinished.

**[nand.ts](./nand.ts)**: All boolean logic gates implemented from a single NAND
gate.

**[nullclass.ts](./nullclass.ts)**: A class that has no members to get around
the issues with `class extends null` in browsers.

**[numerical-stack.ts](./numerical-stack.ts)**: A Stack implementation that only
accepts numbers.

**[old-lang.ts](./old-lang.ts)** (parser): An attempt to parse a language using
the arcsecond library.

**[old-result.ts](./old-result.ts)**: A Result monad.

**[once.ts](./once.ts)**: Wraps a function and only allows it to be called once.

**[option.ts](./option.ts)**: An Option monad.

**[private.ts](./private.ts)**: A class that stores private data.

**[promises.ts](./promises.ts)** (promise): A promise extension with more
methods.

**[promisify.ts](./promisify.ts)** (promise, rewrite): A typed promisify
function.

**[puppeteer.ts](./puppeteer.ts)**: A wrapper for puppeteer.

**[quaternions.ts](./quaternions.ts)**: A library for adding, subtracting, and
multiplying quaternions.

**[queue-2.ts](./queue-2.ts)**: Another async generator that yields queued
values.

**[queue-sync.ts](./queue-sync.ts)**: A queue that holds values until they're
ready to be released.

**[queue.ts](./queue.ts)**: An async generator that yields queued values.

**[random-item.ts](./random-item.ts)**: Picks a random item from an array.

**[random-path.ts](./random-path.ts)**: Makes a random path in 1D, 2D, or 3D.

**[random-surfer.ts](./random-surfer.ts)**: Randomly surfs web pages to discover
the probability of finding certain pages in a network.

**[result-2.ts](./result-2.ts)**: An Option<T> class similar to Rust's Option
type.

**[result.ts](./result.ts)**: A generic result type that can express a possibly
failed result.

**[sandpiles.ts](./sandpiles.ts)**: A library for adding sand piles as described
in a Numberphile video. https://www.youtube.com/watch?v=1MtEUErz7Gg

**[sarcastic-text.test.tsx](./sarcastic-text.test.tsx)**: An HTML page that
shows a demo of the sArCaStIcIfY function.

**[sarcastic-text.ts](./sarcastic-text.ts)**: Makes text look sArCaStIc.

**[secrets.ts](./secrets.ts)**: Sample code that is a mockup for chapter 1 of
Brilliant's cryptocurrency course.

**[sequent.ts](./sequent.ts)**: A parser and evaluator for boolean logic and
sequent calculus.

**[shadow-dom.ts](./shadow-dom.ts)**: A library for working with the shadow DOM
using decorators.

**[shuffle.ts](./shuffle.ts)**: Utility function that shuffles an array.

**[solid.ts](./solid.ts)**: Another reactive library.

**[spot-it.ts](./spot-it.ts)**: Generates Spot It! decks mathematically.

**[stack.ts](./stack.ts)**: A generic Stack in JavaScript.

**[string-cooked.ts](./string-cooked.ts)**: A String.cooked function for use
until the proposal is implemented.

**[string.ts](./string.ts)** (typesystem): String.split and Array.join, but in
the TS typesystem.

**[sudoku.ts](./sudoku.ts)**: An interactive Sudoku game.

**[tee-2.ts](./tee-2.ts)**: Tees an iterable into two iterables while keeping
memory costs low. OOP style.

**[tee.ts](./tee.ts)**: Tees an iterable into two iterables while keeping memory
costs low. Functional style.

**[tetration.ts](./tetration.ts)**: Tetration is repeated exponentiation. It is
defined for any base `a` and any natural "exponent" `n` as the following: a^^0 =
1, a^^n = a^(a^^(n-1)). However, it can be extended to complex exponents using
formulas. One of these such extensions is available on MathOverflow at
https://mathoverflow.net/a/259371. This file implements the extension proposed
there. I'd provide an accompanying Desmos graph, but Desmos doesn't understand
tetration.

**[the-bulba-game.ts](./the-bulba-game.ts)**: A board generator for a fun game.

**[tick-oat-two.ts](./tick-oat-two.ts)**: An AI for the TickoaTTwo game created
by Oats Jenkins: https://www.youtube.com/watch?v=ePxrVU4M9uA

**[toki-pona-names.ts](./toki-pona-names.ts)**: Generates random toki pona-style
names.

**[ts-function.ts](./ts-function.ts)**: Creates functions that can be run either
at compile time or run time.

**[ttt-ai.ts](./ttt-ai.ts)**: A class-based TicTacToe implementation.

**[type-safe.ts](./type-safe.ts)**: A library of functions that run at compile
time and runtime.

**[typed-timeout.ts](./typed-timeout.ts)** (rewrite): A typed setTimeout
function and class.

**[typeof.ts](./typeof.ts)** (typesystem): Converts TS types into string
representations.

**[validator-1.ts](./validator-1.ts)**: A type-first validator with full typing
support.

**[validator-2.ts](./validator-2.ts)**: An item validator with static typing
support.

**[validator-3.ts](./validator-3.ts)**: Another validator. This one doesn't
really support anything.

**[weak-valued-map.ts](./weak-valued-map.ts)**: A weakly valued map that
automatically removes entries when they are garbage collected.

**[webauthn.test.tsx](./webauthn.test.tsx)**: An HTML page that experiments with
the WebAuthn API.

**[wikipedia.ts](./wikipedia.ts)**: An engine that can look through Wikipedia
links.

**[wordle.ts](./wordle.ts)**: Everything is strings of characters to avoid
Unicode weirdness.

**[worker-1.ts](./worker-1.ts)**: A simple way to run functions off the main
thread with one-way or bi-directional communication.

**[worker-2.ts](./worker-2.ts)**: A simple interface for working with web
workers.

**[yet-another-js-framework.tsx](./yet-another-js-framework.tsx)**: Yet another
JS framework.

**[ytm-playlist-urls-only.ts](./ytm-playlist-urls-only.ts)**: Prints the URLs to
audio files of a YouTube playlist. To run it, type
`zsh node $(esbuild ytm-playlist-urls-only.ts) -- "YOUR_PLAYLIST_URL" `

**[ytm-playlist.ts](./ytm-playlist.ts)**: Downloads a YouTube playlist as MP3
files.

**[animator/action.ts](./animator/action.ts)**: `Action` type and helpers such
as `all` and `sequence` for Animator.

**[animator/color.ts](./animator/color.ts)**: Color type and helpers for
Animator.

**[animator/html.ts](./animator/html.ts)**: A short function that constructs
HTML elements for Animator.

**[animator/node.ts](./animator/node.ts)**: A renderable Node used in Animator.

**[animator/preview.ts](./animator/preview.ts)**: A previewer for Animator.

**[animator/rect.ts](./animator/rect.ts)**: A rectangle renderer for Animator.

**[animator/scene.ts](./animator/scene.ts)**: View and Scene classes for
Animator.

**[animator/tick.ts](./animator/tick.ts)**: A tick function that resolves after
calling `requestAnimationFrame`.

**[animator/transition.ts](./animator/transition.ts)**: Basic timing functions
and interpolators for Animator.

**[animator/value.ts](./animator/value.ts)**: Stores and store getters for
Animator.

**[animator/vector.ts](./animator/vector.ts)**: A Vector type and helpers for it
for Animator.

**[animator/scenes/colors.ts](./animator/scenes/colors.ts)**: An Animator scene
with colored rectangles.

**[desmos/expression-parser.ts](./desmos/expression-parser.ts)**: Parses simple
math expressions.

**[desmos/playground.tsx](./desmos/playground.tsx)**: A playground which allows
expressions to be typed and converted into Desmos-compatible LaTeX. It
automatically detects complex numbers and replaces their operations (\*, ^, exp,
ln) with c_mult, c_pow, c_exp, and other functions to easily allow the typing of
complex expressions in Desmos.

**[desmos/print-ast.ts](./desmos/print-ast.ts)**: Prints the AST of an
expression.

**[desmos/print-latex.ts](./desmos/print-latex.ts)**: Prints an expression as
LaTeX.

**[desmos/types.ts](./desmos/types.ts)**: Constants defining the reserved names
and functions of Desmos.

**[genesis/core.ts](./genesis/core.ts)**: The core of a fine-grained reactivity
library.

**[genesis/derived.ts](./genesis/derived.ts)**: Derived Genesis stores.

**[genesis/dom.ts](./genesis/dom.ts)**: Reactive DOM components.

**[genesis/for.ts](./genesis/for.ts)**: A Genesis component that renders a list
of items.

**[genesis/index.ts](./genesis/index.ts)**: A next-gen fine-grained reactivity
system and component library.

**[genesis/maybe.ts](./genesis/maybe.ts)**: A Genesis component to conditionally
render an object.

**[genesis/stores.ts](./genesis/stores.ts)**: Genesis stores to track values,
objects, and computed properties.

**[ithkuil-3/tokenize/formative.ts](./ithkuil-3/tokenize/formative.ts)**: (H?
V)? C V C (VC...) (VH)? V? (H? V)? C V (CV...) CG (VC...) (VH)? V?

**[ithkuil-4/els.ts](./ithkuil-4/els.ts)**: const source = ["2x+1", "x+y",
"2y+1", "x-2", "y-6", "9"]

**[javascript-weirdness/missing-private-fields.ts](./javascript-weirdness/missing-private-fields.ts)**
(x): Creates a class object which is missing one of its private fields it's
supposed to have, leading to issues with ` in instance`.

**[javascript-weirdness/private-fields-on-plain-objects.ts](./javascript-weirdness/private-fields-on-plain-objects.ts)**:
Utilities for creating private fields on plain objects. As is noted in the
proposal (tc39/proposal-class-fields), private fields are really syntax sugar
for WeakMaps, so this is allowed.

**[jsx/esbuild.ts](./jsx/esbuild.ts)**: / <reference types="./lib/env" />

**[lang/parse-sheet.ts](./lang/parse-sheet.ts)**: Parses CSV data from the
Lexicon spreadsheet linked below:
https://docs.google.com/spreadsheets/d/1qpxvttgr-3KufzZU9b5sFkOF6pr8elWyKmr7xkjP-Ds/edit

**[motion/action.ts](./motion/action.ts)**: An action type and helpers for
Motion.

**[motion/animation.ts](./motion/animation.ts)**: Basic animation functions for
Motion.

**[motion/html.ts](./motion/html.ts)**: A constructor for HTML elements for
Motion.

**[motion/mapped-signal.ts](./motion/mapped-signal.ts)**: A mapped signal type
for Motion.

**[motion/node.ts](./motion/node.ts)**: A drawable node for Motion scenes.

**[motion/point.ts](./motion/point.ts)**: A Point type and signal for Motion.

**[motion/preview.ts](./motion/preview.ts)**: A previewer for Motion scenes.

**[motion/rect.ts](./motion/rect.ts)**: A rectangle node for Motion.

**[motion/scene.ts](./motion/scene.ts)**: A scene runner for Motion.

**[motion/signal.ts](./motion/signal.ts)**: A signal implementation designed
specifically for animations.

**[motion/view.ts](./motion/view.ts)**: A view manager for Motion.

**[motion/scenes/rectangles.ts](./motion/scenes/rectangles.ts)**: A Motion scene
using rectangles.

**[nimbus/h.ts](./nimbus/h.ts)**: / <reference types="../jsx.js" />

**[nimbus/render.ts](./nimbus/render.ts)**: / <reference types="../jsx.js" />

**[observable/index.ts](./observable/index.ts)**: An implementation of the
Observable proposal.

**[observable/test.ts](./observable/test.ts)**: Runs es-observable-tests on the
Observable implementation.

**[parsers/parser-1.ts](./parsers/parser-1.ts)** (parser): A general Parser and
Result class that can be used to parse languages.

**[parsers/parser-2.ts](./parsers/parser-2.ts)** (parser): An improved system
for parsing text.

**[parsers/parser-3.test.ts](./parsers/parser-3.test.ts)** (parser, test): The
test script for parser.ts.

**[parsers/parser-3.ts](./parsers/parser-3.ts)** (parser): Another improved
system for parsing text. Slightly based on Arcsecond.

**[parsers/parser-4.test.ts](./parsers/parser-4.test.ts)**: Parses expressions
using [parser-4.ts](./parser-4.ts).

**[parsers/parser-4.ts](./parsers/parser-4.ts)** (parser): Yet another system
for parsing text.

**[parsers/parser-5.dom.test.ts](./parsers/parser-5.dom.test.ts)**: Puts
textareas into the DOM that can be used to test parser-5.peg.test.ts.

**[parsers/parser-5.jest.test.ts](./parsers/parser-5.jest.test.ts)**: Tests for
parser-5.

**[parsers/parser-5.peg.test.ts](./parsers/parser-5.peg.test.ts)**: Parsers
PEG-style grammars into a parser-5 style grammar.

**[parsers/parser-5.perchance.test.ts](./parsers/parser-5.perchance.test.ts)**
(parser, rewrite): A replica of perchance's parser and runner. May have a
different feature set.

**[parsers/parser-5.ts](./parsers/parser-5.ts)** (parser): A fifth system for
parsing text.

**[parsers/parser-6.arithmetic.test.ts](./parsers/parser-6.arithmetic.test.ts)**:
Parser arithmetic using parser-6.ts.

**[parsers/parser-6.ts](./parsers/parser-6.ts)**: A text parser based on results
and coroutines.

**[parsers/parser-7.ts](./parsers/parser-7.ts)** (typesystem): An (extremely)
type safe system for parsing text. Works with `--noEmit`.

**[parsers/parser-7.types.ts](./parsers/parser-7.types.ts)**: Extra types for
parser-7.

**[regex/index-precise.ts](./regex/index-precise.ts)**: @ts-nocheck

**[scheduler/time.ts](./scheduler/time.ts)**: A `Time` class that stores hours
and minutes. Can be used to create random times, convert a time to a date, or
create a range of random times.

**[signal/decorators.ts](./signal/decorators.ts)**: Decorators that make working
with signals in classes easy.

**[signal/index.ts](./signal/index.ts)**: Another implementation of signals.

**[signal/impls/01-svelte-stores.ts](./signal/impls/01-svelte-stores.ts)**
(rewrite): An implementation of Svelte stores.

**[signal/impls/02-solid-stores.ts](./signal/impls/02-solid-stores.ts)**
(rewrite): An implementation of SolidJS's signals, effects, and memos.

**[signal/impls/03-tiny-store.ts](./signal/impls/03-tiny-store.ts)**: A simple
signal, effect, memo, and computed library based on SolidJS.

**[signal/impls/04-stores.ts](./signal/impls/04-stores.ts)**: An implementation
and comparison of stores from multiple frameworks, each with: `derived`, which
creates a store whose value is computed based on other stores; `effect`, which
runs an effect when the values of one or more stores change; `get`, which
retrieves the value of a store; `readable`, which creates a store that is
read-only; `untrack`, which performs a side effect on multiple stores without
subscribing to them; and `writable`, which creates a store that is readable and
writable.

**[signal/impls/05-signal.ts](./signal/impls/05-signal.ts)**: A signal
implementation featuring effects, signals, memos, caching, `untrack`, `batch`,
and unsubscribing.

**[signal/impls/06-signal-decorators.ts](./signal/impls/06-signal-decorators.ts)**:
A set of decorators that make working with signals, memos, and effects easier.

**[signal/impls/07-reactive-js.ts](./signal/impls/07-reactive-js.ts)**: A
library with reactive primitives

**[signal/impls/08-minimal.ts](./signal/impls/08-minimal.ts)**: A minimal
implementation of signals that assumes effects will never throw.

**[signal/impls/09-with-roots.ts](./signal/impls/09-with-roots.ts)**: A signal
implementation that allows for cleanup functions.
