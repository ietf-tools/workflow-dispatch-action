#!/bin/sh

INPUT_WORKFLOW="deploy.yml" \
INPUT_REPO="your-org/repo-name" \
INPUT_REF="main" \
INPUT_TOKEN="XXXXXXXX" \
INPUT_INPUTS="{ \"inputA\":\"true\" }" \
INPUT_SHOWRUNURL="true" \
INPUT_WAITFORCOMPLETION="true" \
INPUT_WAITFORCOMPLETIONINTERVAL="2s" \
INPUT_WAITFORCOMPLETIONTIMEOUT="10m" \
GITHUB_REPOSITORY="your-org/another-repo-name" \
GITHUB_SHA="abcdef" \
node index.js
