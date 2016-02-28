.PHONY: all clean

all: build/index.html build/script.js

clean:
	rm -rf build

build/index.html: src/index.html build
	cp $< $@

build/script.js: src/script.js build .babelrc node_modules/.bin/babel
	time node_modules/.bin/babel -o $@ $<

build:
	mkdir build

node_modules/.bin/babel:
	npm install
