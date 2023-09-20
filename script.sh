#!/bin/sh

set -e

main() {
    case "$1" in
        package|bump|unbump)
            "$1"
            ;;
        *)
            echo "Unknown command: $1" >&2
            exit 64
    esac
}

name() {
    jq -r .name package.json
}

version() {
    jq -r .version manifest.json
}

package_file() {
    echo "$(name)-$(version).zip"
}

package() {
    set -e
    local name="$(name)" zip="$(package_file)"
    rm -rf "$zip"
    rsync -a --delete dist/ "$name"/
    zip -r "$zip" "$name"
    rm -rf "$name"
}

bump() {
    set -e
    ruby -i -pe 'sub(/^  "version": "\K[^"]+/, &:succ)' manifest.json package.json
    local version=$(jq -r .version manifest.json)

    echo "Bumping the version to $version"

    {
        npm install
        make
        package
    } || {
        git restore manifest.json package.json
        false
    }

    VERSION=$version ruby -i -pe 'sub(/^## \KUnreleased$/, ENV["VERSION"])' CHANGELOG.md
    git commit -m "Bump the version to $version" manifest.json package.json package-lock.json CHANGELOG.md
    git tag -f "v$version"

    echo "Bumped the version to $version"
}

unbump() {
    set -e
    case "$(git log -1 --pretty=%s)" in
	"Bump the version to "*) ;;
	*)
            echo "The last commit is not a version bump" >&2
            false
    esac

    local version=$(jq -r .version manifest.json)
    git tag -d "v$version"
    git reset --soft '@^'
    git restore --staged --worktree manifest.json package.json package-lock.json CHANGELOG.md

    echo "Reverted the version to $(version)"
}

main "$@"
