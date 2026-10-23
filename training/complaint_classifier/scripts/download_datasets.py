import json
import os
import sys
from pathlib import Path
from typing import Any, Dict

# Ensure local cache is used if HF_HOME points to an invalid drive (e.g. non-existent D:)
if "HF_HOME" in os.environ and not os.path.exists(os.path.splitdrive(os.environ["HF_HOME"])[0] + "\\"):
    fallback_cache = str(Path.home() / ".cache" / "huggingface")
    os.environ["HF_HOME"] = fallback_cache
    os.environ["TRANSFORMERS_CACHE"] = fallback_cache
    os.environ["HF_DATASETS_CACHE"] = str(Path(fallback_cache) / "datasets")

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from datasets import load_dataset
from training.shared.provenance.source_registry import SUPPORTED_SOURCES
from training.shared.utils.filesystem import ensure_dir, write_json


RAW_DATA_DIR = PROJECT_ROOT / "training" / "complaint_classifier" / "data" / "raw"


def download_and_cache_datasets() -> Dict[str, Any]:
    """
    Download and cache all supported datasets to raw storage.
    Records metadata, features, row counts, and save locations.
    """
    ensure_dir(RAW_DATA_DIR)
    manifest = {}

    print("==================================================")
    print("CCIP Complaint Classifier - Dataset Downloader")
    print("==================================================")

    for source_name, cfg in SUPPORTED_SOURCES.items():
        print(f"\nProcessing source: {source_name}")
        safe_name = source_name.replace("/", "__")
        out_file = RAW_DATA_DIR / f"{safe_name}.jsonl"

        try:
            kwargs = {"split": cfg.split}
            if cfg.data_files:
                kwargs["data_files"] = cfg.data_files

            ds = load_dataset(cfg.hf_path, **kwargs)
            num_rows = len(ds)
            print(f"  Successfully loaded {num_rows} rows from {cfg.split} split.")

            # Save as JSONL in raw directory
            with open(out_file, "w", encoding="utf-8") as f:
                for row in ds:
                    f.write(json.dumps(row, ensure_ascii=False) + "\n")

            manifest[source_name] = {
                "status": "success",
                "raw_file": str(out_file),
                "num_rows": num_rows,
                "features": list(ds.features.keys()),
                "split": cfg.split,
                "synthetic": cfg.synthetic,
                "language": cfg.language,
                "description": cfg.description,
            }
            print(f"  Saved raw cache to {out_file}")

        except Exception as e:
            print(f"  [ERROR] Failed to load {source_name}: {e}")
            manifest[source_name] = {
                "status": "failed",
                "error": str(e),
            }

    # Check for local curated corpus
    local_curated_path = RAW_DATA_DIR / "local_ccip_corpus.jsonl"
    if local_curated_path.exists():
        with open(local_curated_path, "r", encoding="utf-8") as f:
            local_rows = sum(1 for _ in f)
        manifest["local_ccip_corpus"] = {
            "status": "success",
            "raw_file": str(local_curated_path),
            "num_rows": local_rows,
            "synthetic": False,
            "language": "en",
            "description": "Local CCIP curated complaint corpus.",
        }
        print(f"\nFound local CCIP curated corpus: {local_rows} rows.")

    manifest_path = RAW_DATA_DIR / "download_manifest.json"
    write_json(manifest, manifest_path)
    print(f"\nWrote download manifest to {manifest_path}")
    return manifest


if __name__ == "__main__":
    download_and_cache_datasets()
