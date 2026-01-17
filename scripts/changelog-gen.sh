#!/bin/bash

# Changelog Generator for Vinyl Music Player
# Generates changelog entries from conventional commits
#
# Usage: ./scripts/changelog-gen.sh [since-tag]
#
# Commit types recognized:
#   feat:     -> Added
#   fix:      -> Fixed
#   docs:     -> Documentation
#   style:    -> Changed (styling)
#   refactor: -> Changed (refactoring)
#   perf:     -> Changed (performance)
#   test:     -> Added (tests)
#   chore:    -> Changed (maintenance)
#   breaking: -> ⚠️ Breaking Changes

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get the last tag or use initial commit
SINCE_TAG="${1:-$(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)}"

echo -e "${BLUE}Generating changelog since: ${GREEN}$SINCE_TAG${NC}\n"

# Arrays to hold categorized commits
declare -a ADDED
declare -a FIXED
declare -a CHANGED
declare -a DEPRECATED
declare -a REMOVED
declare -a SECURITY
declare -a BREAKING

# Read commits and categorize
while IFS= read -r commit; do
    # Skip empty lines
    [[ -z "$commit" ]] && continue
    
    # Extract type and message
    if [[ "$commit" =~ ^([a-z]+)(\(.+\))?!?:\ (.+)$ ]]; then
        TYPE="${BASH_REMATCH[1]}"
        SCOPE="${BASH_REMATCH[2]}"
        MESSAGE="${BASH_REMATCH[3]}"
        
        # Check for breaking change indicator
        if [[ "$commit" =~ !: ]]; then
            BREAKING+=("$MESSAGE")
        fi
        
        # Categorize by type
        case "$TYPE" in
            feat)
                ADDED+=("$MESSAGE")
                ;;
            fix)
                FIXED+=("$MESSAGE")
                ;;
            docs)
                CHANGED+=("Documentation: $MESSAGE")
                ;;
            style|refactor|perf|chore)
                CHANGED+=("$MESSAGE")
                ;;
            test)
                ADDED+=("Tests: $MESSAGE")
                ;;
            security)
                SECURITY+=("$MESSAGE")
                ;;
            deprecate)
                DEPRECATED+=("$MESSAGE")
                ;;
            remove)
                REMOVED+=("$MESSAGE")
                ;;
        esac
    else
        # Non-conventional commit - add to Changed
        # Skip merge commits
        if [[ ! "$commit" =~ ^Merge ]]; then
            CHANGED+=("$commit")
        fi
    fi
done < <(git log "$SINCE_TAG"..HEAD --pretty=format:"%s" 2>/dev/null)

# Output in Keep a Changelog format
echo "## [Unreleased]"
echo ""

if [[ ${#BREAKING[@]} -gt 0 ]]; then
    echo "### ⚠️ Breaking Changes"
    for item in "${BREAKING[@]}"; do
        echo "- $item"
    done
    echo ""
fi

if [[ ${#ADDED[@]} -gt 0 ]]; then
    echo "### Added"
    for item in "${ADDED[@]}"; do
        echo "- $item"
    done
    echo ""
fi

if [[ ${#CHANGED[@]} -gt 0 ]]; then
    echo "### Changed"
    for item in "${CHANGED[@]}"; do
        echo "- $item"
    done
    echo ""
fi

if [[ ${#DEPRECATED[@]} -gt 0 ]]; then
    echo "### Deprecated"
    for item in "${DEPRECATED[@]}"; do
        echo "- $item"
    done
    echo ""
fi

if [[ ${#REMOVED[@]} -gt 0 ]]; then
    echo "### Removed"
    for item in "${REMOVED[@]}"; do
        echo "- $item"
    done
    echo ""
fi

if [[ ${#FIXED[@]} -gt 0 ]]; then
    echo "### Fixed"
    for item in "${FIXED[@]}"; do
        echo "- $item"
    done
    echo ""
fi

if [[ ${#SECURITY[@]} -gt 0 ]]; then
    echo "### Security"
    for item in "${SECURITY[@]}"; do
        echo "- $item"
    done
    echo ""
fi

# Count total entries
TOTAL=$((${#ADDED[@]} + ${#CHANGED[@]} + ${#FIXED[@]} + ${#DEPRECATED[@]} + ${#REMOVED[@]} + ${#SECURITY[@]}))

echo -e "${GREEN}Generated $TOTAL changelog entries${NC}" >&2
