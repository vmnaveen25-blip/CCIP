from typing import Any, Dict, List, Optional
from pathlib import Path
from ..utils.filesystem import read_json, write_json, ensure_dir


class ExperimentRegistry:
    def __init__(self, registry_path: str = "training/mlops/registry/experiments.json"):
        self.registry_path = Path(registry_path)

    def log_experiment(self, exp_info: Dict[str, Any]) -> None:
        ensure_dir(self.registry_path.parent)
        data = []
        if self.registry_path.exists():
            data = read_json(self.registry_path)
        data.append(exp_info)
        write_json(data, self.registry_path)
