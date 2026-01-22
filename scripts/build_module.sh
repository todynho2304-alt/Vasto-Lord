#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ASSET_B64="$ROOT_DIR/assets/vasto-lord-logo.base64"
OUT_DIR="$ROOT_DIR/dist"
VERSION="$(grep '^version=' "$ROOT_DIR/module.prop" | cut -d= -f2)"
ZIP_NAME="Vasto-Lord-${VERSION}.zip"
BUILD_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$BUILD_DIR"
}
trap cleanup EXIT

mkdir -p "$OUT_DIR"

copy_tree() {
  local src="$1"
  local dest="$2"
  mkdir -p "$dest"
  (cd "$src" && tar -cf - .) | (cd "$dest" && tar -xf -)
}

copy_tree "$ROOT_DIR/META-INF" "$BUILD_DIR/META-INF"
copy_tree "$ROOT_DIR/system" "$BUILD_DIR/system"
copy_tree "$ROOT_DIR/webroot" "$BUILD_DIR/webroot"

cp "$ROOT_DIR/module.prop" "$BUILD_DIR/"
cp "$ROOT_DIR/action.sh" "$BUILD_DIR/"
cp "$ROOT_DIR/customize.sh" "$BUILD_DIR/"
cp "$ROOT_DIR/post-fs-data.sh" "$BUILD_DIR/"
cp "$ROOT_DIR/service.sh" "$BUILD_DIR/"
cp "$ROOT_DIR/system.prop" "$BUILD_DIR/"
cp "$ROOT_DIR/uninstall.sh" "$BUILD_DIR/"

python - <<PY
import base64
from pathlib import Path
b64_path = Path("$ASSET_B64")
raw = base64.b64decode(b64_path.read_text().strip())
(Path("$BUILD_DIR/banner.png")).write_bytes(raw)
(Path("$BUILD_DIR/webroot/banner.png")).write_bytes(raw)
(Path("$BUILD_DIR/webroot/logo.png")).write_bytes(raw)
PY

(
  cd "$BUILD_DIR"
  zip -r -9 "$OUT_DIR/$ZIP_NAME" .
)

echo "Build complete: $OUT_DIR/$ZIP_NAME"
