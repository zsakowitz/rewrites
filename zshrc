# A .zshrc that includes useful functions for working with this repository.

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

alias o="ZSNOUT_DATABASE='' ZSNOUT_MAIL_HOST='' d"      # Run offline
alias cli="npm run cli"                                 # zSnout CLI

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

  mkdir -p "$HOME/tmp"
  rm "$HOME/tmp/node_modules" 2> "/dev/null"
  ln -s "$PWD/node_modules" "$HOME/tmp/node_modules"
  npx esbuild $@ > "$HOME/tmp/${@[-1]:t:r}.mjs"
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
##     maybe-space $USER_SPECIFIED_FLAGS --flag default_value
##     maybe-space $USER_SPECIFIED_FLAGS --format esm
##     maybe-space $USER_SPECIFIED_FLAGS --platform node

maybe-space() {
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
    $(maybe $args --format       esm  ) \
    $(maybe $args --tree-shaking false) \
    $(maybe $args --platform     node ) \
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

  echo "<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'><title>${@[-1]:t}</title></head><body><script type='module' src='/${@[-1]:t:r}.js'></script></body></html>" > "$HOME/tmp/index.html"

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

## Bundles an input file using TSC, then puts the output file into a given
## esbuild function, such as bundle, copy, minify, serve, or use.
##   Alternatively, run `tsc pure` to bundle the input files and output the names
## of the output files without passing them into esbuild.
##   This can be useful when one wants to use relatively new TSC features, such
## as proper ES decorators, which were released in the TSC 5.0 beta long before
## esbuild added them.
##
##     tsc (bundle|copy|minify|pure|serve|use) [tsc-options] <entry>
##     tsc bundle src/index.ts
##     tsc pure src/index.ts

tsc() {
  if [[ -z "$2" ]]; then
    echo "usage:   tsc (bundle|copy|minify|pure|serve|use) [tsc-options] <file>"
    echo "example: tsc bundle src/index.ts"
    return
  fi

  args="${@:2}"
  rm -rf "$HOME/tmp"
  mkdir -p "$HOME/tmp"
  npx tsc \
    $(maybe-space $args --allowJs true) \
    $(maybe-space $args --allowSyntheticDefaultImports true) \
    $(maybe-space $args --checkJs true) \
    $(maybe-space $args --moduleResolution node) \
    $(maybe-space $args --jsx react) \
    $(maybe-space $args --jsxFactory h) \
    $(maybe-space $args --jsxFragmentFactory f) \
    $(maybe-space $args --module esnext) \
    $(maybe-space $args --noFallthroughCasesInSwitch true) \
    $(maybe-space $args --noUncheckedIndexedAccess true) \
    $(maybe-space $args --skipLibCheck true) \
    $(maybe-space $args --strict true) \
    $(maybe-space $args --strictFunctionTypes true) \
    $(maybe-space $args --target es2022) \
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
