
all: cmd/compile.wasm cmd/gofmt.wasm cmd/link.wasm

cmd/compile.wasm:
	cd $(shell go env GOROOT)/src/cmd/compile && GOOS=js GOARCH=wasm go build -o $(CURDIR)/cmd/compile.wasm .

cmd/gofmt.wasm:
	cd $(shell go env GOROOT)/src/cmd/gofmt && GOOS=js GOARCH=wasm go build -o $(CURDIR)/cmd/gofmt.wasm .

cmd/link.wasm:
	cd $(shell go env GOROOT)/src/cmd/link && GOOS=js GOARCH=wasm go build -o $(CURDIR)/cmd/link.wasm .

pkg:
	./build_pkgs.sh fmt