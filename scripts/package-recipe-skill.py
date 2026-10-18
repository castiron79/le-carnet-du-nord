"""Build the portable skill from maintained sources, without editing old ZIPs."""
from pathlib import Path
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "skills/create-le-carnet-recipe"
TARGET = ROOT / "skill-packages/create-le-carnet-recipe"

# The standalone validator and the app must use the same reference contract.
shutil.copyfile(ROOT / "app/quantity-references.mjs", SOURCE / "scripts/quantity-references.mjs")
shutil.copyfile(ROOT / "app/step-timers.mjs", SOURCE / "scripts/step-timers.mjs")
FILES = ["SKILL.md", "agents/openai.yaml"]
FILES += [str(p.relative_to(SOURCE)).replace("\\", "/") for p in sorted((SOURCE / "references").glob("*.md"))]
FILES += [str(p.relative_to(SOURCE)).replace("\\", "/") for p in sorted((SOURCE / "scripts").glob("*.mjs"))]
with zipfile.ZipFile(ROOT / "skill-packages/create-le-carnet-recipe-v12.zip", "w", zipfile.ZIP_DEFLATED) as archive:
    for name in FILES:
        data = (SOURCE / name).read_bytes()
        destination = TARGET / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(data)
        info = zipfile.ZipInfo("create-le-carnet-recipe/" + name, (2026, 10, 18, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        archive.writestr(info, data)
print(f"Packaged v12: {len(FILES)} files")
