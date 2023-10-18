#!/bin/sh

set -e

main() {
    case "$1" in
        package|bump|unbump|version|changelog|release)
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
    jq -r .version package.json
}

package_file() {
    local version=${1-$(version)}
    echo "$(name)-$version.zip"
}

package() {
    set -e
    local version=${1-$(version)}
    local name="$(name)" zip="$(package_file "$version")"
    rm -rf "$zip"
    rsync -a --delete dist/ "$name"/
    zip -r "$zip" "$name"
    rm -rf "$name"
}

changelog() {
    local version=${1-$(version)}
    ruby -e 'v,=ARGV;puts File.read("CHANGELOG.md").scan(/^## (.+)\n((?~^(?=##)))/).to_h[v].strip' "$version"
}

release() {
    local version=${1-$(version)}

    gh release create "v$version" -t "v$version" -n "$(changelog "$version")" -- "$(package_file "$version")"
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
    ruby -i -pe "$code" package.json
    local version=$(version)

    echo "Bumping the version to $version"

    {
        pnpm install
        make
        package
    } || {
        git restore package.json
        false
    }

    VERSION=$version ruby -i -pe 'sub(/^## \KUnreleased$/, ENV["VERSION"])' CHANGELOG.md
    git commit -m "Bump the version to $version" package.json CHANGELOG.md
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

    local version=$(version)
    git tag -d "v$version"
    git reset --soft '@^'
    git restore --staged --worktree package.json CHANGELOG.md

    echo "Reverted the version to $(version)"
}

main "$@"
