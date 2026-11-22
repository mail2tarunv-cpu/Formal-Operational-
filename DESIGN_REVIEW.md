# Doodl: UI review against proven mobile patterns

This document records which product patterns informed the **Tarun-only** visual redesign. They are references for interaction quality, not a mandate to copy branded UIs or visual assets.

| Doodl screen | Established reference | Pattern borrowed | Adaptation |
|---|---|---|---|
| Home | Instagram stories, BeReal daily share | Real profile photos in a horizontal social rail; a daily time-bound prompt with one clear CTA | Private circles above one prominent daily art challenge; no public explore feed |
| Daily challenge | Netflix/streaming editorial poster treatments | A real image crop, bold short title, action and schedule | Real art photography as concept artwork, not fake generated scenery |
| Groups | Instagram direct messages / WhatsApp | Photo identity, clear invite actions, concise group rows, persistent conversations | Invite-by-code-only circles, including a 1-to-1 option |
| Drawing editor | Procreate Pocket | Canvas occupies visual priority; a compact toolbar for tools, size and colors; easy undo/redo | One mobile touch canvas, timed 5–10 minutes, prompt always accessible |
| Gallery | Instagram profile grid / posts | Artwork-first grid, profile photos, direct comments and lightweight reactions | Voting is only available in the 7 PM–7 AM window |
| Chat | Instagram DMs / iMessage | Distinct incoming/outgoing bubbles, sender identity and obvious composer | Per-circle local-demo conversation |
| Leaderboard | Strava-style ranked lists | Primary rank and score clearly visible; humans first | Demo points explicitly not server-verified |
| Reveal | Social story-share flows | Large full-bleed image preview, then save or share | Exports the user's drawing with a simple frame; **no AI stitching yet** |
| Settings | iOS grouped settings | Short grouped rows, clear control states, explicit destructive action | Browser-only notifications/settings with transparent limitations |

Official product references:
- Procreate Pocket interface and gestures: https://help.procreate.com/pocket/handbook/interface-gestures/interface
- Procreate Pocket App Store: https://apps.apple.com/us/app/procreate-pocket/id916366645
- BeReal App Store: https://apps.apple.com/us/app/bereal-photos-friends-daily/id1459645446
- Mobile visual composition references from the Inspo archive (Pace Gallery and other photo-led editorial sites).

Sample assets:
- Portrait photography from Unsplash `images.unsplash.com` for the five **fictional demo contacts**. Their labels are not the photographers' or subjects' identities.
- Artwork photography from Unsplash as *representative sample imagery*; the app never treats stock photos as real group uploads.
- Lucide icons throughout. No decorative SVG illustration assets.

## Remaining gaps

1. Authentication, identity, moderation/privacy protections for teenagers.
2. A real cross-device database for circles, invite codes, chat and voting; robust per-person prompt allocation.
3. Server-verified scheduling, notification delivery and votes.
4. AI stitching of group submissions with consent and safety policies.
5. Photo licensing/asset bundling audit, on-device usability testing, performance budget.
