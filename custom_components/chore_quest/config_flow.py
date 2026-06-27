"""Config flow for SideQuest."""

from homeassistant import config_entries

from .const import DOMAIN


class SideQuestConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a SideQuest config flow."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        """Create the integration from the UI."""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        return self.async_create_entry(
            title="SideQuest",
            data={},
        )
