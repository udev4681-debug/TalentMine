# TalentHunt

Candidate Intelligence & Data Mining Platform.

## Overview
TalentHunt (powered by TalentMine architecture) mines publicly available candidate data, validates it automatically (link reachability, email syntax, and duplicate checks), and reveals talent patterns for recruiter and sourcing teams.

## Tech Stack
- **Frontend**: HTML5, Modular CSS, JavaScript (Vanilla ES6), Firebase Auth (Google Sign-In)
- **Backend**: PHP 8.x (REST API endpoints for candidate search, stats, CSV/JSON export)
- **Deployment**: Vercel & GitHub ready

## Getting Started

### Local Development
To run locally with PHP:
```bash
php -S 127.0.0.1:8000
```
Open `http://127.0.0.1:8000` in your web browser.

### Static Deployment
If running statically (e.g. on Vercel), open `frontend/index.html` or root `index.html`. The app includes a built-in client data adapter fallback.
