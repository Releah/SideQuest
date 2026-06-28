"""SideQuest integration."""

from __future__ import annotations

from pathlib import Path

import voluptuous as vol

from homeassistant.components import frontend, websocket_api
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .const import CONF_NOTIFY_TARGETS, DOMAIN, NOTIFY_TARGETS_DEFAULT
from .store import SideQuestStore

PLATFORMS: list[Platform] = [Platform.SENSOR]

SERVICE_CLAIM = "claim_chore"
SERVICE_APPROVE = "approve_chore"
SERVICE_DENY = "deny_chore"
SERVICE_ADD_CHILD = "add_child"
SERVICE_DELETE_CHILD = "delete_child"
SERVICE_UPSERT_CHORE = "upsert_chore"
SERVICE_DELETE_CHORE = "delete_chore"
SERVICE_CLAIM_ANYONE_QUEST = "claim_anyone_quest"
SERVICE_APPROVE_ANYONE_QUEST = "approve_anyone_quest"
SERVICE_DENY_ANYONE_QUEST = "deny_anyone_quest"
SERVICE_UPSERT_ANYONE_QUEST = "upsert_anyone_quest"
SERVICE_DELETE_ANYONE_QUEST = "delete_anyone_quest"
SERVICE_UPSERT_HOUSE_ROOM = "upsert_house_room"
SERVICE_DELETE_HOUSE_ROOM = "delete_house_room"
SERVICE_UPSERT_GLOBAL_MISSION = "upsert_global_mission"
SERVICE_DELETE_GLOBAL_MISSION = "delete_global_mission"
SERVICE_COMPLETE_GLOBAL_MISSION = "complete_global_mission"
SERVICE_CLAIM_GLOBAL_TASK = "claim_global_task"
SERVICE_APPROVE_GLOBAL_TASK = "approve_global_task"
SERVICE_DENY_GLOBAL_TASK = "deny_global_task"
SERVICE_SAVE_GLOBAL_TEMPLATE = "save_global_mission_template"
SERVICE_LAUNCH_GLOBAL_TEMPLATE = "launch_global_mission_template"
SERVICE_DELETE_GLOBAL_TEMPLATE = "delete_global_mission_template"
SERVICE_ADJUST_MONEY = "adjust_money"
SERVICE_ADJUST_XP = "adjust_xp"
SERVICE_UPSERT_STORE_ITEM = "upsert_store_item"
SERVICE_DELETE_STORE_ITEM = "delete_store_item"
SERVICE_SPEND_XP = "spend_xp"
SERVICE_CASH_IN_STORE_TOKEN = "cash_in_store_token"
SERVICE_DELETE_HISTORY = "delete_history_event"
SERVICE_UPDATE_SETTINGS = "update_settings"
SERVICE_WEEKLY_RESET = "weekly_reset"

ATTR_CHORE_ID = "chore_id"
ATTR_QUEST_ID = "quest_id"
ATTR_CHILD_ID = "child_id"
ATTR_EVENT_ID = "event_id"
ATTR_MISSION_ID = "mission_id"
ATTR_TASK_ID = "task_id"
ATTR_ITEM_ID = "item_id"
ATTR_ROOM_ID = "room_id"
ATTR_TOKEN_ID = "token_id"


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up SideQuest services and websocket commands."""
    _register_services(hass)
    _register_websocket(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up SideQuest from a config entry."""
    store = SideQuestStore(hass)
    await store.async_load()

    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = {
        "store": store,
        "notify_targets": entry.data.get(CONF_NOTIFY_TARGETS, NOTIFY_TARGETS_DEFAULT),
    }
    hass.data[DOMAIN]["store"] = store
    hass.data[DOMAIN]["notify_targets"] = entry.data.get(CONF_NOTIFY_TARGETS, NOTIFY_TARGETS_DEFAULT)

    await _async_register_panel(hass)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload SideQuest."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        hass.data[DOMAIN].pop(entry.entry_id, None)
    return unload_ok


def get_store(hass: HomeAssistant) -> SideQuestStore:
    """Return the loaded SideQuest store."""
    return hass.data[DOMAIN]["store"]


def get_notify_targets(hass: HomeAssistant) -> list[str]:
    """Return configured notify actions."""
    store = hass.data.get(DOMAIN, {}).get("store")
    if store:
        stored_targets = store.data.get("settings", {}).get("notify_targets", [])
        if stored_targets:
            return _normalise_notify_targets(stored_targets)
    return _normalise_notify_targets(hass.data[DOMAIN].get("notify_targets", NOTIFY_TARGETS_DEFAULT))


def _normalise_notify_targets(targets) -> list[str]:
    """Return notify service ids from legacy strings or named device rows."""
    normalised = []
    for item in targets or []:
        if isinstance(item, dict):
            target = str(item.get("target", "")).strip()
        else:
            target = str(item).strip()
        if target:
            normalised.append(target)
    return normalised


