#!/bin/bash
# package-releases.sh — Create source and dist zip archives in releases/.
# Uses Python's zipfile module (always available) instead of the zip binary.
# Exits immediately on any failure (set -e).
set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATE="$(date +%Y-%m-%d)"
RELEASES_DIR="$REPO_ROOT/releases"

export REPO_ROOT DATE RELEASES_DIR

mkdir -p "$RELEASES_DIR"

# ── Source zip (full tree, minus heavy/generated directories) ────────────────
SOURCE_ZIP="$RELEASES_DIR/pinnacle-source-$DATE.zip"
echo "==> Creating source zip: $SOURCE_ZIP"

python3 - <<'PYEOF'
import os, zipfile, pathlib

repo_root    = pathlib.Path(os.environ["REPO_ROOT"])
date         = os.environ["DATE"]
releases_dir = pathlib.Path(os.environ["RELEASES_DIR"])
out_path     = releases_dir / f"pinnacle-source-{date}.zip"

EXCLUDE_DIRS = {
    "node_modules", ".git", "releases", ".expo", ".cache",
    ".local", "dist", "__pycache__",
}

written = 0
with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
    for path in sorted(repo_root.rglob("*")):
        rel = path.relative_to(repo_root)
        if any(p in EXCLUDE_DIRS for p in rel.parts):
            continue
        if path.is_file():
            zf.write(path, rel)
            written += 1

size_mb = out_path.stat().st_size / 1_048_576
print(f"    {written} files → {size_mb:.1f} MB")
PYEOF

# ── Dist zip (compiled output only) ─────────────────────────────────────────
DIST_ZIP="$RELEASES_DIR/pinnacle-dist-$DATE.zip"
echo "==> Creating dist zip: $DIST_ZIP"

python3 - <<'PYEOF'
import os, zipfile, pathlib

repo_root    = pathlib.Path(os.environ["REPO_ROOT"])
date         = os.environ["DATE"]
releases_dir = pathlib.Path(os.environ["RELEASES_DIR"])
out_path     = releases_dir / f"pinnacle-dist-{date}.zip"

DIST_DIRS = [
    repo_root / "artifacts" / "pinnacle-website" / "dist",
    repo_root / "artifacts" / "api-server"        / "dist",
    repo_root / "artifacts" / "pinnacle-mobile"   / "dist",
]

added = 0
with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
    for dist_dir in DIST_DIRS:
        if not dist_dir.exists():
            print(f"    [skip] {dist_dir.relative_to(repo_root)} not found")
            continue
        for path in sorted(dist_dir.rglob("*")):
            if path.is_file():
                zf.write(path, path.relative_to(repo_root))
                added += 1
        print(f"    Added: {dist_dir.relative_to(repo_root)}")

if added == 0:
    print("    [warn] No dist files found — dist zip is empty.")
else:
    size_mb = out_path.stat().st_size / 1_048_576
    print(f"    {added} files → {size_mb:.1f} MB")
PYEOF

echo "==> Release archives ready in $RELEASES_DIR/"
ls -lh "$RELEASES_DIR/"
