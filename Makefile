.PHONY: all package bump unbump

all:
	pnpm run build

package: all
	@./script.sh package
release:
	@./script.sh release

bump:
	@./script.sh bump
bump-minor:
	@./script.sh bump minor
bump-major:
	@./script.sh bump major

unbump:
	@./script.sh unbump
