.PHONY: all package bump unbump

all:
	npm run build

package: all
	@./script.sh package

bump:
	@./script.sh bump

unbump:
	@./script.sh unbump
