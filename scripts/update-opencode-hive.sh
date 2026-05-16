#!/bin/bash
CONFIG_FILE="/home/mathew/.config/opencode/opencode.json"
PACKAGE_NAME="opencode-hive"

LATEST_VERSION=$(npm view $PACKAGE_NAME version 2>/dev/null || echo "0.0.0")
CURRENT_VERSION=$(grep -o "\"$PACKAGE_NAME@[^\"]*" "$CONFIG_FILE" | sed 's/.*@//' || echo "0.0.0")

echo "Current: $CURRENT_VERSION, Latest: $LATEST_VERSION"

if [ "$CURRENT_VERSION" != "$LATEST_VERSION" ] && [ "$LATEST_VERSION" != "0.0.0" ]; then
    sed -i "s/$PACKAGE_NAME@$CURRENT_VERSION/$PACKAGE_NAME@latest/" "$CONFIG_FILE"
    echo "Updated to $LATEST_VERSION"
else
    echo "Already up to date"
fi