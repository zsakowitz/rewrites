**Prettier 2.8.3**
[Playground link](https://prettier.io/playground/#N4Igxg9gdgLgprEAucAbAhgZ0wAgApwBOm0OwAOlDjgAIAUAtgJ4Aickh6MEhAgoZyYBtAAwBdAJSVqAc0Jw4MOhLIBfSuqggANCAgAHGAEtomZKHQCIAdzyWEZlOlTX0TM7oBGnMAGtFAMroDHAAMkZQcMgAZs6YcF4+-jAB+uhgETLIMIQArgkgcAyecAAmpWWh6FAyuegycABiPAxcxjXIIOi53DogABYwDKgA6v1G8JhpYHABDhNGAG4TTJ1g2H0R8YQweJwyrTFxBQBWmAAeAZmocACKuRDwR6jxumnERJ0wTPpwmGCEIyGPr6QGwEZGUowfrIAAcIjehAg8RGnH0nVBfyIiyiugAjg94HsDI4upgALSRMplPryAlGeR7eqHJCxF4FeIMIzZPIc65wXgwHJGTw9OAEQjhSLPV4gTD8+6PKKs466GDoTwQqEwpAAJjVnCMqEyAGEIAwWYVMABWPq5eIAFQ1jjZssW+QAklAKrAAgCgTBeN6At8bjK4KpVEA)

<!-- prettier-ignore -->
```sh
--parser typescript
```

**Input:**

<!-- prettier-ignore -->
```tsx
class Person {
  @(myDecoratorArray[0])
  greet() {}
}

```

**Output:**

<!-- prettier-ignore -->
```tsx
class Person {
  @myDecoratorArray[0]
  greet() {}
}

```

**Why is this wrong?** In the original script, the `Person` class has a single member: a `greet` method decorated with `myDecoratorArray[0]`. The output has very different code. The `Person` class now has two members:

- a `greet` method with _zero_ decorators, and
- a computed property (`0`) decorated with `myDecoratorArray`.

**Expected behavior:** The output should be the same as the input, with the decorator properly enclosed in parentheses.