def _register_services(hass: HomeAssistant) -> None:
    """Register SideQuest service actions."""

    async def claim(call: ServiceCall) -> None:
        store = get_store(hass)
        chore_id = call.data[ATTR_CHORE_ID]
        claim_data = await store.async_claim(chore_id, quantity=call.data.get("quantity", 1))
        chore = store.get_chore(chore_id)
        if claim_data.get("status") == "pending":
            await _async_send_approval_notifications(hass, chore)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "claim", "chore_id": chore_id, "claim": claim_data})

    async def approve(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        store = get_store(hass)
        chore_id = call.data[ATTR_CHORE_ID]
        event = await store.async_approve(chore_id, rating=call.data.get("rating", 5))
        await _async_clear_notifications(hass, chore_id)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "approve", "chore_id": chore_id, "event": event})

    async def deny(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        store = get_store(hass)
        chore_id = call.data[ATTR_CHORE_ID]
        event = await store.async_deny(chore_id)
        await _async_clear_notifications(hass, chore_id)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "deny", "chore_id": chore_id, "event": event})

    async def claim_anyone_quest(call: ServiceCall) -> None:
        store = get_store(hass)
        quest_id = call.data[ATTR_QUEST_ID]
        claim_data = await store.async_claim_anyone_quest(
            quest_id,
            call.data[ATTR_CHILD_ID],
            claimed_by=call.context.user_id,
            quantity=call.data.get("quantity", 1),
        )
        quest = store.get_anyone_quest(quest_id)
        if claim_data.get("status") == "pending":
            await _async_send_anyone_approval_notifications(hass, quest)
        hass.bus.async_fire(
            f"{DOMAIN}_updated",
            {"action": "claim_anyone_quest", "quest_id": quest_id, "claim": claim_data},
        )

    async def approve_anyone_quest(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        store = get_store(hass)
        quest_id = call.data[ATTR_QUEST_ID]
        event = await store.async_approve_anyone_quest(
            quest_id,
            approved_by=call.context.user_id,
            rating=call.data.get("rating", 5),
        )
        await _async_clear_anyone_notifications(hass, quest_id)
        hass.bus.async_fire(
            f"{DOMAIN}_updated",
            {"action": "approve_anyone_quest", "quest_id": quest_id, "event": event},
        )

    async def deny_anyone_quest(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        store = get_store(hass)
        quest_id = call.data[ATTR_QUEST_ID]
        event = await store.async_deny_anyone_quest(quest_id, denied_by=call.context.user_id)
        await _async_clear_anyone_notifications(hass, quest_id)
        hass.bus.async_fire(
            f"{DOMAIN}_updated",
            {"action": "deny_anyone_quest", "quest_id": quest_id, "event": event},
        )

    async def add_child(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        store = get_store(hass)
        user_ids = [
            user_id.strip()
            for user_id in call.data.get("user_ids", "").split(",")
            if user_id.strip()
        ]
        child = await store.async_add_child(
            call.data["name"],
            user_ids=user_ids,
            goal=float(call.data.get("goal", 10)),
        )
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "add_child", "child": child})

    async def delete_child(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        store = get_store(hass)
        child_id = call.data[ATTR_CHILD_ID]
        await store.async_delete_child(child_id)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "delete_child", "child_id": child_id})

    async def upsert_chore(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        store = get_store(hass)
        chore = await store.async_upsert_chore(dict(call.data))
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "upsert_chore", "chore": chore})

    async def upsert_anyone_quest(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        store = get_store(hass)
        quest = await store.async_upsert_anyone_quest(dict(call.data))
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "upsert_anyone_quest", "quest": quest})

    async def upsert_house_room(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        room = await get_store(hass).async_upsert_house_room(dict(call.data))
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "upsert_house_room", "room": room})

    async def delete_house_room(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        room_id = call.data[ATTR_ROOM_ID]
        await get_store(hass).async_delete_house_room(room_id)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "delete_house_room", "room_id": room_id})

    async def upsert_global_mission(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        store = get_store(hass)
        mission = await store.async_upsert_global_mission(dict(call.data))
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "upsert_global_mission", "mission": mission})

    async def delete_global_mission(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        store = get_store(hass)
        mission_id = call.data[ATTR_MISSION_ID]
        await store.async_delete_global_mission(mission_id)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "delete_global_mission", "mission_id": mission_id})

    async def save_global_template(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        template = await get_store(hass).async_save_global_mission_template(call.data[ATTR_MISSION_ID])
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "save_global_template", "template": template})

    async def launch_global_template(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        mission = await get_store(hass).async_launch_global_mission_template(call.data["template_id"])
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "launch_global_template", "mission": mission})

    async def delete_global_template(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        template_id = call.data["template_id"]
        await get_store(hass).async_delete_global_mission_template(template_id)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "delete_global_template", "template_id": template_id})

    async def complete_global_mission(call: ServiceCall) -> None:
        store = get_store(hass)
        mission_id = call.data[ATTR_MISSION_ID]
        event = await store.async_complete_global_mission(
            mission_id,
            completed_by=call.context.user_id,
            child_id=call.data.get(ATTR_CHILD_ID),
        )
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "complete_global_mission", "event": event})

    async def claim_global_task(call: ServiceCall) -> None:
        event = await get_store(hass).async_claim_global_task(
            call.data[ATTR_MISSION_ID],
            call.data[ATTR_TASK_ID],
            call.data[ATTR_CHILD_ID],
            claimed_by=call.context.user_id,
        )
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "claim_global_task", "event": event})

    async def approve_global_task(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        event = await get_store(hass).async_approve_global_task(
            call.data[ATTR_MISSION_ID],
            call.data[ATTR_TASK_ID],
            approved_by=call.context.user_id,
        )
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "approve_global_task", "event": event})

    async def deny_global_task(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        event = await get_store(hass).async_deny_global_task(
            call.data[ATTR_MISSION_ID],
            call.data[ATTR_TASK_ID],
            denied_by=call.context.user_id,
        )
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "deny_global_task", "event": event})

    async def adjust_money(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        store = get_store(hass)
        event = await store.async_adjust_money(
            call.data[ATTR_CHILD_ID],
            call.data["amount"],
            call.data.get("note", ""),
            user_id=call.context.user_id,
        )
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "adjust_money", "event": event})

    async def adjust_xp(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        store = get_store(hass)
        event = await store.async_adjust_xp(
            call.data[ATTR_CHILD_ID],
            call.data["amount"],
            call.data.get("note", ""),
            user_id=call.context.user_id,
        )
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "adjust_xp", "event": event})

    async def upsert_store_item(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        store = get_store(hass)
        item = await store.async_upsert_store_item(dict(call.data))
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "upsert_store_item", "item": item})

    async def delete_store_item(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        store = get_store(hass)
        item_id = call.data[ATTR_ITEM_ID]
        await store.async_delete_store_item(item_id)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "delete_store_item", "item_id": item_id})

    async def spend_xp(call: ServiceCall) -> None:
        store = get_store(hass)
        event = await store.async_spend_xp(
            call.data[ATTR_ITEM_ID],
            call.data[ATTR_CHILD_ID],
            amount=call.data.get("amount"),
            user_id=call.context.user_id,
        )
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "spend_xp", "event": event})

    async def cash_in_store_token(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        store = get_store(hass)
        event = await store.async_cash_in_store_token(
            call.data[ATTR_TOKEN_ID],
            user_id=call.context.user_id,
        )
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "cash_in_store_token", "event": event})

    async def delete_chore(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        store = get_store(hass)
        chore_id = call.data[ATTR_CHORE_ID]
        await store.async_delete_chore(chore_id)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "delete_chore", "chore_id": chore_id})

    async def delete_anyone_quest(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        store = get_store(hass)
        quest_id = call.data[ATTR_QUEST_ID]
        await store.async_delete_anyone_quest(quest_id)
        await _async_clear_anyone_notifications(hass, quest_id)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "delete_anyone_quest", "quest_id": quest_id})

    async def delete_history_event(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        store = get_store(hass)
        event_id = call.data[ATTR_EVENT_ID]
        event = await store.async_delete_history_event(event_id)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "delete_history_event", "event": event})

    async def update_settings(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        store = get_store(hass)
        kitchen_user_ids = [
            user_id.strip()
            for user_id in call.data.get("kitchen_user_ids", "").split(",")
            if user_id.strip()
        ]
        notify_targets = [
            target.strip()
            for target in call.data.get("notify_targets", "").split(",")
            if target.strip()
        ]
        payload = {"kitchen_user_ids": kitchen_user_ids}
        if "notify_targets" in call.data:
            payload["notify_targets"] = notify_targets
        settings = await store.async_update_settings(payload)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "update_settings", "settings": settings})

    async def weekly_reset(call: ServiceCall) -> None:
        await _async_require_admin(hass, call)
        store = get_store(hass)
        await store.async_weekly_reset()
        hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "weekly_reset"})

    chore_id_schema = vol.Schema({vol.Required(ATTR_CHORE_ID): cv.string})
    quest_id_schema = vol.Schema({vol.Required(ATTR_QUEST_ID): cv.string})
    claim_schema = vol.Schema(
        {
            vol.Required(ATTR_CHORE_ID): cv.string,
            vol.Optional("quantity", default=1): vol.All(vol.Coerce(int), vol.Range(min=1, max=100)),
        }
    )
    approve_schema = vol.Schema(
        {
            vol.Required(ATTR_CHORE_ID): cv.string,
            vol.Optional("rating", default=5): vol.All(vol.Coerce(int), vol.Range(min=1, max=5)),
        }
    )
    anyone_claim_schema = vol.Schema(
        {
            vol.Required(ATTR_QUEST_ID): cv.string,
            vol.Required(ATTR_CHILD_ID): cv.string,
            vol.Optional("quantity", default=1): vol.All(vol.Coerce(int), vol.Range(min=1, max=100)),
        }
    )
    anyone_approve_schema = vol.Schema(
        {
            vol.Required(ATTR_QUEST_ID): cv.string,
            vol.Optional("rating", default=5): vol.All(vol.Coerce(int), vol.Range(min=1, max=5)),
        }
    )
    quest_schema = vol.Schema(
        {
            vol.Optional("id"): cv.string,
            vol.Optional("room_id", default="house"): cv.string,
            vol.Required("name"): cv.string,
            vol.Optional("icon", default="mdi:account-group"): cv.string,
            vol.Optional("description", default=""): cv.string,
            vol.Optional("reward", default=0): vol.Coerce(float),
            vol.Optional("badges", default=[]): vol.Any([cv.string], cv.string),
            vol.Optional("xp", default=10): vol.Coerce(int),
            vol.Optional("enabled", default=True): cv.boolean,
            vol.Optional("approval_required", default=True): cv.boolean,
            vol.Optional("repeat_mode", default="once_per_day"): vol.In(
                ["once_per_day", "once_per_week", "unlimited"]
            ),
            vol.Optional("quantity_enabled", default=False): cv.boolean,
            vol.Optional("quantity_label", default="How many?"): cv.string,
            vol.Optional("schedule", default={"type": "daily"}): dict,
        }
    )
    hass.services.async_register(DOMAIN, SERVICE_CLAIM, claim, schema=claim_schema)
    hass.services.async_register(DOMAIN, SERVICE_APPROVE, approve, schema=approve_schema)
    hass.services.async_register(DOMAIN, SERVICE_DENY, deny, schema=chore_id_schema)
    hass.services.async_register(DOMAIN, SERVICE_CLAIM_ANYONE_QUEST, claim_anyone_quest, schema=anyone_claim_schema)
    hass.services.async_register(DOMAIN, SERVICE_APPROVE_ANYONE_QUEST, approve_anyone_quest, schema=anyone_approve_schema)
    hass.services.async_register(DOMAIN, SERVICE_DENY_ANYONE_QUEST, deny_anyone_quest, schema=quest_id_schema)
    hass.services.async_register(
        DOMAIN,
        SERVICE_ADD_CHILD,
        add_child,
        schema=vol.Schema(
            {
                vol.Required("name"): cv.string,
                vol.Optional("user_ids", default=""): cv.string,
                vol.Optional("goal", default=10): vol.Coerce(float),
            }
        ),
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_DELETE_CHILD,
        delete_child,
        schema=vol.Schema({vol.Required(ATTR_CHILD_ID): cv.string}),
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_UPSERT_CHORE,
        upsert_chore,
        schema=vol.Schema(
            {
                vol.Optional("id"): cv.string,
                vol.Required("child_id"): cv.string,
                vol.Required("name"): cv.string,
                vol.Optional("icon", default="mdi:clipboard-check"): cv.string,
                vol.Optional("description", default=""): cv.string,
                vol.Optional("reward", default=0): vol.Coerce(float),
                vol.Optional("badges", default=[]): vol.Any([cv.string], cv.string),
                vol.Optional("xp", default=10): vol.Coerce(int),
                vol.Optional("enabled", default=True): cv.boolean,
                vol.Optional("approval_required", default=True): cv.boolean,
                vol.Optional("repeat_mode", default="once_per_day"): vol.In(
                    ["once_per_day", "once_per_week", "unlimited"]
                ),
                vol.Optional("quantity_enabled", default=False): cv.boolean,
                vol.Optional("quantity_label", default="How many?"): cv.string,
                vol.Optional("schedule", default={"type": "daily"}): dict,
            }
        ),
    )
    hass.services.async_register(DOMAIN, SERVICE_DELETE_CHORE, delete_chore, schema=chore_id_schema)
    room_schema = vol.Schema(
        {
            vol.Optional("id"): cv.string,
            vol.Required("name"): cv.string,
            vol.Optional("icon", default="mdi:home"): cv.string,
        }
    )
    hass.services.async_register(DOMAIN, SERVICE_UPSERT_HOUSE_ROOM, upsert_house_room, schema=room_schema)
    hass.services.async_register(
        DOMAIN,
        SERVICE_DELETE_HOUSE_ROOM,
        delete_house_room,
        schema=vol.Schema({vol.Required(ATTR_ROOM_ID): cv.string}),
    )
    hass.services.async_register(DOMAIN, SERVICE_UPSERT_ANYONE_QUEST, upsert_anyone_quest, schema=quest_schema)
    hass.services.async_register(DOMAIN, SERVICE_DELETE_ANYONE_QUEST, delete_anyone_quest, schema=quest_id_schema)
    hass.services.async_register(
        DOMAIN,
        SERVICE_ADJUST_MONEY,
        adjust_money,
        schema=vol.Schema(
            {
                vol.Required(ATTR_CHILD_ID): cv.string,
                vol.Required("amount"): vol.Coerce(float),
                vol.Optional("note", default=""): cv.string,
            }
        ),
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_ADJUST_XP,
        adjust_xp,
        schema=vol.Schema(
            {
                vol.Required(ATTR_CHILD_ID): cv.string,
                vol.Required("amount"): vol.Coerce(int),
                vol.Optional("note", default=""): cv.string,
            }
        ),
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_UPSERT_STORE_ITEM,
        upsert_store_item,
        schema=vol.Schema(
            {
                vol.Optional("id"): cv.string,
                vol.Required("title"): cv.string,
                vol.Optional("description", default=""): cv.string,
                vol.Optional("image_url", default=""): cv.string,
                vol.Optional("icon", default="mdi:gift"): cv.string,
                vol.Optional("type", default="item"): vol.In(["item", "goal"]),
                vol.Optional("price", default=0): vol.Coerce(int),
                vol.Optional("enabled", default=True): cv.boolean,
            }
        ),
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_DELETE_STORE_ITEM,
        delete_store_item,
        schema=vol.Schema({vol.Required(ATTR_ITEM_ID): cv.string}),
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_SPEND_XP,
        spend_xp,
        schema=vol.Schema(
            {
                vol.Required(ATTR_ITEM_ID): cv.string,
                vol.Required(ATTR_CHILD_ID): cv.string,
                vol.Optional("amount"): vol.Coerce(int),
            }
        ),
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_CASH_IN_STORE_TOKEN,
        cash_in_store_token,
        schema=vol.Schema({vol.Required(ATTR_TOKEN_ID): cv.string}),
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_DELETE_HISTORY,
        delete_history_event,
        schema=vol.Schema({vol.Required(ATTR_EVENT_ID): cv.string}),
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_UPDATE_SETTINGS,
        update_settings,
        schema=vol.Schema(
            {
                vol.Optional("kitchen_user_ids", default=""): cv.string,
                vol.Optional("notify_targets"): cv.string,
            }
        ),
    )
    hass.services.async_register(DOMAIN, SERVICE_WEEKLY_RESET, weekly_reset)


