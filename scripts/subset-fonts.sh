#!/usr/bin/env bash
# Subsets the source TTFs in src/assets/fonts into small woff2 files in public/fonts.
# Requires fonttools + brotli (pip install fonttools brotli).
set -euo pipefail
cd "$(dirname "$0")/.."
LATIN='U+0020-007F,U+00A0-00FF,U+2013-2014,U+2018-2019,U+201C-201D,U+2026,U+2022,U+00B7'
# Sora variable: keep the wght axis so one file serves 100–800.
pyftsubset src/assets/fonts/sora/Sora-VariableFont_wght.ttf \
  --unicodes="$LATIN" --flavor=woff2 --layout-features='*' \
  --output-file=public/fonts/sora-var.woff2
# Switella DEMO: display face only needs caps, digits and basic punctuation.
pyftsubset src/assets/fonts/switella/SwitellaDemo.ttf \
  --unicodes='U+0020-007F,U+2018-2019,U+2013-2014' --flavor=woff2 --layout-features='*' \
  --output-file=public/fonts/switella.woff2
ls -la public/fonts
