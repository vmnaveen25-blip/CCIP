"""
Training Runtime Telemetry & Hardware Detection Service
Detects local host compute infrastructure truthfully without fabricating
GPU hardware, cluster nodes, or synthetic benchmark capacities.
"""

import sys
import shutil
import psutil
from typing import Dict, Any, List, Optional
from app.core.logging import logger

# Lazy-check or cached check for torch / transformers
_torch_cached = None
_transformers_cached = None


def get_runtime_telemetry() -> Dict[str, Any]:
    """
    Inspects host CPU, RAM, Disk, PyTorch, and CUDA environment truthfully.
    Guarantees no false claims of external GPU clusters or unavailable accelerators.
    """
    # System CPU & RAM via psutil
    cpu_count = psutil.cpu_count(logical=True) or 1
    cpu_physical = psutil.cpu_count(logical=False) or 1
    cpu_utilization = psutil.cpu_percent(interval=None)
    
    mem = psutil.virtual_memory()
    total_ram_gb = round(mem.total / (1024 ** 3), 2)
    available_ram_gb = round(mem.available / (1024 ** 3), 2)
    ram_utilization = mem.percent
    
    # Storage vault disk free space
    disk_total_gb = 0.0
    disk_free_gb = 0.0
    try:
        usage = shutil.disk_usage(".")
        disk_total_gb = round(usage.total / (1024 ** 3), 2)
        disk_free_gb = round(usage.free / (1024 ** 3), 2)
    except Exception as e:
        logger.warning(f"Failed to read disk usage: {e}")
        
    # PyTorch & CUDA inspection
    cuda_available = False
    gpu_count = 0
    gpu_name = None
    gpu_memory_gb = None
    torch_version = "Unknown"
    transformers_version = "Unknown"
    
    try:
        import torch
        torch_version = torch.__version__
        cuda_available = bool(torch.cuda.is_available())
        if cuda_available:
            gpu_count = torch.cuda.device_count()
            if gpu_count > 0:
                gpu_name = torch.cuda.get_device_name(0)
                gpu_mem_bytes = torch.cuda.get_device_properties(0).total_memory
                gpu_memory_gb = round(gpu_mem_bytes / (1024 ** 3), 2)
    except Exception as e:
        logger.debug(f"PyTorch inspection info: {e}")
        
    try:
        import transformers
        transformers_version = transformers.__version__
    except Exception as e:
        logger.debug(f"Transformers inspection info: {e}")
        
    # Determine truthful runtime categorization
    if cuda_available and gpu_count > 0:
        runtime_type = "LOCAL_CUDA"
        runtime_status = "READY"
        explanation = f"Host equipped with {gpu_count}x {gpu_name} ({gpu_memory_gb} GB VRAM)."
    else:
        runtime_type = "LOCAL_CPU"
        # Status is READY for CPU operations/Colab export, but GPU training is UNAVAILABLE
        runtime_status = "READY"
        explanation = "Host is running in local CPU-only enclave mode. No CUDA-capable accelerator or external A100 training cluster is configured."

    return {
        "runtime_type": runtime_type,
        "runtime_status": runtime_status,
        "cuda_available": cuda_available,
        "gpu_count": gpu_count,
        "gpu_name": gpu_name,
        "gpu_memory": f"{gpu_memory_gb} GB" if gpu_memory_gb else None,
        "gpu_status": "ONLINE" if cuda_available else "NOT_AVAILABLE",
        "cpu_count": cpu_count,
        "cpu_physical": cpu_physical,
        "cpu_utilization": cpu_utilization,
        "total_ram_gb": total_ram_gb,
        "available_ram_gb": available_ram_gb,
        "ram_utilization": ram_utilization,
        "disk_total_gb": disk_total_gb,
        "disk_free_gb": disk_free_gb,
        "python_version": sys.version.split()[0],
        "torch_version": torch_version,
        "transformers_version": transformers_version,
        "supported_execution_modes": [
            "LOCAL_CPU_LIGHTWEIGHT",
            "COLAB_PACKAGE_EXPORT"
        ] if not cuda_available else [
            "LOCAL_CUDA_GPU",
            "LOCAL_CPU_LIGHTWEIGHT",
            "COLAB_PACKAGE_EXPORT"
        ],
        "unsupported_execution_modes": [
            "DISTRIBUTED_A100_CLUSTER",
            "LARGE_SCALE_TRANSFORMER_LOCAL_TRAIN"
        ] if not cuda_available else [
            "DISTRIBUTED_A100_CLUSTER"
        ],
        "explanation": explanation
    }