async def _async_require_admin(hass: HomeAssistant, call: ServiceCall) -> None:
    """Require an admin user for parent/admin service actions."""
    user_id = call.context.user_id
    if user_id is None:
        return
    user = await hass.auth.async_get_user(user_id)
    if user is None or not user.is_admin:
        raise HomeAssistantError("SideQuest admin action requires a Home Assistant admin user.")


async def _async_send_approval_notifications(hass: HomeAssistant, chore: dict) -> None:
    """Send approval notifications to configured parent phones."""
    for target in get_notify_targets(hass):
        await hass.services.async_call(
            "notify",
            target.removeprefix("notify."),
            {
                "title": "Mission approval",
                "message": f"{chore['name']} is ready. Rate the mission to approve the payout.",
                "data": {
                    "tag": f"chore_quest_{chore['id']}",
                    "actions": [
                        {"action": f"CHORE_QUEST_APPROVE_5_{chore['id']}", "title": "5 star"},
                        {"action": f"CHORE_QUEST_APPROVE_4_{chore['id']}", "title": "4 star"},
                        {"action": f"CHORE_QUEST_DENY_{chore['id']}", "title": "Deny", "destructive": True},
                    ],
                },
            },
            blocking=False,
        )


async def _async_clear_notifications(hass: HomeAssistant, chore_id: str) -> None:
    """Clear stale approval notifications."""
    for target in get_notify_targets(hass):
        await hass.services.async_call(
            "notify",
            target.removeprefix("notify."),
            {"message": "clear_notification", "data": {"tag": f"chore_quest_{chore_id}"}},
            blocking=False,
        )


