#!/bin/bash

set -euxo pipefail

crystal build src/cronnect.cr
cat js/*.js > public/scripts.js
