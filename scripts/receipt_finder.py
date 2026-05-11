"""
Scans Apple Photos library for 2026 photos, identifies receipts using Claude vision,
and emails them to a Mynt expense intake address via Gmail SMTP.
"""

import base64
import json
import pathlib
import smtplib
import sys
import tempfile
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import anthropic
import osxphotos
from dotenv import load_dotenv
import os

load_dotenv(pathlib.Path(__file__).parent / ".env")

ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]
GMAIL_USER = os.environ["GMAIL_USER"]
GMAIL_APP_PASSWORD = os.environ["GMAIL_APP_PASSWORD"]
MYNT_EMAIL = os.environ["MYNT_EMAIL"]

SENT_FILE = pathlib.Path(__file__).parent / "sent_receipts.json"
MODEL = "claude-sonnet-4-6"


def load_sent_uuids() -> set[str]:
    if SENT_FILE.exists():
        return set(json.loads(SENT_FILE.read_text()))
    return set()


def save_sent_uuids(uuids: set[str]) -> None:
    SENT_FILE.write_text(json.dumps(sorted(uuids), indent=2))


def is_receipt(image_path: str, client: anthropic.Anthropic) -> bool:
    with open(image_path, "rb") as f:
        image_data = base64.standard_b64encode(f.read()).decode("utf-8")

    # Detect media type from extension
    ext = pathlib.Path(image_path).suffix.lower()
    media_type_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".heic": "image/jpeg",  # osxphotos exports HEIC as JPEG
    }
    media_type = media_type_map.get(ext, "image/jpeg")

    response = client.messages.create(
        model=MODEL,
        max_tokens=5,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_data,
                        },
                    },
                    {
                        "type": "text",
                        "text": "Does this image show a receipt or invoice? Answer YES or NO only.",
                    },
                ],
            }
        ],
    )
    return response.content[0].text.strip().upper().startswith("YES")


def send_email(image_path: str, photo: osxphotos.PhotoInfo) -> None:
    date_str = photo.date.strftime("%Y-%m-%d") if photo.date else "unknown-date"
    filename = photo.original_filename or pathlib.Path(image_path).name

    msg = MIMEMultipart()
    msg["From"] = GMAIL_USER
    msg["To"] = MYNT_EMAIL
    msg["Subject"] = f"Receipt — {date_str}"
    msg.attach(MIMEText("Receipt attached.", "plain"))

    with open(image_path, "rb") as f:
        part = MIMEBase("application", "octet-stream")
        part.set_payload(f.read())
    encoders.encode_base64(part)
    part.add_header("Content-Disposition", f'attachment; filename="{filename}"')
    msg.attach(part)

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        server.send_message(msg)


def main() -> None:
    print("Loading Photos library...")
    photosdb = osxphotos.PhotosDB()
    all_photos = photosdb.photos()

    photos_2026 = [p for p in all_photos if p.date and p.date.year == 2026]
    print(f"Found {len(photos_2026)} photos from 2026")

    sent_uuids = load_sent_uuids()
    unseen = [p for p in photos_2026 if p.uuid not in sent_uuids]
    already_sent_count = len(photos_2026) - len(unseen)

    print(f"Skipping {already_sent_count} already sent")
    print(f"Checking {len(unseen)} photos with Claude...")

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    receipts_sent = 0
    errors = 0

    with tempfile.TemporaryDirectory() as tmp_dir:
        for i, photo in enumerate(unseen, 1):
            try:
                exported = photo.export(tmp_dir, use_photos_export=False)
                if not exported:
                    continue

                image_path = exported[0]
                print(f"  [{i}/{len(unseen)}] Checking {photo.original_filename}...", end=" ", flush=True)

                if is_receipt(image_path, client):
                    print("RECEIPT — sending...", end=" ", flush=True)
                    send_email(image_path, photo)
                    sent_uuids.add(photo.uuid)
                    save_sent_uuids(sent_uuids)
                    receipts_sent += 1
                    print("sent.")
                else:
                    print("not a receipt.")
                    sent_uuids.add(photo.uuid)
                    save_sent_uuids(sent_uuids)

            except Exception as e:
                print(f"ERROR: {e}")
                errors += 1

    print()
    print(f"Done.")
    print(f"  Scanned:      {len(photos_2026)} photos from 2026")
    print(f"  Skipped:      {already_sent_count} already processed")
    print(f"  Checked:      {len(unseen)} with Claude")
    print(f"  Sent to Mynt: {receipts_sent} receipts")
    if errors:
        print(f"  Errors:       {errors}")


if __name__ == "__main__":
    main()