async def _async_send_anyone_approval_notifications(hass: HomeAssistant, quest: dict) -> None:
    """Send approval notifications for shared quests."""
    for target in get_notify_targets(hass):
        await hass.services.async_call(
            "notify",
            target.removeprefix("notify."),
            {
                "title": "SideQuest approval",
                "message": f"{quest['name']} is ready. Rate the shared quest to approve the payout.",
                "data": {
                    "tag": f"sidequest_anyone_{quest['id']}",
                    "actions": [
                        {"action": f"SIDEQUEST_ANYONE_APPROVE_5_{quest['id']}", "title": "5 star"},
                        {"action": f"SIDEQUEST_ANYONE_APPROVE_4_{quest['id']}", "title": "4 star"},
                        {"action": f"SIDEQUEST_ANYONE_DENY_{quest['id']}", "title": "Deny", "destructive": True},
                    ],
                },
            },
            blocking=False,
        )


async def _async_clear_anyone_notifications(hass: HomeAssistant, quest_id: str) -> None:
    """Clear stale shared quest approval notifications."""
    for target in get_notify_targets(hass):
        await hass.services.async_call(
            "notify",
            target.removeprefix("notify."),
            {"message": "clear_notification", "data": {"tag": f"sidequest_anyone_{quest_id}"}},
            blocking=False,
        )


