# SteadyBro

SteadyBro is a mobile-first static web application for Full-Time National
Servicemen (NSFs). It is designed as a private, discreet space for daily
check-ins, weekly reflection, mood tracking, progress and support.

## Current scope

This first version includes the responsive application shell:

- Home dashboard with journal status and a Journal Progress shortcut
- Daily / Quick Reset journal
- Weekly Reflection
- Mood Calendar
- Support options, predefined AI Support Chat and counselling flows
- Journal Progress with up to three locally claimed $5 Shopee sample vouchers
- Mobile bottom navigation
- Responsive desktop layout
- Local-only privacy message

Counselling request details are transient and are never written to local
storage. Existing journal data remains under the original
`quickResetDailyEntries`, `quickResetWeeklyEntries` and
`quickResetSupportPlan` keys. Reward claim state is stored separately under
`steadyBroProgress`. Each reward cycle requires 18 unique Daily Journal dates
and 3 unique Weekly Reflection `weekStart` periods. Up to three cycles can be
claimed; missing days do not reset progress and journal entries are preserved.

## Privacy

There is no login, backend, cloud database or external analytics. When
user-generated features are added, their data will be stored only in the
browser using `localStorage`.

## Run locally

No build tools or dependencies are required. Open `index.html` directly in a
browser, or serve the folder with any static file server:

```bash
python3 -m http.server
```

Then visit `http://localhost:8000`.
