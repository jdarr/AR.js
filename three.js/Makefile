watch: build
	fswatch -0 src/*/*.js | xargs -0 -n 1 -I {} make build

build-main: 
	(cd src/threex/threex-aruco && make build)
	echo	> build/ar.js
	cat 	vendor/jsartoolkit5/build/artoolkit.min.js	\
		vendor/jsartoolkit5/js/artoolkit.api.js		>> build/ar.js
	cat	src/threex/threex-aruco/build/threex-aruco.js	>> build/ar.js
	cat	vendor/chromium-tango/THREE.WebAR.js		>> build/ar.js
	cat	vendor/signals.min.js				>> build/ar.js
	cat	src/threex/*.js					\
		src/new-api/*.js 				\
		src/markers-area/*.js 				>> build/ar.js

.PHONY: build

minify-main: build-main
	uglifyjs build/ar.js > build/ar.min.js

build-custom:
	echo > build/ar.custom.js
	cat src/threex/threex-arbasecontrols.js \
		src/threex/threex-arclickability.js \
		src/threex/threex-armarkercloak.js \
		src/threex/threex-armarkercontrols.js \
		src/threex/threex-armarkerhelper.js \
		src/threex/threex-arsmoothedcontrols.js \
		src/threex/threex-artoolkitcontext.js \
		src/threex/threex-artoolkitprofile.js \
		src/threex/threex-artoolkitsource.js \
		src/module-export.js >> build/ar.custom.js

build-lean:
	echo > build/ar.lean.js
	cat vendor/jsartoolkit5/build/artoolkit.min.js \
		vendor/jsartoolkit5/js/artoolkit.api.js >> build/ar.lean.js
	cat vendor/signals.min.js >> build/ar.lean.js
	cat src/threex/*.js \
		src/new-api/*.js \
		src/markers-area/*.js >> build/ar.lean.js

minify-lean: build-lean
	uglifyjs build/ar.lean.js > build/ar.lean.min.js

build: build-main build-lean

minify: minify-main minify-lean

watchMinify: minify
	fswatch -0 three.js/*.js | xargs -0 -n 1 -I {} make minify
