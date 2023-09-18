# wasm-go-playground

This is the Go compiler ("gc") compiled for WASM, running in your browser! It can be used to run a simple playground, à la [play.golang.org](https://play.golang.org/) entirely in your browser, but generally means you can compile any pure Go in the browser to run in the browser. 

You can try it out here: https://progrium.github.io/wasm-go-playground

This fork is updated with a newer version of Go (1.21.1) and is for experimentation and demonstration. It has some but not all of the standard library available. Also, since the creation of the original upstream, Safari now seems to work reasonably fast, though still slower than Chrome and Firefox. Build time is now output in the console.

## How it works

Most of the top level source files are modified bits and pieces from [play.golang.org](https://play.golang.org/) for the web interface. The `wasm_exec.js` file is the standard `wasm_exec.js` that comes with Go, but with an extension in `wasm_extra.js` for a simple in-memory virtual filesystem implementation. The `index.html` file orchestrates the build with an `exec` function that works pretty similar to a typical `exec`, but taking a WASM binary executable blob fetched from the `cmd` directory. 

The files under `cmd` are made from `compile`, `link`, and `gofmt` in `$GOROOT/src/cmd` by running `GOOS=js GOARCH=wasm go build .` in each directory. These are tools under the `go tool` command, which give you a lower level interface to the `go build` process. These are orchestrated almost like you would on the command line in `index.html` using `exec`, running `compile` and `link` with a generated `importcfg` file. All these WASM modules are run using the virtual filesystem. The playground user source is put into a `main.go` and then after `compile` and `link` are run, an `a.out` executable is written to the virtual filesystem and then run itself with `exec`.

Also written into the virtual filesystem are the pre-compiled packages under `pkg`. These archives are of the standard library packages, but are a bit trickier to produce with the new Go build caching system added since the upstream version. The included `build_pkgs.sh` script takes a standard library package name and runs go install, leaving the temporary work directory around to get all the package archive files made in the process, using their `importcfg` files to identify them. These files are currently hardcoded in `index.html`. Most notably, the first `importcfg` file created specifies what packages are needed for the playground user code. At the moment, `runtime`, `fmt`, `os`, and `syscall/js` are hardcoded, so those are the only packages that can be imported. You can add more to the `importcfg` but if the package archive isn't already under `pkg` you'll have to run `build_pkgs.sh` to produce them. 

