import logging
from abc import abstractmethod
from collections.abc import Generator, Sequence

from core.model import EventRecord

logger = logging.getLogger(__name__)


# TODO: remove the annotation
@abstractmethod
def records_to_csv(records: Sequence[EventRecord]) -> Generator[bytes]: ...


@abstractmethod
def records_from_csv(data: bytes) -> Sequence[EventRecord]: ...
