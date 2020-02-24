watch:
	npm run build -- --watch

run:
	LOG_FILES=`pwd`/test.txt npm run run

build:
	npm run build

update-global:
	npm i && npm i -g