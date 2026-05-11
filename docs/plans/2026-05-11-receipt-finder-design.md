# Receipt Finder — Design

**Date:** 2026-05-11

## Problem

Manually forwarding receipt photos from Apple Photos to Mynt's expense intake is tedious. Need an automated way to scan photos, identify receipts, and email them.

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| Photo source | Apple Photos library | Where all receipts land after iPhone photos |
| Year filter | 2026 only | Avoid reprocessing old photos |
| Receipt detection | Claude Sonnet vision API | Best accuracy, simple YES/NO classification |
| Email destination | `kvitto+...@mynt.se` | Mynt's receipt intake address |
| Email sender | Gmail SMTP + App Password | Reliable, no extra service needed |
| Trigger | Manual CLI | User controls when to run |
| Deduplication | `sent_receipts.json` | Simple, no database needed |

## Architecture

```
Apple Photos (2026 only)
        ↓  osxphotos
  [photo list + UUIDs]
        ↓  filter: not in sent_receipts.json
  [unseen photos]
        ↓  Claude vision (claude-sonnet-4-6)
  [receipts]
        ↓  Gmail SMTP
  kvitto+...@mynt.se
        ↓
  update sent_receipts.json
```

## Files

- `scripts/receipt_finder.py` — main script
- `scripts/requirements.txt` — `osxphotos`, `anthropic`, `python-dotenv`
- `scripts/.env` — credentials (git-ignored)
- `scripts/.env.example` — template
- `scripts/sent_receipts.json` — deduplication log (git-ignored, auto-created)

## Usage

```bash
cd scripts
pip install -r requirements.txt
cp .env.example .env
# Fill in .env with credentials
python receipt_finder.py
```

## Gmail Setup

1. Enable 2-step verification on the Gmail account
2. Generate an App Password at myaccount.google.com/apppasswords
3. Set `GMAIL_APP_PASSWORD` in `.env` (not the regular Gmail password)
