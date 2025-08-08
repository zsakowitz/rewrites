failures of the first language:

- didn't consider all types early enough, so coercions were an afterthought and
  generics didn't exist at all
- no guarantee on code execution order and short-circuiting
- almost no fns could be made constant
- standard library definitions were a mess
- ways to interact with external JS were an afterthought
- zero ways for draggables to work
- every emit target was hardcoded, but we need 3-5 targets (glsl, js w/ inexact
  fractions, js w/ exact fractions, possibly webgpu and dcg in the future)
- optimization was entirely manual (@+, @mix, etc.)
- zero support for recursion
- like four ways to name functions
- strings barely work
- no way to preserve error locations from latex
- only one error at a time
- every function is exposed to calculator
- global `use`

good things of the first language:

- operator overloading
- broadcast operators
- prettier

how do we do better?

- write std in the language itself
- ban recursive functions from shaders, but allow them to be written
- only `pub fn` are shown in calculator
- ensure code is executed in a defined order
- better prettier algos
- collect errors in some structure, and throw them once at the end

how are we going to store types?

- some fundamental types need to exist: bool, num, void, str
- add tuple types as a core construct
- instead of void, we'll have the empty tuple `()`

how are we going to play games? how do we do type-associated consts and types?

```rs
trait Game {
  type Move;

  fn make_move(&mut self, mv: Move);
  fn undo_move(&mut self, mv: Move);
}
```

do we want a trait system? maybe:

```nya
trait Point2D {
  fn x(x: Self) -> num;
  fn y(x: Self) -> num;
}

// impl is minimal since fn declarations would exist elsewhere
impl Point2D: (num, num);
impl Point2D: Complex;
```

## on numbers and games

if we have traits, games come somewhat naturally:

```nya
trait Game {
  type Move;

  fn gen_moves(game: Self) -> [Self::Move];
  fn make_move(ref game: Self, mv: Self::Move);
  fn undo_move(ref game: Self, mv: Self::Move);
}

struct LemonGame {
  x: num,
  y: num,
}

type Move for LemonGame = (num, num);

fn gen_moves(game: LemonGame) -> [(num, num)] {
  let mut ret = [] :: [(num, num)];

  for i in 1..=game.x {
    ret.push((i, 0));
  }

  for i in 1..=game.y {
    ret.push((0, i));
  }

  for i in 1..=min(game.x, game.y) {
    ret.push((i, i));
  }

  ret
}

fn make_move(ref game: LemonGame, move: Move) {
  game.x -= move.x;
  game.y -= move.y;
}

fn undo_move(ref game: LemonGame, move: Move) {
  game.x += move.x;
  game.y += move.y;
}
```

if we do that, how do arrays of games work? bc `[lemon, nim]` would be an array
of distinct types.

or we could have games as an enum of sorts, but that seems painful to extend.
