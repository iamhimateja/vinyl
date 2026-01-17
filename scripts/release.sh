#!/bin/bash

# Release Script for Vinyl Music Player
# Usage: ./scripts/release.sh [major|minor|patch] [--dry-run]
#
# This script:
# 1. Bumps the version in package.json
# 2. Updates CHANGELOG.md with the new version and date
# 3. Creates a git commit and tag
# 4. Optionally pushes to remote

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CHANGELOG_FILE="CHANGELOG.md"
PACKAGE_FILE="package.json"

# Parse arguments
BUMP_TYPE="${1:-patch}"
DRY_RUN=false

if [[ "$2" == "--dry-run" ]] || [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
    if [[ "$1" == "--dry-run" ]]; then
        BUMP_TYPE="patch"
    fi
fi

# Validate bump type
if [[ ! "$BUMP_TYPE" =~ ^(major|minor|patch)$ ]]; then
    echo -e "${RED}Error: Invalid bump type '$BUMP_TYPE'. Use: major, minor, or patch${NC}"
    exit 1
fi

# Get current version from package.json
CURRENT_VERSION=$(grep '"version"' "$PACKAGE_FILE" | sed -E 's/.*"version": "([^"]+)".*/\1/')

if [[ -z "$CURRENT_VERSION" ]]; then
    echo -e "${RED}Error: Could not read current version from $PACKAGE_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}Current version: ${GREEN}$CURRENT_VERSION${NC}"

# Split version into parts
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Bump version
case "$BUMP_TYPE" in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
RELEASE_DATE=$(date +%Y-%m-%d)

echo -e "${BLUE}New version: ${GREEN}$NEW_VERSION${NC} (${BUMP_TYPE} bump)"
echo -e "${BLUE}Release date: ${GREEN}$RELEASE_DATE${NC}"

if $DRY_RUN; then
    echo -e "\n${YELLOW}=== DRY RUN MODE - No changes will be made ===${NC}\n"
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
    git status --short
    if ! $DRY_RUN; then
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# Check if on main/master branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
    echo -e "${YELLOW}Warning: You are on branch '$CURRENT_BRANCH', not main/master${NC}"
    if ! $DRY_RUN; then
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# Update package.json
echo -e "\n${BLUE}Updating $PACKAGE_FILE...${NC}"
if ! $DRY_RUN; then
    sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$PACKAGE_FILE"
    echo -e "${GREEN}✓ Updated version in $PACKAGE_FILE${NC}"
else
    echo -e "${YELLOW}Would update version from $CURRENT_VERSION to $NEW_VERSION${NC}"
fi

# Update CHANGELOG.md
echo -e "\n${BLUE}Updating $CHANGELOG_FILE...${NC}"

# Check if there are unreleased changes
if grep -q "## \[Unreleased\]" "$CHANGELOG_FILE"; then
    if ! $DRY_RUN; then
        # Replace [Unreleased] with new version and add new Unreleased section
        sed -i "s/## \[Unreleased\]/## [Unreleased]\n\n## [$NEW_VERSION] - $RELEASE_DATE/" "$CHANGELOG_FILE"
        
        # Update the comparison links at the bottom
        # Add new unreleased link and update the previous one
        if grep -q "\[Unreleased\]: https://" "$CHANGELOG_FILE"; then
            # Get the repo URL base
            REPO_URL=$(grep "\[Unreleased\]:" "$CHANGELOG_FILE" | sed -E 's/\[Unreleased\]: (https:\/\/[^\/]+\/[^\/]+\/[^\/]+).*/\1/')
            
            # Update unreleased link to compare from new version
            sed -i "s|\[Unreleased\]: ${REPO_URL}/compare/v[^.]*\.[^.]*\.[^.]*\.\.\.HEAD|\[Unreleased\]: ${REPO_URL}/compare/v${NEW_VERSION}...HEAD|" "$CHANGELOG_FILE"
            
            # Add link for new version (before the old version link)
            sed -i "/\[Unreleased\]: /a [$NEW_VERSION]: ${REPO_URL}/compare/v${CURRENT_VERSION}...v${NEW_VERSION}" "$CHANGELOG_FILE"
        fi
        
        echo -e "${GREEN}✓ Updated $CHANGELOG_FILE${NC}"
    else
        echo -e "${YELLOW}Would update [Unreleased] to [$NEW_VERSION] - $RELEASE_DATE${NC}"
    fi
else
    echo -e "${YELLOW}Warning: No [Unreleased] section found in $CHANGELOG_FILE${NC}"
fi

# Run tests
echo -e "\n${BLUE}Running tests...${NC}"
if ! $DRY_RUN; then
    if command -v bun &> /dev/null; then
        bun run test
    else
        npm test
    fi
    echo -e "${GREEN}✓ All tests passed${NC}"
else
    echo -e "${YELLOW}Would run: bun run test${NC}"
fi

# Build the project
echo -e "\n${BLUE}Building project...${NC}"
if ! $DRY_RUN; then
    if command -v bun &> /dev/null; then
        bun run build
    else
        npm run build
    fi
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${YELLOW}Would run: bun run build${NC}"
fi

# Git operations
echo -e "\n${BLUE}Creating git commit and tag...${NC}"
if ! $DRY_RUN; then
    git add "$PACKAGE_FILE" "$CHANGELOG_FILE"
    git commit -m "chore(release): v$NEW_VERSION

- Bump version from $CURRENT_VERSION to $NEW_VERSION
- Update CHANGELOG.md with release notes"
    
    git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"
    
    echo -e "${GREEN}✓ Created commit and tag v$NEW_VERSION${NC}"
else
    echo -e "${YELLOW}Would create commit: chore(release): v$NEW_VERSION${NC}"
    echo -e "${YELLOW}Would create tag: v$NEW_VERSION${NC}"
fi

# Summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Release v$NEW_VERSION prepared successfully!${NC}"
echo -e "${GREEN}========================================${NC}"

if ! $DRY_RUN; then
    echo -e "\n${BLUE}Next steps:${NC}"
    echo -e "  1. Review the changes: ${YELLOW}git show${NC}"
    echo -e "  2. Push to remote: ${YELLOW}git push && git push --tags${NC}"
    echo -e "  3. Create GitHub release: ${YELLOW}gh release create v$NEW_VERSION${NC}"
else
    echo -e "\n${YELLOW}This was a dry run. No changes were made.${NC}"
    echo -e "Run without --dry-run to apply changes."
fi
