.PHONY: all package bump unbump

all:
	npm run build

package: all
	@./script.sh package

bump:
	@./script.sh bump
bump-minor:
	@./script.sh bump minor
bump-major:
	@./script.sh bump major

unbump:
	@./script.sh unbump
