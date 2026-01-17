#!/bin/bash

# Version Utility for Vinyl Music Player
# Usage: ./scripts/version.sh [command]
#
# Commands:
#   current   - Show current version
#   major     - Show what major bump would be
#   minor     - Show what minor bump would be  
#   patch     - Show what patch bump would be
#   next      - Suggest next version based on commits
#   history   - Show version history from tags

set -e

PACKAGE_FILE="package.json"

# Get current version
get_current_version() {
    grep '"version"' "$PACKAGE_FILE" | sed -E 's/.*"version": "([^"]+)".*/\1/'
}

# Calculate bumped version
calculate_bump() {
    local CURRENT="$1"
    local BUMP_TYPE="$2"
    
    IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"
    
    case "$BUMP_TYPE" in
        major)
            echo "$((MAJOR + 1)).0.0"
            ;;
        minor)
            echo "$MAJOR.$((MINOR + 1)).0"
            ;;
        patch)
            echo "$MAJOR.$MINOR.$((PATCH + 1))"
            ;;
    esac
}

# Suggest version based on commits since last tag
suggest_version() {
    local CURRENT="$1"
    local LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
    
    if [[ -z "$LAST_TAG" ]]; then
        echo "patch" # Default to patch if no tags
        return
    fi
    
    # Check for breaking changes
    if git log "$LAST_TAG"..HEAD --pretty=format:"%s" | grep -qE "^[a-z]+(\(.+\))?!:|BREAKING CHANGE:"; then
        echo "major"
        return
    fi
    
    # Check for features
    if git log "$LAST_TAG"..HEAD --pretty=format:"%s" | grep -qE "^feat(\(.+\))?:"; then
        echo "minor"
        return
    fi
    
    echo "patch"
}

# Show version history
show_history() {
    echo "Version History:"
    echo "================"
    git tag -l "v*" --sort=-v:refname | head -20 | while read tag; do
        DATE=$(git log -1 --format="%ai" "$tag" 2>/dev/null | cut -d' ' -f1)
        echo "  $tag ($DATE)"
    done
}

# Main
CURRENT=$(get_current_version)
COMMAND="${1:-current}"

case "$COMMAND" in
    current)
        echo "$CURRENT"
        ;;
    major)
        calculate_bump "$CURRENT" "major"
        ;;
    minor)
        calculate_bump "$CURRENT" "minor"
        ;;
    patch)
        calculate_bump "$CURRENT" "patch"
        ;;
    next)
        BUMP_TYPE=$(suggest_version "$CURRENT")
        NEXT=$(calculate_bump "$CURRENT" "$BUMP_TYPE")
        echo "Suggested: $NEXT ($BUMP_TYPE bump)"
        ;;
    history)
        show_history
        ;;
    *)
        echo "Unknown command: $COMMAND"
        echo "Usage: $0 [current|major|minor|patch|next|history]"
        exit 1
        ;;
esac
