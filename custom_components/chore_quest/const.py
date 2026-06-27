"""Constants for SideQuest."""

DOMAIN = "chore_quest"
STORAGE_KEY = f"{DOMAIN}.data"
STORAGE_VERSION = 1

CONF_NOTIFY_TARGETS = "notify_targets"

DEFAULT_DATA = {
    "children": [],
    "chores": [],
    "anyone_quests": [],
    "global_missions": [],
    "global_mission_templates": [],
    "store_items": [],
    "store_tokens": [],
    "claims": {},
    "anyone_claims": {},
    "history": [],
    "settings": {
        "kitchen_user_ids": [],
        "dashboard_users": [],
        "notify_targets": [],
        "ranks": [
            {"name": "Cadet", "xp": 0, "icon": "mdi:rocket-outline"},
            {"name": "Pilot", "xp": 50, "icon": "mdi:rocket-launch"},
            {"name": "Commander", "xp": 120, "icon": "mdi:shield-star"},
            {"name": "Star Captain", "xp": 250, "icon": "mdi:star-shooting"},
            {"name": "SideQuest Legend", "xp": 500, "icon": "mdi:crown"},
        ],
    },
    "weekly_totals": {},
    "last_week_totals": {},
    "xp_totals": {},
}

NOTIFY_TARGETS_DEFAULT = []