async def _async_register_panel(hass: HomeAssistant) -> None:
    """Register static assets and sidebar panel."""
    panel_dir = Path(__file__).parent / "frontend"
    await hass.http.async_register_static_paths(
        [StaticPathConfig("/chore_quest_static", str(panel_dir), cache_headers=False)]
    )
    frontend.async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title="SideQuest",
        sidebar_icon="mdi:treasure-chest",
        frontend_url_path="chore-quest",
        config={
            "_panel_custom": {
                "name": "chore-quest-panel",
                "module_url": "/chore_quest_static/panel.js?v=20260628-no-global-missions",
                "embed_iframe": False,
                "trust_external_script": True,
            }
        },
        require_admin=False,
    )


async def _async_user_profiles(hass: HomeAssistant) -> dict[str, dict]:
    """Return user profile data the frontend can use for avatars."""
    users = await hass.auth.async_get_users()
    person_pictures: dict[str, str] = {}
    for state in hass.states.async_all("person"):
        user_id = state.attributes.get("user_id")
        entity_picture = state.attributes.get("entity_picture")
        if user_id and entity_picture:
            person_pictures[user_id] = entity_picture

    profiles: dict[str, dict] = {}
    for user in users:
        avatar_url = person_pictures.get(user.id)
        for attr in ("avatar_url", "picture_url", "picture", "image_url"):
            if avatar_url:
                break
            value = getattr(user, attr, None)
            if value:
                avatar_url = value
                break
        profiles[user.id] = {
            "id": user.id,
            "name": user.name or user.id,
            "is_admin": bool(user.is_admin),
            "avatar_url": avatar_url,
        }
    return profiles


