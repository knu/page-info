#!/bin/sh

set -e

main() {
    case "$1" in
        package|bump|unbump)
            "$@"
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
    local code
    case "$1" in
        major)
            code='sub(/^  "version": "\K([0-9]+)[^"]+/) { $1.succ + ".0.0" }' ;;
        minor)
            code='sub(/^  "version": "[0-9]+\.\K([0-9]+)[^"]+/) { $1.succ + ".0" }' ;;
        *)
            code='sub(/^  "version": "\K[^"]+/, &:succ)' ;;
    esac
    ruby -i -pe "$code" manifest.json package.json
    local version=$(jq -r .version manifest.json)

    echo "Bumping the version to $version"

    {
        pnpm install
        make
        package
    } || {
        git restore manifest.json package.json
        false
    }

    VERSION=$version ruby -i -pe 'sub(/^## \KUnreleased$/, ENV["VERSION"])' CHANGELOG.md
    git commit -m "Bump the version to $version" manifest.json package.json CHANGELOG.md
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
    git restore --staged --worktree manifest.json package.json CHANGELOG.md

    echo "Reverted the version to $(version)"
}

main "$@"
