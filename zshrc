# A .zshrc that includes useful functions for working with this repository. For
# example, you can copy the bundled contents of a TypeScript file using:
#
#     copy my-file.ts


# Alternatively, you can create a TSX file which puts DOM nodes into
# document.body, and quickly load it into a new browser window with:
#
#     serve my-file.ts


# Normally, we compile code with esbuild, which has the added benefit of
# bundling all of the packages a given file imports into a single file, which
# can then easily be copied into a browser window. However, esbuild sometimes
# doesn't support the latest TypeScript code. For example, `infer X extends Y`
# was broken during the TypeScript beta releases, when TSC supported the syntax
# but esbuild didn't.
#
# When esbuild doesn't support a given syntax, you can choose to precompile with
# TSC (before bundling, minifying, or serving through esbuild) by prepending
# `tsc` to any multi-letter command here.
#
#     tsc copy my-file.ts
#     tsc serve my-file.ts
#
# Note that this isn't the default because it may be significantly buggier and
# slower than using esbuild directly.


## Single character aliases for common operations

alias b="npm run build"                                 # Build
alias d="npm run dev"                                   # Dev
alias i="node --inspect ."                              # Inspect
alias p="npm run preview"                               # Preview
alias s="npm run serve"                                 # Serve
alias t="npm run test"                                  # Test
alias u="git reset --soft HEAD~1"                       # Undo last commit
alias w="npm run watch"                                 # Watch
alias pub="npm publish --access=public"                 # Publish

## Creates the `~/tmp` folder if it doesn't exist and symlinks the current
## `node_modules` directory into it.
##
##     ensure_tmp_exists

ensure_tmp_exists() {
  mkdir -p "$HOME/tmp"
  rm "$HOME/tmp/node_modules" 2> "/dev/null"
  mkdir -p "$HOME/tmp"
  ln -s "$PWD/node_modules" "$HOME/tmp/node_modules"
}

## Builds a file into ~/tmp using esbuild, then echoes the name of the output file.
##
##     esbuild [options] <entry>
##     esbuild src/index.ts
##     esbuild --bundle --format esm src/index.ts

esbuild() {
  if [[ -z $1 ]]; then
    echo "usage:   esbuild [options] <entry>"
    echo "example: esbuild src/index.ts"
    return
  fi

  ensure_tmp_exists
  npx esbuild $@ --outfile="$HOME/tmp/${@[-1]:t:r}.mjs" 2> "/dev/null"
  echo "$HOME/tmp/${@[-1]:t:r}.mjs"
}

## Conditionally echoes a build flag in esbuild style (--flag=value). Note that
## the echoed output contains "=".
##
##     maybe $USER_SPECIFIED_FLAGS --flag default_value
##     maybe $USER_SPECIFIED_FLAGS --format esm
##     maybe $USER_SPECIFIED_FLAGS --platform node

maybe() {
  if [[ "$1" != *"$2"* ]]; then
    echo "$2=$3"
  fi
}

## Conditionally echoes a build flag in tsc style (--flag value). Note that the
## echoed output contains " ".
##
##     maybe_space $USER_SPECIFIED_FLAGS --flag default_value
##     maybe_space $USER_SPECIFIED_FLAGS --format esm
##     maybe_space $USER_SPECIFIED_FLAGS --platform node

maybe_space() {
  if [[ "$1" != *"$2"* ]]; then
    echo "$2 $3"
  fi
}

## Bundles an input file into an ES module using esbuild.
##
##     bundle [options] <entry>
##     bundle src/index.ts

bundle() {
  if [[ -z $1 ]]; then
    echo "usage:   bundle [options] <entry>"
    echo "example: bundle src/index.ts"
    return
  fi

  args="$@"

  esbuild --bundle \
    $(
      if [[ $PWD == *kama-sona* ]]; then
        echo "--alias:\$env/static/private=$HOME/env.js" "--alias:\$env/static/public=$HOME/env.js"
      fi
    ) \
    $(maybe $args --format       esm      ) \
    $(maybe $args --tree-shaking false    ) \
    $(maybe $args --platform     node     ) \
    $(maybe $args --metafile     "$HOME/tmp/meta.json") \
    --loader:.woff2=file \
    --loader:.woff=file \
    --loader:.ttf=file \
    $@
}

## Bundles an input file into an ES module using esbuild, then copies the
## result.
##
##     copy [options] <entry>
##     copy src/index.ts