def _notify_services(hass: HomeAssistant) -> list[str]:
    """Return available notify service names for admin selection."""
    services = hass.services.async_services().get("notify", {})
    return sorted(f"notify.{name}" for name in services if not name.startswith("_"))


def _register_websocket(hass: HomeAssistant) -> None:
    """Register websocket commands for the frontend panel."""

    def _connection_is_admin(connection) -> bool:
        return bool(getattr(getattr(connection, "user", None), "is_admin", False))

    def _send_admin_required(connection, msg) -> bool:
        if _connection_is_admin(connection):
            return False
        connection.send_error(msg["id"], "admin_required", "SideQuest admin access requires an admin user.")
        return True

    @websocket_api.websocket_command({vol.Required("type"): "chore_quest/list"})
    @callback
    def websocket_list(hass: HomeAssistant, connection, msg) -> None:
        async def _list() -> None:
            store = get_store(hass)
            data = dict(store.data)
            data["user_profiles"] = await _async_user_profiles(hass)
            data["notify_services"] = _notify_services(hass)
            data["notify_targets"] = get_notify_targets(hass)
            data["anyone_quests_due"] = store.due_anyone_quests()
            connection.send_result(msg["id"], data)

        hass.async_create_task(_list())

    @websocket_api.websocket_command({vol.Required("type"): "chore_quest/me"})
    @callback
    def websocket_me(hass: HomeAssistant, connection, msg) -> None:
        store = get_store(hass)
        user_id = getattr(connection, "user", None).id
        child = store.get_child_for_user(user_id)
        chores = store.due_chores_for_child(child["id"]) if child else []
        connection.send_result(
            msg["id"],
            {
                "child": child,
                "chores": chores,
                "anyone_quests": store.due_anyone_quests(),
                "is_kitchen": store.is_kitchen_user(user_id),
            },
        )

    @websocket_api.websocket_command({vol.Required("type"): "chore_quest/users"})
    @callback
    def websocket_users(hass: HomeAssistant, connection, msg) -> None:
        if _send_admin_required(connection, msg):
            return

        async def _users() -> None:
            users = await hass.auth.async_get_users()
            profiles = await _async_user_profiles(hass)
            connection.send_result(
                msg["id"],
                [
                    {
                        "id": user.id,
                        "name": user.name or user.id,
                        "is_admin": bool(user.is_admin),
                        "avatar_url": profiles.get(user.id, {}).get("avatar_url"),
                    }
                    for user in users
                ],
            )

        hass.async_create_task(_users())

    @websocket_api.websocket_command(
        {
            vol.Required("type"): "chore_quest/child_chores",
            vol.Required("child_id"): cv.string,
        }
    )
    @callback
    def websocket_child_chores(hass: HomeAssistant, connection, msg) -> None:
        store = get_store(hass)
        child = store.get_child_for_user(getattr(connection, "user", None).id)
        is_admin = _connection_is_admin(connection)
        is_kitchen = store.is_kitchen_user(getattr(connection, "user", None).id)
        if not is_admin and not is_kitchen and (not child or child["id"] != msg["child_id"]):
            connection.send_error(msg["id"], "not_allowed", "You can only view your own SideQuest chores.")
            return
        connection.send_result(msg["id"], store.due_chores_for_child(msg["child_id"]))

    @websocket_api.websocket_command(
        {
            vol.Required("type"): "chore_quest/upsert_chore",
            vol.Required("chore"): dict,
        }
    )
    @callback
    def websocket_upsert_chore(hass: HomeAssistant, connection, msg) -> None:
        if _send_admin_required(connection, msg):
            return

        async def _save() -> None:
            chore = await get_store(hass).async_upsert_chore(msg["chore"])
            connection.send_result(msg["id"], chore)
            hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "upsert_chore", "chore": chore})

        hass.async_create_task(_save())

    @websocket_api.websocket_command(
        {
            vol.Required("type"): "chore_quest/add_child",
            vol.Required("name"): cv.string,
            vol.Optional("user_ids", default=""): cv.string,
            vol.Optional("goal", default=10): vol.Coerce(float),
        }
    )
    @callback
    def websocket_add_child(hass: HomeAssistant, connection, msg) -> None:
        if _send_admin_required(connection, msg):
            return

        async def _add() -> None:
            user_ids = [user_id.strip() for user_id in msg["user_ids"].split(",") if user_id.strip()]
            child = await get_store(hass).async_add_child(msg["name"], user_ids=user_ids, goal=msg["goal"])
            connection.send_result(msg["id"], child)
            hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "add_child", "child": child})

        hass.async_create_task(_add())

    @websocket_api.websocket_command(
        {
            vol.Required("type"): "chore_quest/delete_child",
            vol.Required("child_id"): cv.string,
        }
    )
    @callback
    def websocket_delete_child(hass: HomeAssistant, connection, msg) -> None:
        if _send_admin_required(connection, msg):
            return

        async def _delete() -> None:
            await get_store(hass).async_delete_child(msg["child_id"])
            connection.send_result(msg["id"], {"ok": True})
            hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "delete_child", "child_id": msg["child_id"]})

        hass.async_create_task(_delete())

    @websocket_api.websocket_command(
        {
            vol.Required("type"): "chore_quest/delete_chore",
            vol.Required("chore_id"): cv.string,
        }
    )
    @callback
    def websocket_delete_chore(hass: HomeAssistant, connection, msg) -> None:
        if _send_admin_required(connection, msg):
            return

        async def _delete() -> None:
            await get_store(hass).async_delete_chore(msg["chore_id"])
            connection.send_result(msg["id"], {"ok": True})
            hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "delete_chore", "chore_id": msg["chore_id"]})

        hass.async_create_task(_delete())

    @websocket_api.websocket_command(
        {
            vol.Required("type"): "chore_quest/upsert_house_room",
            vol.Required("room"): dict,
        }
    )
    @callback
    def websocket_upsert_house_room(hass: HomeAssistant, connection, msg) -> None:
        if _send_admin_required(connection, msg):
            return

        async def _save() -> None:
            room = await get_store(hass).async_upsert_house_room(msg["room"])
            connection.send_result(msg["id"], room)
            hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "upsert_house_room", "room": room})

        hass.async_create_task(_save())

    @websocket_api.websocket_command(
        {
            vol.Required("type"): "chore_quest/delete_house_room",
            vol.Required("room_id"): cv.string,
        }
    )
    @callback
    def websocket_delete_house_room(hass: HomeAssistant, connection, msg) -> None:
        if _send_admin_required(connection, msg):
            return

        async def _delete() -> None:
            await get_store(hass).async_delete_house_room(msg["room_id"])
            connection.send_result(msg["id"], {"ok": True})
            hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "delete_house_room", "room_id": msg["room_id"]})

        hass.async_create_task(_delete())

    @websocket_api.websocket_command(
        {
            vol.Required("type"): "chore_quest/upsert_anyone_quest",
            vol.Required("quest"): dict,
        }
    )
    @callback
    def websocket_upsert_anyone_quest(hass: HomeAssistant, connection, msg) -> None:
        if _send_admin_required(connection, msg):
            return

        async def _save() -> None:
            quest = await get_store(hass).async_upsert_anyone_quest(msg["quest"])
            connection.send_result(msg["id"], quest)
            hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "upsert_anyone_quest", "quest": quest})

        hass.async_create_task(_save())

    @websocket_api.websocket_command(
        {
            vol.Required("type"): "chore_quest/delete_anyone_quest",
            vol.Required("quest_id"): cv.string,
        }
    )
    @callback
    def websocket_delete_anyone_quest(hass: HomeAssistant, connection, msg) -> None:
        if _send_admin_required(connection, msg):
            return

        async def _delete() -> None:
            await get_store(hass).async_delete_anyone_quest(msg["quest_id"])
            await _async_clear_anyone_notifications(hass, msg["quest_id"])
            connection.send_result(msg["id"], {"ok": True})
            hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "delete_anyone_quest", "quest_id": msg["quest_id"]})

        hass.async_create_task(_delete())

    @websocket_api.websocket_command(
        {
            vol.Required("type"): "chore_quest/delete_history_event",
            vol.Required("event_id"): cv.string,
        }
    )
    @callback
    def websocket_delete_history_event(hass: HomeAssistant, connection, msg) -> None:
        if _send_admin_required(connection, msg):
            return

        async def _delete() -> None:
            event = await get_store(hass).async_delete_history_event(msg["event_id"])
            connection.send_result(msg["id"], event)
            hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "delete_history_event", "event": event})

        hass.async_create_task(_delete())

    @websocket_api.websocket_command(
        {
            vol.Required("type"): "chore_quest/update_settings",
            vol.Optional("kitchen_user_ids"): list,
            vol.Optional("dashboard_users"): list,
            vol.Optional("ranks"): list,
            vol.Optional("notify_targets"): list,
        }
    )
    @callback
    def websocket_update_settings(hass: HomeAssistant, connection, msg) -> None:
        if _send_admin_required(connection, msg):
            return

        async def _update() -> None:
            payload = {}
            for key in ("kitchen_user_ids", "dashboard_users", "ranks", "notify_targets"):
                if key in msg:
                    payload[key] = msg[key]
            settings = await get_store(hass).async_update_settings(payload)
            connection.send_result(msg["id"], settings)
            hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "update_settings", "settings": settings})

        hass.async_create_task(_update())

    websocket_api.async_register_command(hass, websocket_list)
    websocket_api.async_register_command(hass, websocket_me)
    websocket_api.async_register_command(hass, websocket_users)
    websocket_api.async_register_command(hass, websocket_child_chores)
    websocket_api.async_register_command(hass, websocket_upsert_chore)
    websocket_api.async_register_command(hass, websocket_add_child)
    websocket_api.async_register_command(hass, websocket_delete_child)
    websocket_api.async_register_command(hass, websocket_delete_chore)
    websocket_api.async_register_command(hass, websocket_upsert_house_room)
    websocket_api.async_register_command(hass, websocket_delete_house_room)
    websocket_api.async_register_command(hass, websocket_upsert_anyone_quest)
    websocket_api.async_register_command(hass, websocket_delete_anyone_quest)
    websocket_api.async_register_command(hass, websocket_delete_history_event)
    websocket_api.async_register_command(hass, websocket_update_settings)

    async def _handle_mobile_action(event) -> None:
        action = event.data.get("action", "")
        prefix_approve = "CHORE_QUEST_APPROVE_"
        prefix_deny = "CHORE_QUEST_DENY_"
        prefix_anyone_approve = "SIDEQUEST_ANYONE_APPROVE_"
        prefix_anyone_deny = "SIDEQUEST_ANYONE_DENY_"
        if action.startswith(prefix_approve):
            payload = action.removeprefix(prefix_approve)
            rating = 5
            chore_id = payload
            if len(payload) > 2 and payload[0] in "12345" and payload[1] == "_":
                rating = int(payload[0])
                chore_id = payload[2:]
            event_data = await get_store(hass).async_approve(chore_id, rating=rating)
            await _async_clear_notifications(hass, chore_id)
            hass.bus.async_fire(
                f"{DOMAIN}_updated",
                {"action": "approve", "chore_id": chore_id, "rating": rating, "event": event_data},
            )
        elif action.startswith(prefix_deny):
            chore_id = action.removeprefix(prefix_deny)
            await get_store(hass).async_deny(chore_id)
            await _async_clear_notifications(hass, chore_id)
            hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "deny", "chore_id": chore_id})
        elif action.startswith(prefix_anyone_approve):
            payload = action.removeprefix(prefix_anyone_approve)
            rating = 5
            quest_id = payload
            if len(payload) > 2 and payload[0] in "12345" and payload[1] == "_":
                rating = int(payload[0])
                quest_id = payload[2:]
            event_data = await get_store(hass).async_approve_anyone_quest(quest_id, rating=rating)
            await _async_clear_anyone_notifications(hass, quest_id)
            hass.bus.async_fire(
                f"{DOMAIN}_updated",
                {"action": "approve_anyone_quest", "quest_id": quest_id, "rating": rating, "event": event_data},
            )
        elif action.startswith(prefix_anyone_deny):
            quest_id = action.removeprefix(prefix_anyone_deny)
            await get_store(hass).async_deny_anyone_quest(quest_id)
            await _async_clear_anyone_notifications(hass, quest_id)
            hass.bus.async_fire(f"{DOMAIN}_updated", {"action": "deny_anyone_quest", "quest_id": quest_id})

    hass.bus.async_listen("mobile_app_notification_action", _handle_mobile_action)
