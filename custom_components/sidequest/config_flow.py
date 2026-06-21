"""Config flow for SideQuest."""

import voluptuous as vol

from homeassistant import config_entries

from .const import CONF_NOTIFY_TARGETS, DOMAIN, NOTIFY_TARGETS_DEFAULT


class SideQuestConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a SideQuest config flow."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        """Create the integration from the UI."""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        if user_input is not None:
            await self.async_set_unique_id(DOMAIN)
            self._abort_if_unique_id_configured()
            targets = [
                target.strip()
                for target in user_input.get(CONF_NOTIFY_TARGETS, "").split(",")
                if target.strip()
            ]
            return self.async_create_entry(
                title="SideQuest",
                data={CONF_NOTIFY_TARGETS: targets},
            )

        schema = vol.Schema(
            {
                vol.Optional(
                    CONF_NOTIFY_TARGETS,
                    default=", ".join(NOTIFY_TARGETS_DEFAULT),
                ): str
            }
        )
        return self.async_show_form(step_id="user", data_schema=schema)
