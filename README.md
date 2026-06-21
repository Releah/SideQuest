# SideQuest

SideQuest is a Home Assistant custom integration for family chores, rewards, house missions, XP, ranks, and kid-friendly dashboards.

It stores its data in Home Assistant storage and provides a custom sidebar panel, so normal chore management does not require YAML helpers.

## Features

- Kid view for personal weekly quests.
- Shared dashboard view for house tablets or room users.
- Parent/admin panel for players, chores, house missions, pocket money, ranks, and logs.
- Parent approval flow with optional Home Assistant mobile app notifications.
- Reward, XP, rank, badge, schedule, repeat, and quantity settings per chore.
- Global house missions with reusable templates and claimable subtasks.

## Manual Install

Copy this folder:

```text
custom_components/chore_quest/
```

to your Home Assistant config folder:

```text
/config/custom_components/chore_quest/
```

Restart Home Assistant, then add the integration:

```text
Settings -> Devices & services -> Add integration -> SideQuest
```

## Notification Targets

Notification targets are optional. Leave the field blank if you do not want mobile approval notifications.

If you do want notifications, enter comma-separated notify service names, for example:

```text
notify.mobile_app_parent_phone, notify.mobile_app_second_parent_phone
```

You can find your notify services in Home Assistant Developer Tools.

## First Setup

1. Open the SideQuest sidebar panel.
2. Go to Admin -> Player management.
3. Add children and link them to Home Assistant users.
4. Optionally add dashboard users for shared tablets or room accounts.
5. Go to Admin -> Weekly chores and create chores for each child.
6. Go to Admin -> Global Missions to create shared house missions.
7. Go to Admin -> Ranks to customise the XP ladder.

## Notes

- A Home Assistant admin user is required for admin actions.
- Child users only see their own kid view and the house-mission view.
- Dashboard users see the shared dashboard.
- Existing data is kept in Home Assistant storage under the `chore_quest` domain.
