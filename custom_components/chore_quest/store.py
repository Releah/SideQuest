"""Persistent SideQuest data store."""

from __future__ import annotations

from copy import deepcopy
from datetime import datetime
import uuid

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import DEFAULT_DATA, STORAGE_KEY, STORAGE_VERSION


class SideQuestStore:
    """Small persistence layer for children, chores, claims, and history."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self.data = deepcopy(DEFAULT_DATA)

    async def async_load(self) -> None:
        """Load data from Home Assistant storage."""
        stored = await self._store.async_load()
        if stored:
            self.data = self._merge_defaults(stored)
        for mission in self.data.get("global_missions", []):
            mission["tasks"] = self._normalise_global_tasks(mission)
        for template in self.data.get("global_mission_templates", []):
            template["tasks"] = self._normalise_global_tasks(template)
        self._normalise_history_xp()
        self._rebuild_xp_totals()
        await self.async_save()

    async def async_save(self) -> None:
        """Save data to Home Assistant storage."""
        await self._store.async_save(self.data)

    def _merge_defaults(self, stored: dict) -> dict:
        merged = deepcopy(DEFAULT_DATA)
        merged.update(stored)
        for key in ("children", "chores", "anyone_quests", "global_missions", "global_mission_templates", "history"):
            merged[key] = stored.get(key, merged[key])
        merged["settings"] = {**merged.get("settings", {}), **stored.get("settings", {})}
        for key in ("claims", "anyone_claims", "weekly_totals", "last_week_totals", "xp_totals"):
            merged[key] = {**merged.get(key, {}), **stored.get(key, {})}
        return merged

    def is_kitchen_user(self, user_id: str | None) -> bool:
        """Return whether a Home Assistant user is linked to the kitchen view."""
        if not user_id:
            return False
        settings = self.data.get("settings", {})
        dashboard_users = settings.get("dashboard_users", [])
        if any(item.get("user_id") == user_id for item in dashboard_users):
            return True
        return user_id in settings.get("kitchen_user_ids", [])

    def get_child_for_user(self, user_id: str | None) -> dict | None:
        """Return the child linked to a Home Assistant user id."""
        if not user_id:
            return None
        for child in self.data["children"]:
            if user_id in child.get("user_ids", []):
                return child
        return None

    def due_chores_for_child(self, child_id: str, when: datetime | None = None) -> list[dict]:
        """Return enabled chores that are available to claim."""
        when = when or dt_util.now()
        return [
            chore
            for chore in self.data["chores"]
            if chore.get("child_id") == child_id
            and chore.get("enabled", True)
            and self.is_due(chore, when)
            and self.is_claimable(chore, when)
        ]

    def is_due(self, chore: dict, when: datetime) -> bool:
        """Return whether a chore is due on the supplied date."""
        schedule = chore.get("schedule", {"type": "daily"})
        schedule_type = schedule.get("type", "daily")
        if schedule_type == "none":
            return True
        if schedule_type == "daily":
            return True
        if schedule_type == "days":
            return when.weekday() in schedule.get("days", [])
        return True

    def is_claimable(self, chore: dict, when: datetime) -> bool:
        """Return whether the chore can be claimed again."""
        return self._is_claimable(chore, when, self.data["claims"], "approved", "chore_id")

    def due_anyone_quests(self, when: datetime | None = None) -> list[dict]:
        """Return enabled shared quests that any child can claim."""
        when = when or dt_util.now()
        return [
            quest
            for quest in self.data["anyone_quests"]
            if quest.get("enabled", True)
            and self.is_due(quest, when)
            and self.is_anyone_claimable(quest, when)
        ]

    def is_anyone_claimable(self, quest: dict, when: datetime) -> bool:
        """Return whether a shared quest can be claimed again."""
        return self._is_claimable(quest, when, self.data["anyone_claims"], "anyone_approved", "quest_id")

    def _is_claimable(
        self,
        quest: dict,
        when: datetime,
        claims: dict,
        approved_event_type: str,
        event_id_key: str,
    ) -> bool:
        repeat_mode = quest.get("repeat_mode", "once_per_day")
        if repeat_mode == "unlimited":
            return True
        if quest["id"] in claims:
            return False

        for event in self.data["history"]:
            if event.get("type") != approved_event_type or event.get(event_id_key) != quest["id"]:
                continue
            created_at = dt_util.parse_datetime(event.get("created_at", ""))
            if created_at is None:
                continue
            created_at = dt_util.as_local(created_at)
            if repeat_mode == "once_per_day" and created_at.date() == when.date():
                return False
            if repeat_mode == "once_per_week" and created_at.isocalendar()[:2] == when.isocalendar()[:2]:
                return False

        return True

    async def async_add_child(self, name: str, user_ids: list[str] | None = None, goal: float = 10) -> dict:
        """Add a child."""
        child_id = self._slug(name)
        if any(child["id"] == child_id for child in self.data["children"]):
            raise ValueError(f"Child already exists: {name}")
        child = {"id": child_id, "name": name, "user_ids": user_ids or [], "goal": goal}
        self.data["children"].append(child)
        self.data["weekly_totals"].setdefault(child_id, 0)
        self.data["last_week_totals"].setdefault(child_id, 0)
        self.data["xp_totals"].setdefault(child_id, 0)
        await self.async_save()
        return child

    async def async_delete_child(self, child_id: str) -> None:
        """Delete a child, their chores, claims, and totals."""
        if not any(child["id"] == child_id for child in self.data["children"]):
            raise ValueError(f"Unknown child_id: {child_id}")

        chore_ids = {chore["id"] for chore in self.data["chores"] if chore.get("child_id") == child_id}
        self.data["children"] = [child for child in self.data["children"] if child["id"] != child_id]
        self.data["chores"] = [chore for chore in self.data["chores"] if chore.get("child_id") != child_id]
        self.data["claims"] = {
            chore_id: claim
            for chore_id, claim in self.data["claims"].items()
            if chore_id not in chore_ids
        }
        self.data["anyone_claims"] = {
            claim_id: claim
            for claim_id, claim in self.data["anyone_claims"].items()
            if claim.get("child_id") != child_id
        }
        self.data["weekly_totals"].pop(child_id, None)
        self.data["last_week_totals"].pop(child_id, None)
        self.data["xp_totals"].pop(child_id, None)
        await self.async_save()

    async def async_upsert_chore(self, chore: dict) -> dict:
        """Create or update a chore."""
        chore = dict(chore)
        chore.setdefault("id", self._slug(f"{chore['child_id']}_{chore['name']}"))
        chore.setdefault("enabled", True)
        chore.setdefault("approval_required", True)
        chore.setdefault("schedule", {"type": "daily"})
        chore.setdefault("repeat_mode", "once_per_day")
        chore.setdefault("icon", "mdi:clipboard-check")
        chore.setdefault("description", "")
        chore.setdefault("badges", [])
        chore.setdefault("xp", 10)
        chore.setdefault("quantity_enabled", False)
        chore.setdefault("quantity_label", "How many?")
        chore["reward"] = float(chore.get("reward", 0))
        chore["xp"] = int(float(chore.get("xp", 0)))
        chore["badges"] = self._normalise_badges(chore.get("badges", []))
        chore["quantity_enabled"] = bool(chore.get("quantity_enabled", False))
        chore["quantity_label"] = str(chore.get("quantity_label", "")).strip() or "How many?"

        existing = next((item for item in self.data["chores"] if item["id"] == chore["id"]), None)
        if existing:
            existing.update(chore)
            result = existing
        else:
            self.data["chores"].append(chore)
            result = chore

        await self.async_save()
        return result

    async def async_delete_chore(self, chore_id: str) -> None:
        """Delete a chore and any open claim."""
        self.data["chores"] = [chore for chore in self.data["chores"] if chore["id"] != chore_id]
        self.data["claims"].pop(chore_id, None)
        await self.async_save()

    async def async_upsert_anyone_quest(self, quest: dict) -> dict:
        """Create or update a quest that can be claimed by any child."""
        quest = dict(quest)
        quest.setdefault("id", self._slug(f"anyone_{quest['name']}"))
        quest.setdefault("enabled", True)
        quest.setdefault("approval_required", True)
        quest.setdefault("schedule", {"type": "daily"})
        quest.setdefault("repeat_mode", "once_per_day")
        quest.setdefault("icon", "mdi:account-group")
        quest.setdefault("description", "")
        quest.setdefault("badges", ["team"])
        quest.setdefault("xp", 10)
        quest.setdefault("quantity_enabled", False)
        quest.setdefault("quantity_label", "How many?")
        quest["reward"] = float(quest.get("reward", 0))
        quest["xp"] = int(float(quest.get("xp", 0)))
        quest["badges"] = self._normalise_badges(quest.get("badges", []))
        quest["quantity_enabled"] = bool(quest.get("quantity_enabled", False))
        quest["quantity_label"] = str(quest.get("quantity_label", "")).strip() or "How many?"

        existing = next((item for item in self.data["anyone_quests"] if item["id"] == quest["id"]), None)
        if existing:
            existing.update(quest)
            result = existing
        else:
            self.data["anyone_quests"].append(quest)
            result = quest

        await self.async_save()
        return result

    async def async_delete_anyone_quest(self, quest_id: str) -> None:
        """Delete a shared quest and any open claims for it."""
        self.data["anyone_quests"] = [quest for quest in self.data["anyone_quests"] if quest["id"] != quest_id]
        self.data["anyone_claims"] = {
            key: claim
            for key, claim in self.data["anyone_claims"].items()
            if claim.get("quest_id") != quest_id
        }
        await self.async_save()

    async def async_claim_anyone_quest(
        self,
        quest_id: str,
        child_id: str,
        claimed_by: str | None = None,
        quantity: int = 1,
    ) -> dict:
        """Claim a shared quest for a child."""
        if not any(child["id"] == child_id for child in self.data["children"]):
            raise ValueError(f"Unknown child_id: {child_id}")
        quest = self.get_anyone_quest(quest_id)
        if not self.is_anyone_claimable(quest, dt_util.now()):
            raise ValueError("This quest is not currently available to claim.")
        now = dt_util.now().isoformat()
        quantity = max(1, int(quantity or 1))
        claim_id = str(uuid.uuid4())
        claim = {
            "id": claim_id,
            "quest_id": quest_id,
            "child_id": child_id,
            "claimed_by": claimed_by,
            "claimed_at": now,
            "status": "pending",
            "quantity": quantity,
        }
        claim_key = claim_id if quest.get("repeat_mode") == "unlimited" else quest_id
        self.data["anyone_claims"][claim_key] = claim
        self._add_anyone_history("anyone_claimed", quest, claim, user_id=claimed_by)
        await self.async_save()
        return claim

    async def async_approve_anyone_quest(
        self,
        quest_id: str,
        approved_by: str | None = None,
        rating: int = 5,
    ) -> dict:
        """Approve a shared quest and award it to the claiming child."""
        quest = self.get_anyone_quest(quest_id)
        claim = self.data["anyone_claims"].pop(quest_id, None)
        if claim is None:
            claim_key = next(
                (key for key, value in self.data["anyone_claims"].items() if value.get("quest_id") == quest_id),
                None,
            )
            claim = self.data["anyone_claims"].pop(claim_key, None) if claim_key else None
        if not claim:
            raise ValueError("This quest has no pending claim.")
        child_id = claim["child_id"]
        base_reward = float(quest.get("reward", 0))
        quantity = max(1, int(claim.get("quantity", 1) or 1))
        rating = max(1, min(5, int(rating or 5)))
        reward = round(base_reward * quantity * (rating / 5), 2)
        xp = round(int(quest.get("xp", 0)) * quantity * (rating / 5))
        self.data["weekly_totals"][child_id] = round(
            float(self.data["weekly_totals"].get(child_id, 0)) + reward, 2
        )
        self.data.setdefault("xp_totals", {})
        self.data["xp_totals"][child_id] = int(self.data["xp_totals"].get(child_id, 0)) + xp
        event = self._add_anyone_history(
            "anyone_approved",
            quest,
            claim,
            user_id=approved_by,
            reward=reward,
            rating=rating,
            base_reward=round(base_reward * quantity, 2),
            xp=xp,
            badges=quest.get("badges", []),
            quantity=quantity,
        )
        await self.async_save()
        return event

    async def async_deny_anyone_quest(self, quest_id: str, denied_by: str | None = None) -> dict:
        """Deny a shared quest claim."""
        quest = self.get_anyone_quest(quest_id)
        claim = self.data["anyone_claims"].pop(quest_id, None)
        if claim is None:
            claim_key = next(
                (key for key, value in self.data["anyone_claims"].items() if value.get("quest_id") == quest_id),
                None,
            )
            claim = self.data["anyone_claims"].pop(claim_key, None) if claim_key else None
        event = self._add_anyone_history("anyone_denied", quest, claim, user_id=denied_by)
        await self.async_save()
        return event

    async def async_claim(self, chore_id: str, claimed_by: str | None = None, quantity: int = 1) -> dict:
        """Mark a chore as claimed done and pending approval."""
        chore = self.get_chore(chore_id)
        if not self.is_claimable(chore, dt_util.now()):
            raise ValueError("This chore is not currently available to claim.")
        now = dt_util.now().isoformat()
        quantity = max(1, int(quantity or 1))
        claim_id = str(uuid.uuid4())
        claim = {
            "id": claim_id,
            "chore_id": chore_id,
            "child_id": chore["child_id"],
            "claimed_by": claimed_by,
            "claimed_at": now,
            "status": "pending",
            "quantity": quantity,
        }
        claim_key = claim_id if chore.get("repeat_mode") == "unlimited" else chore_id
        self.data["claims"][claim_key] = claim
        self._add_history("claimed", chore, claim, user_id=claimed_by)
        await self.async_save()
        return claim

    async def async_approve(self, chore_id: str, approved_by: str | None = None, rating: int = 5) -> dict:
        """Approve a chore and add the rated reward to the weekly total."""
        chore = self.get_chore(chore_id)
        claim = self.data["claims"].pop(chore_id, None)
        if claim is None:
            claim_key = next(
                (key for key, value in self.data["claims"].items() if value.get("chore_id") == chore_id),
                None,
            )
            claim = self.data["claims"].pop(claim_key, None) if claim_key else None
        child_id = chore["child_id"]
        base_reward = float(chore.get("reward", 0))
        quantity = max(1, int((claim or {}).get("quantity", 1) or 1))
        rating = max(1, min(5, int(rating or 5)))
        reward = round(base_reward * quantity * (rating / 5), 2)
        xp = round(int(chore.get("xp", 0)) * quantity * (rating / 5))
        self.data["weekly_totals"][child_id] = round(
            float(self.data["weekly_totals"].get(child_id, 0)) + reward, 2
        )
        self.data.setdefault("xp_totals", {})
        self.data["xp_totals"][child_id] = int(self.data["xp_totals"].get(child_id, 0)) + xp
        event = self._add_history(
            "approved",
            chore,
            claim,
            user_id=approved_by,
            reward=reward,
            rating=rating,
            base_reward=round(base_reward * quantity, 2),
            xp=xp,
            badges=chore.get("badges", []),
            quantity=quantity,
        )
        await self.async_save()
        return event

    async def async_deny(self, chore_id: str, denied_by: str | None = None) -> dict:
        """Deny a chore claim."""
        chore = self.get_chore(chore_id)
        claim = self.data["claims"].pop(chore_id, None)
        if claim is None:
            claim_key = next(
                (key for key, value in self.data["claims"].items() if value.get("chore_id") == chore_id),
                None,
            )
            claim = self.data["claims"].pop(claim_key, None) if claim_key else None
        event = self._add_history("denied", chore, claim, user_id=denied_by)
        await self.async_save()
        return event

    async def async_weekly_reset(self) -> None:
        """Save last week totals and reset current totals."""
        self.data["last_week_totals"] = dict(self.data["weekly_totals"])
        self.data["weekly_totals"] = {child["id"]: 0 for child in self.data["children"]}
        await self.async_save()

    async def async_adjust_money(
        self,
        child_id: str,
        amount: float,
        note: str,
        user_id: str | None = None,
    ) -> dict:
        """Add or subtract pocket money with a note."""
        if not any(child["id"] == child_id for child in self.data["children"]):
            raise ValueError(f"Unknown child_id: {child_id}")
        amount = round(float(amount), 2)
        current = float(self.data["weekly_totals"].get(child_id, 0))
        self.data["weekly_totals"][child_id] = round(max(0, current + amount), 2)
        event = {
            "id": str(uuid.uuid4()),
            "type": "money_adjustment",
            "child_id": child_id,
            "chore_id": "money_adjustment",
            "chore_name": note or "Pocket money adjustment",
            "user_id": user_id,
            "reward": amount,
            "note": note,
            "created_at": dt_util.now().isoformat(),
        }
        self.data["history"].insert(0, event)
        self.data["history"] = self.data["history"][:500]
        await self.async_save()
        return event

    async def async_upsert_global_mission(self, mission: dict) -> dict:
        """Create or update a global household mission."""
        mission = dict(mission)
        mission.setdefault("id", self._slug(mission["name"]))
        mission.setdefault("description", "")
        mission.setdefault("icon", "mdi:rocket-launch")
        mission.setdefault("badges", ["team"])
        mission.setdefault("xp", 5)
        mission.setdefault("enabled", True)
        mission.setdefault("done", False)
        mission.setdefault("tasks", [])
        mission["xp"] = int(float(mission.get("xp", 0)))
        mission["badges"] = self._normalise_badges(mission.get("badges", []))
        mission["tasks"] = self._normalise_global_tasks(mission)

        existing = next((item for item in self.data["global_missions"] if item["id"] == mission["id"]), None)
        if existing:
            existing.update(mission)
            result = existing
        else:
            self.data["global_missions"].append(mission)
            result = mission
        await self.async_save()
        return result

    async def async_save_global_mission_template(self, mission_id: str) -> dict:
        """Save a reusable template from an existing global mission."""
        mission = self.get_global_mission(mission_id)
        template = deepcopy(mission)
        template["id"] = self._slug(f"template_{mission['name']}")
        template["source_mission_id"] = mission_id
        template.pop("done", None)
        template.pop("completed_by", None)
        template.pop("completed_child_id", None)
        template.pop("completed_at", None)
        for task in template.get("tasks", []):
            for key in ("status", "claimed_by", "claimed_child_id", "claimed_at", "approved_by", "approved_at", "completed_at"):
                task.pop(key, None)
        existing = next((item for item in self.data["global_mission_templates"] if item["id"] == template["id"]), None)
        if existing:
            existing.update(template)
            result = existing
        else:
            self.data["global_mission_templates"].append(template)
            result = template
        await self.async_save()
        return result

    async def async_launch_global_mission_template(self, template_id: str) -> dict:
        """Create a fresh global mission from a saved template."""
        template = next((item for item in self.data["global_mission_templates"] if item["id"] == template_id), None)
        if not template:
            raise ValueError(f"Unknown template_id: {template_id}")
        mission = deepcopy(template)
        mission["id"] = self._slug(f"{mission['name']}_{uuid.uuid4().hex[:6]}")
        mission["done"] = False
        mission["enabled"] = True
        for task in mission.get("tasks", []):
            task["status"] = "open"
            for key in ("claimed_by", "claimed_child_id", "claimed_at", "approved_by", "approved_at", "completed_at"):
                task.pop(key, None)
        self.data["global_missions"].append(mission)
        await self.async_save()
        return mission

    async def async_delete_global_mission_template(self, template_id: str) -> None:
        """Delete a saved global mission template."""
        before = len(self.data["global_mission_templates"])
        self.data["global_mission_templates"] = [
            template for template in self.data["global_mission_templates"] if template["id"] != template_id
        ]
        if len(self.data["global_mission_templates"]) == before:
            raise ValueError(f"Unknown template_id: {template_id}")
        await self.async_save()

    async def async_delete_global_mission(self, mission_id: str) -> None:
        """Delete a global household mission."""
        self.data["global_missions"] = [
            mission for mission in self.data["global_missions"] if mission["id"] != mission_id
        ]
        await self.async_save()

    async def async_complete_global_mission(
        self,
        mission_id: str,
        completed_by: str | None = None,
        child_id: str | None = None,
    ) -> dict:
        """Mark a global mission complete without changing pocket money."""
        mission = self.get_global_mission(mission_id)
        xp = int(mission.get("xp", 0))
        if child_id:
            if not any(child["id"] == child_id for child in self.data["children"]):
                raise ValueError(f"Unknown child_id: {child_id}")
            self.data.setdefault("xp_totals", {})
            self.data["xp_totals"][child_id] = int(self.data["xp_totals"].get(child_id, 0)) + xp
        mission["done"] = True
        mission["completed_by"] = completed_by
        mission["completed_child_id"] = child_id
        mission["completed_at"] = dt_util.now().isoformat()
        event = {
            "id": str(uuid.uuid4()),
            "type": "global_mission_completed",
            "child_id": child_id or "house",
            "chore_id": mission_id,
            "chore_name": mission["name"],
            "user_id": completed_by,
            "reward": 0,
            "xp": xp,
            "badges": mission.get("badges", []),
            "created_at": dt_util.now().isoformat(),
        }
        self.data["history"].insert(0, event)
        self.data["history"] = self.data["history"][:500]
        await self.async_save()
        return event

    async def async_claim_global_task(
        self,
        mission_id: str,
        task_id: str,
        child_id: str,
        claimed_by: str | None = None,
    ) -> dict:
        """Claim or complete a global mission task."""
        mission = self.get_global_mission(mission_id)
        task = self.get_global_task(mission, task_id)
        if task.get("status") in ("pending", "approved", "done"):
            raise ValueError("This mission task has already been claimed or completed.")
        task["claimed_by"] = claimed_by
        task["claimed_child_id"] = child_id
        task["claimed_at"] = dt_util.now().isoformat()
        if task.get("approval_required", True):
            task["status"] = "pending"
            event_type = "global_task_claimed"
        else:
            self._complete_global_task(mission, task, child_id, approved_by=claimed_by)
            event_type = "global_task_completed"
        event = self._global_task_event(event_type, mission, task, child_id, user_id=claimed_by)
        await self.async_save()
        return event

    async def async_approve_global_task(
        self,
        mission_id: str,
        task_id: str,
        approved_by: str | None = None,
    ) -> dict:
        """Approve a claimed global mission task."""
        mission = self.get_global_mission(mission_id)
        task = self.get_global_task(mission, task_id)
        child_id = task.get("claimed_child_id")
        if not child_id:
            raise ValueError("Mission task has not been claimed by a player.")
        self._complete_global_task(mission, task, child_id, approved_by=approved_by)
        event = self._global_task_event("global_task_approved", mission, task, child_id, user_id=approved_by)
        await self.async_save()
        return event

    async def async_deny_global_task(
        self,
        mission_id: str,
        task_id: str,
        denied_by: str | None = None,
    ) -> dict:
        """Deny and reopen a claimed global mission task."""
        mission = self.get_global_mission(mission_id)
        task = self.get_global_task(mission, task_id)
        child_id = task.get("claimed_child_id")
        event = self._global_task_event("global_task_denied", mission, task, child_id or "house", user_id=denied_by)
        for key in ("claimed_by", "claimed_child_id", "claimed_at"):
            task.pop(key, None)
        task["status"] = "open"
        await self.async_save()
        return event

    async def async_delete_history_event(self, event_id: str) -> dict:
        """Delete a history event and reverse its current-week reward if needed."""
        event = next((item for item in self.data["history"] if item["id"] == event_id), None)
        if not event:
            raise ValueError(f"Unknown history event_id: {event_id}")

        self.data["history"] = [item for item in self.data["history"] if item["id"] != event_id]

        if event.get("type") in ("approved", "anyone_approved", "money_adjustment", "global_task_approved", "global_task_completed"):
            child_id = event["child_id"]
            reward = float(event.get("reward", 0))
            current = float(self.data["weekly_totals"].get(child_id, 0))
            self.data["weekly_totals"][child_id] = round(max(0, current - reward), 2)
        if event.get("type") in ("approved", "anyone_approved", "global_task_approved", "global_task_completed"):
            child_id = event["child_id"]
            xp = int(event.get("xp", 0))
            current_xp = int(self.data.get("xp_totals", {}).get(child_id, 0))
            self.data.setdefault("xp_totals", {})
            self.data["xp_totals"][child_id] = max(0, current_xp - xp)

        await self.async_save()
        return event

    async def async_update_settings(self, settings: dict) -> dict:
        """Update app settings."""
        current = self.data.setdefault("settings", {})
        if "kitchen_user_ids" in settings:
            current["kitchen_user_ids"] = [
                user_id.strip()
                for user_id in settings.get("kitchen_user_ids", [])
                if user_id and user_id.strip()
            ]
        if "dashboard_users" in settings:
            dashboard_users = []
            seen_user_ids = set()
            for item in settings.get("dashboard_users", []):
                user_id = str(item.get("user_id", "")).strip()
                if not user_id or user_id in seen_user_ids:
                    continue
                name = str(item.get("name", "")).strip()
                dashboard_users.append({"user_id": user_id, "name": name})
                seen_user_ids.add(user_id)
            current["dashboard_users"] = dashboard_users
            current["kitchen_user_ids"] = [item["user_id"] for item in dashboard_users]
        if "notify_targets" in settings:
            notify_targets = []
            seen_targets = set()
            for item in settings.get("notify_targets", []):
                if isinstance(item, dict):
                    target = str(item.get("target", "")).strip()
                    name = str(item.get("name", "")).strip()
                else:
                    target = str(item).strip()
                    name = ""
                if not target or target in seen_targets:
                    continue
                notify_targets.append({"name": name or target, "target": target})
                seen_targets.add(target)
            current["notify_targets"] = notify_targets
        if "ranks" in settings:
            ranks = []
            seen_names = set()
            for item in settings.get("ranks", []):
                name = str(item.get("name", "")).strip()
                if not name:
                    continue
                name_key = name.lower()
                if name_key in seen_names:
                    continue
                icon = str(item.get("icon", "")).strip() or "mdi:rocket-outline"
                try:
                    xp = max(0, int(float(item.get("xp", 0))))
                except (TypeError, ValueError):
                    xp = 0
                ranks.append({"name": name, "xp": xp, "icon": icon})
                seen_names.add(name_key)
            current["ranks"] = sorted(ranks, key=lambda rank: rank["xp"])
        await self.async_save()
        return current

    def get_chore(self, chore_id: str) -> dict:
        """Return a chore by id."""
        for chore in self.data["chores"]:
            if chore["id"] == chore_id:
                return chore
        raise ValueError(f"Unknown chore_id: {chore_id}")

    def get_anyone_quest(self, quest_id: str) -> dict:
        """Return a shared quest by id."""
        for quest in self.data["anyone_quests"]:
            if quest["id"] == quest_id:
                return quest
        raise ValueError(f"Unknown quest_id: {quest_id}")

    def _get_chore_or_none(self, chore_id: str | None) -> dict | None:
        """Return a chore by id, if it still exists."""
        if not chore_id:
            return None
        for chore in self.data["chores"]:
            if chore["id"] == chore_id:
                return chore
        return None

    def _normalise_history_xp(self) -> None:
        """Backfill missing XP on old approved chore history entries."""
        for event in self.data.get("history", []):
            if event.get("type") not in ("approved", "anyone_approved"):
                continue
            quest = self._get_chore_or_none(event.get("chore_id")) or self._get_anyone_quest_or_none(event.get("quest_id"))
            if not quest:
                continue
            quest_xp = int(float(quest.get("xp", 0) or 0))
            if not quest_xp:
                continue
            current_xp = int(float(event.get("xp", 0) or 0))
            if current_xp:
                continue
            rating = max(1, min(5, int(event.get("rating") or 5)))
            quantity = max(1, int(event.get("quantity", 1) or 1))
            event["xp"] = round(quest_xp * quantity * (rating / 5))

    def _rebuild_xp_totals(self) -> None:
        """Rebuild XP totals from history so backfilled events are counted."""
        totals = {child["id"]: 0 for child in self.data.get("children", [])}
        for event in self.data.get("history", []):
            if event.get("type") not in ("approved", "anyone_approved", "global_task_approved", "global_task_completed"):
                continue
            child_id = event.get("child_id")
            if not child_id:
                continue
            totals[child_id] = int(totals.get(child_id, 0)) + int(float(event.get("xp", 0) or 0))
        self.data["xp_totals"] = totals

    def get_global_mission(self, mission_id: str) -> dict:
        """Return a global mission by id."""
        for mission in self.data["global_missions"]:
            if mission["id"] == mission_id:
                return mission
        raise ValueError(f"Unknown global mission_id: {mission_id}")

    def get_global_task(self, mission: dict, task_id: str) -> dict:
        """Return a global mission task by id."""
        for task in mission.get("tasks", []):
            if task["id"] == task_id:
                return task
        raise ValueError(f"Unknown global task_id: {task_id}")

    def _add_history(
        self,
        event_type: str,
        chore: dict,
        claim: dict | None,
        user_id: str | None = None,
        reward: float = 0,
        rating: int | None = None,
        base_reward: float | None = None,
        xp: int = 0,
        badges: list[str] | None = None,
        quantity: int = 1,
    ) -> dict:
        event = {
            "id": str(uuid.uuid4()),
            "type": event_type,
            "chore_id": chore["id"],
            "chore_name": chore["name"],
            "child_id": chore["child_id"],
            "user_id": user_id,
            "reward": reward,
            "rating": rating,
            "base_reward": base_reward,
            "xp": xp,
            "badges": badges or [],
            "quantity": quantity,
            "claim": claim,
            "created_at": dt_util.now().isoformat(),
        }
        self.data["history"].insert(0, event)
        self.data["history"] = self.data["history"][:500]
        return event

    def _get_anyone_quest_or_none(self, quest_id: str | None) -> dict | None:
        """Return a shared quest by id, if it still exists."""
        if not quest_id:
            return None
        for quest in self.data["anyone_quests"]:
            if quest["id"] == quest_id:
                return quest
        return None

    def _add_anyone_history(
        self,
        event_type: str,
        quest: dict,
        claim: dict | None,
        user_id: str | None = None,
        reward: float = 0,
        rating: int | None = None,
        base_reward: float | None = None,
        xp: int = 0,
        badges: list[str] | None = None,
        quantity: int = 1,
    ) -> dict:
        event = {
            "id": str(uuid.uuid4()),
            "type": event_type,
            "quest_id": quest["id"],
            "quest_name": quest["name"],
            "chore_id": quest["id"],
            "chore_name": quest["name"],
            "child_id": (claim or {}).get("child_id"),
            "user_id": user_id,
            "reward": reward,
            "rating": rating,
            "base_reward": base_reward,
            "xp": xp,
            "badges": badges or [],
            "quantity": quantity,
            "claim": claim,
            "created_at": dt_util.now().isoformat(),
        }
        self.data["history"].insert(0, event)
        self.data["history"] = self.data["history"][:500]
        return event

    def _slug(self, value: str) -> str:
        return "".join(ch if ch.isalnum() else "_" for ch in value.strip().lower()).strip("_")

    def _normalise_badges(self, badges) -> list[str]:
        if isinstance(badges, str):
            badges = [badge.strip() for badge in badges.split(",")]
        return [str(badge).strip().lower() for badge in badges if str(badge).strip()]

    def _normalise_global_tasks(self, mission: dict) -> list[dict]:
        tasks = mission.get("tasks") or []
        if isinstance(tasks, str):
            tasks = [line.strip() for line in tasks.splitlines() if line.strip()]
        if not tasks:
            tasks = [
                {
                    "name": mission["name"],
                    "description": mission.get("description", ""),
                    "xp": mission.get("xp", 5),
                    "reward": 0,
                    "approval_required": False,
                }
            ]

        normalised = []
        for index, task in enumerate(tasks, start=1):
            if isinstance(task, str):
                task = {"name": task}
            task = dict(task)
            task.setdefault("id", self._slug(f"{index}_{task.get('name', 'task')}"))
            task.setdefault("name", f"Task {index}")
            task.setdefault("description", "")
            task.setdefault("xp", mission.get("xp", 5))
            task.setdefault("reward", 0)
            task.setdefault("approval_required", True)
            task.setdefault("status", "open")
            task["xp"] = int(float(task.get("xp", 0)))
            task["reward"] = float(task.get("reward", 0))
            task["approval_required"] = bool(task.get("approval_required", True))
            normalised.append(task)
        return normalised

    def _complete_global_task(self, mission: dict, task: dict, child_id: str, approved_by: str | None = None) -> None:
        task["status"] = "approved"
        task["approved_by"] = approved_by
        task["approved_at"] = dt_util.now().isoformat()
        task["completed_at"] = task["approved_at"]
        reward = round(float(task.get("reward", 0)), 2)
        xp = int(task.get("xp", 0))
        self.data.setdefault("xp_totals", {})
        self.data["xp_totals"][child_id] = int(self.data["xp_totals"].get(child_id, 0)) + xp
        if reward:
            current = float(self.data["weekly_totals"].get(child_id, 0))
            self.data["weekly_totals"][child_id] = round(current + reward, 2)
        if mission.get("tasks") and all(item.get("status") == "approved" for item in mission["tasks"]):
            mission["done"] = True
            mission["completed_at"] = dt_util.now().isoformat()

    def _global_task_event(
        self,
        event_type: str,
        mission: dict,
        task: dict,
        child_id: str,
        user_id: str | None = None,
    ) -> dict:
        event = {
            "id": str(uuid.uuid4()),
            "type": event_type,
            "child_id": child_id,
            "chore_id": mission["id"],
            "task_id": task["id"],
            "chore_name": f"{mission['name']} - {task['name']}",
            "user_id": user_id,
            "reward": float(task.get("reward", 0)) if event_type in ("global_task_approved", "global_task_completed") else 0,
            "xp": int(task.get("xp", 0)) if event_type in ("global_task_approved", "global_task_completed") else 0,
            "badges": mission.get("badges", []),
            "created_at": dt_util.now().isoformat(),
        }
        self.data["history"].insert(0, event)
        self.data["history"] = self.data["history"][:500]
        return event
