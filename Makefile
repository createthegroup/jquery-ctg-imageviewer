MAKEFLAGS = --no-print-directory --always-make
MAKE = make $(MAKEFLAGS)

BUILDDIR = build
SRCDIR   = src

SRC_FILE      = src/jquery.ctg.imageViewer.js
MINIFIED_FILE = jquery.ctg.imageViewer.min.js

CLOSUREURL  = http://closure-compiler.googlecode.com/files/compiler-latest.zip
CLOSUREDIR  = $(BUILDDIR)/closure
CLOSUREFILE = $(CLOSUREDIR)/compiler.jar

all:
	$(MAKE) clean;
	$(MAKE) build;

minify:
	java -jar $(CLOSUREFILE) --js_output_file=$(MINIFIED_FILE) --js=$(SRC_FILE);

build:
	$(MAKE) minify;

build-update:
	$(MAKE) build-remove;
	mkdir $(BUILDDIR) $(CLOSUREDIR);
	cd $(CLOSUREDIR); curl -L $(CLOSUREURL) > file.zip; tar -xf file.zip; rm -rf $(CLOSUREDIR)/file.zip

build-remove:
	rm -rf $(BUILDDIR);

clean:
	rm -f $(MINIFIED_FILE);