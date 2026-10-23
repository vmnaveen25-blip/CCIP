import json
import os
import tempfile
from pathlib import Path
from typing import Any, Dict, Generator, Iterable, List, Union


def ensure_dir(path: Union[str, Path]) -> Path:
    """Ensure directory exists and return Path object."""
    p = Path(path)
    p.mkdir(parents=True, exist_ok=True)
    return p


def read_jsonl(path: Union[str, Path]) -> Generator[Dict[str, Any], None, None]:
    """Read a JSONL file line by line."""
    with open(path, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid JSON at line {line_num} in {path}: {e}")


def write_jsonl(records: Iterable[Dict[str, Any]], path: Union[str, Path], atomic: bool = True) -> int:
    """Write records to JSONL file safely with optional atomic replacement."""
    target_path = Path(path)
    ensure_dir(target_path.parent)

    if atomic:
        temp_file = tempfile.NamedTemporaryFile("w", dir=target_path.parent, delete=False, encoding="utf-8")
        temp_path = Path(temp_file.name)
        count = 0
        try:
            for record in records:
                temp_file.write(json.dumps(record, ensure_ascii=False) + "\n")
                count += 1
            temp_file.close()
            if target_path.exists():
                target_path.unlink()
            temp_path.rename(target_path)
            return count
        except Exception:
            temp_file.close()
            if temp_path.exists():
                temp_path.unlink()
            raise
    else:
        count = 0
        with open(target_path, "w", encoding="utf-8") as f:
            for record in records:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
                count += 1
        return count


def read_json(path: Union[str, Path]) -> Any:
    """Read and parse a JSON file."""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def write_json(data: Any, path: Union[str, Path], indent: int = 2) -> None:
    """Write data to a JSON file."""
    target_path = Path(path)
    ensure_dir(target_path.parent)
    with open(target_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=indent, ensure_ascii=False)
