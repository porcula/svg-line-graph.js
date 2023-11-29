SHELL=sh

default: svg_line_graph.mod.js svg_line_graph.min.js check

install-node-modules:
	npm install uglify-js node-static open

check:
	node --check *.js

svg_line_graph.min.js: svg_line_graph.js
	node --check $<
	npx uglifyjs $< -o $@

svg_line_graph.mod.js: svg_line_graph.js
	node --check $<
	echo -n "export " >$@
	cat $< >>$@

clean:
	rm -f svg_line_graph.min.js svg_line_graph.mod.js 
	rm -rf node-modules package.json package-lock.json

test: check
	node test/node-open.js test/t0.html
	node test/node-open.js test/t1.html
	node test/node-open.js test/t2.html
	node test/node-open.js test/t3.html
	node test/node-open.js test/t4.html
	node test/node-open.js test/t5.html
	node test/node-open.js test/t6.html

test-module: svg_line_graph.mod.js check
	npx static -p 8080 &
	node test/node-open.js http://127.0.0.1:8080/test/t0-module.html
