"""SideQuest sensors."""

from __future__ import annotations

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from . import get_store


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up SideQuest child total sensors."""
    store = get_store(hass)
    entities = [SideQuestChildTotalSensor(hass, child["id"], child["name"]) for child in store.data["children"]]
    async_add_entities(entities)


class SideQuestChildTotalSensor(SensorEntity):
    """Weekly total sensor for a child."""

    _attr_icon = "mdi:piggy-bank"
    _attr_native_unit_of_measurement = "GBP"

    def __init__(self, hass: HomeAssistant, child_id: str, child_name: str) -> None:
        self.hass = hass
        self.child_id = child_id
        self._attr_name = f"{child_name} SideQuest weekly total"
        self._attr_unique_id = f"{DOMAIN}_{child_id}_weekly_total"

    @property
    def native_value(self):
        """Return the weekly total."""
        return get_store(self.hass).data["weekly_totals"].get(self.child_id, 0)

    async def async_added_to_hass(self) -> None:
        """Listen for SideQuest updates."""
        self.async_on_remove(
            self.hass.bus.async_listen(f"{DOMAIN}_updated", self._handle_update)
        )

    @callback
    def _handle_update(self, event) -> None:
        self.async_write_ha_state()
