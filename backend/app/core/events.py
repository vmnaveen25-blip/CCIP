import asyncio
from typing import Dict, Any, List, Callable, Coroutine
from dataclasses import dataclass, field
from datetime import datetime, timezone

from app.core.logging import logger


@dataclass
class DomainEvent:
    event_type: str
    data: Dict[str, Any]
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    actor_id: str = "system"


class EventDispatcher:
    """Internal asynchronous event bus for decoupling business logic, notifications, and audits."""

    def __init__(self):
        self._handlers: Dict[str, List[Callable[[DomainEvent], Coroutine[Any, Any, None]]]] = {}

    def subscribe(self, event_type: str, handler: Callable[[DomainEvent], Coroutine[Any, Any, None]]):
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)
        logger.debug(f"Subscribed handler {handler.__name__} to event {event_type}")

    async def publish(self, event: DomainEvent):
        handlers = self._handlers.get(event.event_type, [])
        handlers_all = self._handlers.get("*", [])
        all_targets = handlers + handlers_all

        if not all_targets:
            logger.debug(f"Published event '{event.event_type}' with no subscribed listeners.")
            return

        logger.info(f"Publishing domain event: {event.event_type} to {len(all_targets)} handler(s)")
        tasks = [h(event) for h in all_targets]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for r in results:
            if isinstance(r, Exception):
                logger.error(f"Error executing event listener for {event.event_type}: {str(r)}")


event_dispatcher = EventDispatcher()
