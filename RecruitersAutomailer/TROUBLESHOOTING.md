# Troubleshooting

Start with **Recruiter Emailer → Why was nothing sent? (diagnose)**. It answers most of these questions directly.

## The menu does not appear

Refresh the spreadsheet page. The menu is built by `onOpen`, which only runs on load. If it still does not show, open the script editor, select `onOpen` from the function dropdown and click Run once, then refresh the sheet.

## "Send due follow-ups now" sends nothing

Almost always correct behaviour. Follow-ups only fire for rows where the status is `Sent` **and** `FOLLOWUP_AFTER_DAYS` have passed since the Sent At timestamp. If you sent today, nothing is due.

Other reasons a row is skipped:

- Status is blank, so the first email never went out
- Status is `Replied`, `No reply`, `Failed` or `Invalid email`, all finished states
- Thread ID is empty, which happens for rows sent by a different tool

To chase someone immediately, select their rows and use **Force follow-up for SELECTED rows**.

## The follow-up arrives in my own inbox

This was a bug in early versions that used `GmailMessage.reply()`. When the recruiter has not answered, the last message in the thread is your own, so "reply" meant replying to yourself.

Current versions build a message addressed to the recruiter and use `In-Reply-To` headers for threading. If you are seeing this, you are running old code. Replace `Code.gs` with the current version.

Two cases where mail correctly arrives at your own address:

- **Send test email to myself** does this on purpose
- You put your own address in as a recruiter row

## A row never turns green even though they replied

- **You tested with your own address.** Reply detection looks for a message that did not come from you or your aliases. Your own reply does not count. Use a second address.
- **The reply started a new thread.** If the recruiter composed a fresh email instead of replying, it is not in the tracked thread. Mark the row manually.
- **The daily job has not run yet.** Run **Check replies now** by hand.

## A row turned green but nobody really replied

An out-of-office auto-reply counts. Clear the Status cell to put them back in the queue.

## Every row says "Invalid email"

Check column C actually holds addresses and the headers were not shifted. Re-run **Set up sheet** if the columns look wrong.

## "Cannot open the resume file"

- `RESUME_FILE_ID` still has the placeholder text
- You pasted the whole share URL instead of just the ID between `/d/` and `/view`
- The file was deleted or is in a Drive you do not own

## "Missing column: X"

The headers were renamed or reordered. Run **Set up sheet**, which rewrites row 1. Your data is untouched.

## The "Add a service" dialog will not open

Usually an ad blocker, a strict privacy extension, or being signed into several Google accounts at once.

- Try an incognito window with extensions disabled
- Use a window where only the sheet's owning account is signed in
- Hard refresh with Ctrl+Shift+R
- Use Chrome rather than Brave or Safari

If none of that works, declare the service in `appsscript.json` instead. See step 4 of [SETUP.md](SETUP.md).

The script works without it either way, with the follow-up going out as a plain `Re:` email.

## Emails are landing in spam

- Start at 20 to 30 a day for the first week, then build up
- Clean the list, since bounces damage your sender reputation badly
- Keep `PAUSE_MS` at 4000 or higher
- Avoid links beyond your LinkedIn, and avoid images entirely
- Never send the same text to hundreds of people. The merge fields are the point.

## "Service invoked too many times" or quota errors

Consumer Gmail allows roughly 100 sends a day from Apps Script, Workspace about 1,500. The counter resets on a rolling 24-hour basis. Wait and run again. Rows already marked `Sent` are skipped, so re-running is safe.

## The script times out on a large batch

Apps Script caps a single run at six minutes. With `PAUSE_MS: 4000`, that is roughly 80 emails. Lower `DAILY_LIMIT`, or split the batch across two runs. Nothing is lost on a timeout, because each row's status is written as it goes.

## I want to start over

Clear the Status, Sent At, Follow Up At, Replied At, Thread ID and Notes columns, then select the rows and set the fill colour back to none. Every cleared row re-enters the queue.

Be careful: this means people already contacted will be contacted again from scratch.
