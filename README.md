# Quick Reset

Quick Reset is a mobile-first static web application for Full-Time National
Servicemen (NSFs). It is designed as a private, discreet space for daily
check-ins, weekly reflection, mood tracking and support.

## Current scope

This first version includes the responsive application shell:

- Daily / Quick Reset (the default page)
- Weekly Reflection
- Mood Calendar
- Support
- Mobile bottom navigation
- Responsive desktop layout
- Local-only privacy message

Detailed reflection forms and journal interactions are intentionally not
included yet.

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