copy() {
  if [[ -z $1 ]]; then
    echo "usage:   copy [options] <entry>"
    echo "example: copy src/index.ts"
    return
  fi

  cat $(bundle $@) | pbcopy
}

## Minifies an input file into an ES module using esbuild.
##
##     minify [options] <entry>
##     minify src/index.ts

minify() {
  if [[ -z $1 ]]; then
    echo "usage:   minify [options] <entry>"
    echo "example: minify src/index.ts"
    return
  fi

  bundle --minify --tree-shaking=true $@
}

## Bundles an input file into an ES module using esbuild, then starts a server
## that serves an HTML page which runs the bundled file.
##
##     serve [options] <entry>
##     serve src/index.ts

serve() {
  if [[ -z $1 ]]; then
    echo "usage:   serve [options] <entry>"
    echo "example: serve src/index.ts"
    return
  fi

  ensure_tmp_exists

  echo "<!DOCTYPE html>
<html lang=\"en\">
  <head>
    <meta charset=\"utf-8\" />
    <title>${@[-1]:t}</title>
    <style>
      *,
      ::before,
      ::after {
        box-sizing: border-box;
      }
    </style>
    <link rel=\"stylesheet\" href=\"/${@[-1]:t:r}.css\" />
  </head>
  <body>
    <script type=\"module\" src=\"/${@[-1]:t:r}.mjs\"></script>
  </body>
</html>" > "$HOME/tmp/index.html"

  bundle "--servedir=$HOME/tmp" $@
}

## Minifies an input file into an ES module using esbuild, then opens NodeJS
## and puts the module's exports into the global "M" variable.
##
##     use [options] <entry>
##     use src/index.ts

use() {
  if [[ -z $1 ]]; then
    echo "usage:   use [options] <entry>"
    echo "example: use src/index.ts"
    return
  fi

  NAME=$(bundle $@)
  node -i -e "import('$NAME').then(module => global.M = module)"
}

## Minifies an input file into an ES module using esbuild, then opens NodeJS
## and imports the module.
##
##     run [options] <entry>
##     run src/index.ts

run() {
  if [[ -z $1 ]]; then
    echo "usage:   run [options] <entry>"
    echo "example: run src/index.ts"
    return
  fi

  NAME=$(bundle $@)
  node -e "import('$NAME')"
}

## Bundles an input file using TSC, then puts the output file into a given
## esbuild function, such as bundle, copy, minify, serve, or use.
##   Alternatively, run `tsc pure` to bundle the input files and output the names
## of the output files without passing them into esbuild.
##   This can be useful when one wants to use relatively new TSC features, such
## as proper ES decorators, which were released in the TSC 5.0 beta long before
## esbuild added them.
##
##     tsc (bundle|copy|minify|pure|run|serve|use) [tsc-options] <entry>
##     tsc bundle src/index.ts
##     tsc pure src/index.ts

tsc() {
  if [[ -z "$2" ]]; then
    echo "usage:   tsc (bundle|copy|minify|pure|run|serve|use) [tsc-options] <file>"
    echo "example: tsc bundle src/index.ts"
    return
  fi

  args="${@:2}"
  rm -rf "$HOME/tmp"
  mkdir -p "$HOME/tmp"
  npx tsc \
    $(maybe_space $args --allowJs true) \
    $(maybe_space $args --allowSyntheticDefaultImports true) \
    $(maybe_space $args --checkJs true) \
    $(maybe_space $args --moduleResolution node) \
    $(maybe_space $args --jsx react) \
    $(maybe_space $args --jsxFactory h) \
    $(maybe_space $args --jsxFragmentFactory f) \
    $(maybe_space $args --module esnext) \
    $(maybe_space $args --noFallthroughCasesInSwitch true) \
    $(maybe_space $args --noUncheckedIndexedAccess true) \
    $(maybe_space $args --skipLibCheck true) \
    $(maybe_space $args --strict true) \
    $(maybe_space $args --strictFunctionTypes true) \
    $(maybe_space $args --target es2022) \
    --outDir "$HOME/tmp" ${@:2}

  if [[ $1 == "pure" ]]; then
    echo $HOME/tmp/**/*
  else
    $1 "$HOME/tmp/${@[-1]:t:r}.js"
  fi
}

## Works like `use`, but specifically designed for Prisma Client.

prisma() {
  node -i -e "import('@prisma/client').then(module => (global.M = new module.PrismaClient, M.\$connect()))"
}
