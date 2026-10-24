# Setup guide

Takes about ten minutes end to end. No coding needed beyond pasting text into a config block.

## 1. Put your resume in Google Drive

Upload your resume PDF. Name it something a recruiter would want to see in an inbox, like `Firstname_Lastname_Data_Analyst.pdf`, because that filename becomes the attachment name.

Open it, click **Share**, copy the link. It looks like this:

```
https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/view?usp=sharing
                               ^------------------------^
                               this is your file ID
```

You do not need to make it public. The script runs as you and reads your own Drive.

## 2. Create the sheet and open the editor

New Google Sheet → **Extensions** → **Apps Script**.

A code editor opens in a new tab at `script.google.com`. Delete the placeholder `function myFunction() {}` and paste in the whole of `Code.gs`.

## 3. Fill in CONFIG

At the top of the file. Only this block needs editing.

```javascript
RESUME_FILE_ID: '1AbCdEfGhIjKlMnOpQrStUvWxYz',

SENDER: {
  NAME: 'Riya Sharma',
  PHONE: '+91-9876543210',
  LINKEDIN: 'https://www.linkedin.com/in/riyasharma'
},

SUBJECT: 'Data analyst | Python, SQL & reporting - {{first}}, quick intro from Riya Sharma',

OPENER: 'a data analyst who turns messy operational data into decisions teams actually use',

PITCH: [
  { label: 'Current role',  text: 'data analyst at Example Corp, supporting a sales desk of around 15 people.' },
  { label: 'Built, not just reported', text: 'designed an internal analytics tool used daily by the team.' },
  { label: 'Technical base', text: 'Python and SQL, spreadsheet automation, reporting and data pipelines.' },
  { label: 'Education',     text: 'B.Tech in mathematics and computing, Example University.' }
],

SHORT_PITCH: 'data analyst at Example Corp, builds my own tools in Python and SQL',
```

Advice on writing these:

- **OPENER** should say what you do for an employer, not what you want. "turns messy operational data into decisions" beats "seeking opportunities to grow".
- **PITCH** items should be specific. A number beats an adjective every time. "cut a weekly report from 4 hours to 10 minutes" is worth more than "highly efficient".
- Three to five pitch items. More than that and nobody reads any of them.
- **SUBJECT** should name the role and your two strongest skills, because many recruiters decide from the subject line alone.

Save with Ctrl+S.

## 4. Enable the Gmail advanced service

Optional, but it makes the follow-up appear inside the original conversation.

In the editor's left sidebar, find **Services** and click the **+** beside it. Pick **Gmail API** from the list, leave the identifier as `Gmail`, click **Add**.

**If that dialog will not open**, use the manifest instead:

1. Gear icon → **Project Settings**
2. Tick **Show "appsscript.json" manifest file in editor**
3. Back to **Editor**, open `appsscript.json`
4. Paste in the contents of this repo's `appsscript.json`
5. Save

Either route gets you the same result. Set `timeZone` to your own if you are not in India.

## 5. Build the sheet

Go back to the spreadsheet tab and refresh the page. A **Recruiter Emailer** menu appears next to Help. If it does not, wait a few seconds and refresh again.

**Recruiter Emailer → Set up sheet**

This creates the tab with all nine columns, freezes the header, and hides the Thread ID column.

## 6. Authorise

The first time you run anything, Google asks for permission.

You will see a warning that the app is not verified. This is normal for any personal Apps Script. Click **Advanced**, then **Go to (project name) (unsafe)**, then **Allow**.

The script is asking to send mail as you, read your Drive and edit the sheet, which is exactly what it needs to do the job. The code is in front of you and sends nothing anywhere except the addresses in your sheet.

## 7. Test before you send to anyone real

**Recruiter Emailer → Send test email to myself**

Two emails arrive, the first contact and the follow-up. Check:

- The attachment opens and is the right version of your resume
- The signature has your real phone and a working LinkedIn link
- It reads well on a phone, since that is where most recruiters will see it
- No placeholder text survived, so search for "Example" and "Your Name"

To test the full cycle without waiting a week, set `FOLLOWUP_AFTER_DAYS: 0` and `CLOSE_AFTER_DAYS: 0`, use a second email address of yours as a test row, and run through the menu items in order. Reply from that second account and run **Check replies now** to watch the row turn green.

**Use a different address, not your own.** Reply detection looks for a message that did not come from you, so a reply you send from your own account will never register.

Reset both values to 7 before you go live.

## 8. Add recruiters and send

Paste Company, Name and Email into columns A, B and C. Leave the rest blank.

**Recruiter Emailer → Send first emails now**

A toast at the bottom reports how many went out. At four seconds apart, fifty emails take about three and a half minutes. Leave the tab open.

## 9. Turn on the automation

**Recruiter Emailer → Turn ON daily reply-check + follow-up**

Once. From then on, every morning the script checks for replies and sends any follow-ups that have come due. First emails always stay manual.

## Daily routine from here

1. Open the sheet, scan for green rows, reply to those people yourself.
2. Add new recruiters to the bottom.
3. Click **Send first emails now** for the new ones.

That is all. Everything else runs itself.
