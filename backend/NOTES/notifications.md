Notifications go to admin chat on these triggers:
1. User submits a support request (bot_2025-11-29.R:1182) — user with reg_stat == 7 sends message ≥10 chars
2. User finishes processing a publication (fau_2025-10-04.R:1228) — via web app, includes comment
3. User has 1 publication left (fau_2025-10-04.R:1292) — warning
4. User exhausts all publications (fau_2025-10-04.R:1312) — critical alert
