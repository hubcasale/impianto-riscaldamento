import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))


@pytest.fixture(autouse=True)
def _enable(enable_custom_integrations):
    yield


@pytest.fixture(autouse=True)
def _start_in_the_future(freezer):
    """I test dei programmi usano date fisse (lunedi' 21/10/2030): si parte sempre un po' prima, cosi' il tempo non va mai all'indietro
    rispetto all'orologio vero (con date passate i timer di Home Assistant non scattano)."""
    freezer.move_to(datetime(2030, 10, 21, 5, 0, tzinfo=ZoneInfo("Europe/Rome")))
    yield
