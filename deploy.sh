#!/usr/bin/env bash

# Login to npm
printf "%s\n%s\n%s" $NPM_USER $NPM_PASSWORD $NPM_EMAIL | npm login --scope=@steeplejack && npm publish --access public
