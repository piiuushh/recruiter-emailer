# Recruiter Emailer

A Google Apps Script that runs a job-outreach sequence out of a Google Sheet.

You paste recruiters into a sheet and click send once. Each person gets a personalised intro email with your resume attached. A week later, anyone who has not replied gets a single follow-up inside the same email thread. The moment someone replies, their row turns green and they are never emailed again.

No server, no paid tool, no Gmail app password. It runs inside your own Google account.

```
paste 50 recruiters  ->  click "Send first emails now"
                              |
                         [ Sent ]  white
                              |
         +--------------------+--------------------+
         |                                         |
   they reply                              7 days, silence
         |                                         |
   [ Replied ]  green                     [ Followed up ]  amber
   sequence stops                                  |
                                    +--------------+--------------+
                                    |                             |
                              they reply                  7 more days
                                    |                             |
                             [ Replied ]  green          [ No reply ]  grey
```

## Features

- **Personalised merge** of first name and company into every email
- **Resume attached automatically** from your Google Drive
- **Plain-text and HTML parts** in each message, which helps with spam filters
- **Reply detection** by reading the Gmail thread, not by guessing
- **One follow-up only**, sent in-thread so it nests under the original email
- **Colour-coded sheet** so you can see your whole pipeline at a glance
- **Rate limiting** with a per-run cap and a pause between sends
- **Diagnose command** that explains exactly why a run sent nothing
- **Manual first send.** Nothing goes out without you clicking. Only the follow-up is automatic.

## Quick start

1. Create a Google Sheet.
2. **Extensions → Apps Script**, delete the placeholder code, paste in `Code.gs`, save.
3. Edit the `CONFIG` block at the top with your name, phone, LinkedIn, pitch and resume file ID.
4. Back in the sheet, refresh the page. A **Recruiter Emailer** menu appears.
5. **Recruiter Emailer → Set up sheet** to build the columns.
6. Paste Company, Name and Email into columns A, B and C.
7. **Send test email to myself**, check how it looks.
8. **Send first emails now**.
9. **Turn ON daily reply-check + follow-up**, once, and leave it.

Full walkthrough with screenshots of each step: [docs/SETUP.md](docs/SETUP.md)

## Sheet layout

Built for you by **Set up sheet**. Column H is hidden by default.

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| Company | Name | Email | Status | Sent At | Follow Up At | Replied At | Thread ID | Notes |

You fill in A, B and C. The script owns everything from D onward.

A starter file is in [examples/recruiters-sample.csv](examples/recruiters-sample.csv).

## Status values

| Status | Row colour | Meaning |
|---|---|---|
| *(blank)* | white | Queued. Goes out on your next send. |
| `Sent` | white | First email delivered. Waiting for a reply. |
| `Replied` | green | They answered. Sequence stopped permanently. |
| `Followed up` | amber | No reply after the wait. One follow-up sent. |
| `No reply` | grey | Silent after the follow-up. Closed out. |
| `Invalid email` | red | Address failed validation. Nothing sent. |
| `Failed` | red | Send error. Reason written to the Notes column. |

To re-queue anyone, clear their Status cell.

## What the output looks like

See [examples/sample-output.md](examples/sample-output.md) for the full rendered first email, the follow-up and the sheet as it looks mid-campaign.

## Configuration

Everything lives in the `CONFIG` object at the top of `Code.gs`.

| Key | Default | What it does |
|---|---|---|
| `SHEET_NAME` | `Recruiters` | Tab holding the data |
| `RESUME_FILE_ID` | — | Drive file ID of your resume PDF |
| `SENDER.NAME` / `.PHONE` / `.LINKEDIN` | — | Signature block |
| `SUBJECT` | — | Subject line. `{{first}}` becomes the recruiter's first name |
| `OPENER` | — | Your one-sentence positioning line |
| `PITCH` | 4 items | Bullet list of selling points |
| `SHORT_PITCH` | — | Condensed version used in the follow-up |
| `FOLLOWUP_AFTER_DAYS` | `7` | Wait before the follow-up |
| `CLOSE_AFTER_DAYS` | `7` | Wait after the follow-up before marking `No reply` |
| `DAILY_LIMIT` | `60` | Max emails per run |
| `PAUSE_MS` | `4000` | Gap between sends |
| `CHECK_HOUR` | `9` | Hour the daily job runs |

Getting your resume file ID: open the resume in Drive, click Share, copy the link. The ID is the long string between `/d/` and `/view`.

## Gmail advanced service

Optional but recommended. It lets the follow-up attach to the original conversation rather than starting a new one.

In the Apps Script editor, click the **+** next to **Services** in the left sidebar, choose **Gmail API**, keep the identifier as `Gmail`, and click Add. If the dialog will not open, commit the included `appsscript.json` instead, which declares the same thing.

Without it the script still works. The follow-up goes out as a plain `Re:` email that reaches the recruiter but may sit in its own thread.

## Limits

- Consumer Gmail allows roughly 100 emails per day from Apps Script. Google Workspace allows about 1,500.
- `DAILY_LIMIT` caps each run at 60 by default. Raise it if you are on Workspace.
- An out-of-office auto-reply counts as a reply and will turn a row green. Clear the Status cell to re-queue that person.
- Only one follow-up is sent per recruiter, by design.

## Troubleshooting

Common problems and fixes: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

Fastest first move is **Recruiter Emailer → Why was nothing sent? (diagnose)**, which reports row counts by status, how many follow-ups are due, how many days until the next one, your remaining Gmail quota, and whether the Gmail advanced service is active.

## A note on using this responsibly

This is a tool for sending a small number of genuinely relevant, personal emails to people who might want to hear from you. It is not a bulk mailer and should not be used as one. Every message carries a one-line opt-out, and anyone who asks you to stop should be removed from the sheet.

## Licence

MIT. See [LICENSE](LICENSE).
