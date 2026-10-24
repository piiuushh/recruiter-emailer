# Example output

What the script actually produces, using the sample config and the sample recruiter list.

## Input: the sheet before sending

| Company | Name | Email | Status | Sent At | Follow Up At | Replied At | Notes |
|---|---|---|---|---|---|---|---|
| Acme Corp | Riya Sharma | riya.sharma@example.com | | | | | |
| Globex Analytics | Daniel Okonkwo | d.okonkwo@example.com | | | | | |
| Initech Data | Mei Tanaka | mei.tanaka@example.com | | | | | |
| Umbrella Insurance | Arjun Verma | arjun.verma@example.com | | | | | |

Three columns filled in by hand. Everything else blank.

## Output 1: the first email

Sent to Riya at Acme Corp. Daniel, Mei and Arjun each get the same email with their own name and company merged in.

> **From:** Your Name &lt;you@gmail.com&gt;
> **To:** riya.sharma@example.com
> **Subject:** Data analyst | Python, SQL & reporting - Riya, quick intro from Your Name
> **Attachment:** Your_Name_Resume.pdf
>
> ---
>
> Hi Riya,
>
> I am **Your Name**, a data analyst who turns messy operational data into decisions teams actually use. I am reaching out because Acme Corp stood out to me, and I would love to be considered for roles that fit my profile.
>
> **What I bring**
>
> - **Current role:** data analyst at Example Corp, supporting a sales desk of around 15 people.
> - **Built, not just reported:** designed an internal analytics tool and a target vs. actual revenue dashboard used daily.
> - **Technical base:** Python and SQL, spreadsheet automation, reporting and data pipelines.
> - **Education:** B.Tech in mathematics and computing, Example University.
>
> My resume is attached. If you have an opening, or know a team that is hiring, I would be grateful for a short conversation, even 10 minutes.
>
> Thank you for your time,
> **Your Name**
> +00-0000000000
> [LinkedIn](https://www.linkedin.com/in/your-handle)
>
> <sub>If this is not relevant to you, just reply "no thanks" and I will not write again.</sub>

## Output 2: the follow-up, seven days later

Only goes to people who have not replied. It lands inside the original thread, so the recruiter sees it nested under the first email rather than as a new conversation.

> **Subject:** Re: Data analyst | Python, SQL & reporting - Daniel, quick intro from Your Name
> **Attachment:** Your_Name_Resume.pdf
>
> ---
>
> Hi Daniel,
>
> Just floating this back to the top of your inbox in case it got buried last week.
>
> Short version: data analyst at Example Corp, analytics for a desk of around 15 people, builds my own tools in Python and SQL. Resume attached again for convenience.
>
> If there is nothing open at Globex Analytics right now, I completely understand. A one-line reply either way would be a real help, and I will stop following up.
>
> Thank you for your time,
> **Your Name**
> +00-0000000000
> [LinkedIn](https://www.linkedin.com/in/your-handle)

## Output 3: the sheet two weeks in

| Company | Name | Status | Sent At | Follow Up At | Replied At | Row colour |
|---|---|---|---|---|---|---|
| Acme Corp | Riya Sharma | `Replied` | 10 Oct 10:04 | | 11 Oct 09:00 | green |
| Globex Analytics | Daniel Okonkwo | `Followed up` | 10 Oct 10:04 | 17 Oct 09:00 | | amber |
| Initech Data | Mei Tanaka | `No reply` | 10 Oct 10:05 | 17 Oct 09:00 | | grey |
| Umbrella Insurance | Arjun Verma | `Invalid email` | | | | red |

Reading it:

- **Riya** replied the next day, so her row went green and she got no follow-up.
- **Daniel** was silent for a week and got chased on the 17th. Still within his second week, so his row is amber and live.
- **Mei** was silent after her follow-up too, so a week later she was closed out as grey. No further emails.
- **Arjun's** address failed validation, so nothing was ever sent. The reason sits in his Notes column.

## What the toast messages look like

After each run, a notification appears at the bottom right of the sheet.

```
First emails sent: 4 | invalid: 1 | failed: 0 | quota left today: 95
Reply check done. New replies: 1
Follow-ups sent: 2 | closed as no reply: 1
```

## The diagnose dialog

From **Recruiter Emailer → Why was nothing sent? (diagnose)**.

```
Row counts by status:
  Sent: 12
  Replied: 3
  Followed up: 4
  (not sent yet): 31

Follow-ups due right now: 0
Next becomes due in about 2.4 days.

Gmail sends left today: 81
Gmail advanced service: enabled
Wait set in CONFIG: 7 days.
```

This is the answer to "why did nothing send". Here, nothing is due for another two and a half days, which is the script working correctly rather than failing.
