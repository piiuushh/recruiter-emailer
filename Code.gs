/**
 * Recruiter Emailer - a Google Apps Script job-outreach sequencer.
 *
 * Sends a personalised intro email with your resume attached to every
 * recruiter in a Google Sheet, then follows up once a week later if
 * they have not replied, and stops the moment they do.
 *
 * Docs: see README.md and docs/SETUP.md
 * Licence: MIT
 */

// ============================================================
//  CONFIG - everything you need to edit lives in this block
// ============================================================
const CONFIG = {
  SHEET_NAME: 'Recruiters',

  // Google Drive file ID of your resume PDF.
  // From the share link: .../file/d/THIS_PART_HERE/view
  RESUME_FILE_ID: 'PASTE_YOUR_DRIVE_FILE_ID_HERE',

  SENDER: {
    NAME: 'Your Name',
    PHONE: '+00-0000000000',
    LINKEDIN: 'https://www.linkedin.com/in/your-handle'
  },

  // {{first}} is replaced with the recruiter's first name.
  SUBJECT: 'Data analyst | Python, SQL & reporting - {{first}}, quick intro from Your Name',

  // One-sentence positioning line. Keep it concrete.
  OPENER: 'a data analyst who turns messy operational data into decisions teams actually use',

  // Your selling points. Label is bolded, text follows. 3-6 works best.
  PITCH: [
    { label: 'Current role', text: 'data analyst at Example Corp, supporting a sales desk of around 15 people.' },
    { label: 'Built, not just reported', text: 'designed an internal analytics tool and a target vs. actual revenue dashboard used daily.' },
    { label: 'Technical base', text: 'Python and SQL, spreadsheet automation, reporting and data pipelines.' },
    { label: 'Education', text: 'B.Tech in mathematics and computing, Example University.' }
  ],

  // Condensed version used in the follow-up. One sentence.
  SHORT_PITCH: 'data analyst at Example Corp, analytics for a desk of around 15 people, builds my own tools in Python and SQL',

  FOLLOWUP_AFTER_DAYS: 7,   // wait before the single follow-up
  CLOSE_AFTER_DAYS: 7,      // wait after follow-up before marking "No reply"
  DAILY_LIMIT: 60,          // max emails per run; consumer Gmail allows ~100/day
  PAUSE_MS: 4000,           // gap between sends
  CHECK_HOUR: 9             // hour the daily reply-check + follow-up runs
};
// ============================================================

const HEADERS = ['Company', 'Name', 'Email', 'Status', 'Sent At', 'Follow Up At', 'Replied At', 'Thread ID', 'Notes'];
const COLORS = { replied: '#d9ead3', followed: '#fff2cc', dead: '#efefef', bad: '#f4cccc' };

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Recruiter Emailer')
    .addItem('Set up sheet', 'setupSheet')
    .addItem('Send test email to myself', 'sendTestEmail')
    .addSeparator()
    .addItem('Send first emails now', 'sendFirstEmails')
    .addItem('Check replies now', 'checkReplies')
    .addItem('Send due follow-ups now', 'sendFollowUps')
    .addItem('Force follow-up for SELECTED rows', 'forceFollowUpSelected')
    .addItem('Why was nothing sent? (diagnose)', 'diagnose')
    .addSeparator()
    .addItem('Turn ON daily reply-check + follow-up', 'enableDaily')
    .addItem('Turn OFF daily reply-check + follow-up', 'disableDaily')
    .addToUi();
}

/* ====================== SETUP ====================== */

function setupSheet() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.insertSheet(CONFIG.SHEET_NAME);
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, HEADERS.length).setBackground('#f1efe8');
  sh.setColumnWidth(1, 160); sh.setColumnWidth(2, 150); sh.setColumnWidth(3, 230);
  sh.setColumnWidth(4, 110); sh.setColumnWidth(8, 150);
  sh.hideColumns(8);
  toast_('Sheet ready. Paste Company, Name and Email into columns A-C.');
}

/* ====================== EMAIL CONTENT ====================== */

function firstEmailHtml_(name, company) {
  let bullets = '';
  CONFIG.PITCH.forEach(p => {
    bullets += '<li><b>' + esc_(p.label) + ':</b> ' + esc_(p.text) + '</li>';
  });
  return '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1f2933;max-width:620px;">' +
    '<p>Hi ' + esc_(firstName_(name)) + ',</p>' +
    '<p>I am <b>' + esc_(CONFIG.SENDER.NAME) + '</b>, ' + esc_(CONFIG.OPENER) + '. I am reaching out because ' +
    esc_(company) + ' stood out to me, and I would love to be considered for roles that fit my profile.</p>' +
    '<p style="margin-bottom:6px;"><b>What I bring</b></p>' +
    '<ul style="margin-top:0;padding-left:18px;">' + bullets + '</ul>' +
    '<p>My resume is attached. If you have an opening, or know a team that is hiring, I would be grateful ' +
    'for a short conversation, even 10 minutes.</p>' + sigHtml_() +
    '<p style="font-size:11px;color:#7b8794;">If this is not relevant to you, just reply "no thanks" and I will not write again.</p>' +
    '</div>';
}

function firstEmailText_(name, company) {
  let bullets = '';
  CONFIG.PITCH.forEach(p => { bullets += '- ' + p.label + ': ' + p.text + '\n'; });
  return 'Hi ' + firstName_(name) + ',\n\n' +
    'I am ' + CONFIG.SENDER.NAME + ', ' + CONFIG.OPENER + '. I am reaching out because ' + company +
    ' stood out to me, and I would love to be considered for roles that fit my profile.\n\n' +
    'What I bring:\n' + bullets + '\n' +
    'My resume is attached. If you have an opening, or know a team that is hiring, I would be grateful for a short conversation, even 10 minutes.\n\n' +
    sigText_() + '\n\nIf this is not relevant to you, just reply "no thanks" and I will not write again.';
}

function followUpHtml_(name, company) {
  return '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1f2933;max-width:620px;">' +
    '<p>Hi ' + esc_(firstName_(name)) + ',</p>' +
    '<p>Just floating this back to the top of your inbox in case it got buried last week.</p>' +
    '<p>Short version: ' + esc_(CONFIG.SHORT_PITCH) + '. Resume attached again for convenience.</p>' +
    '<p>If there is nothing open at ' + esc_(company) + ' right now, I completely understand. A one-line reply ' +
    'either way would be a real help, and I will stop following up.</p>' + sigHtml_() + '</div>';
}

function followUpText_(name, company) {
  return 'Hi ' + firstName_(name) + ',\n\n' +
    'Just floating this back to the top of your inbox in case it got buried last week.\n\n' +
    'Short version: ' + CONFIG.SHORT_PITCH + '. Resume attached again for convenience.\n\n' +
    'If there is nothing open at ' + company + ' right now, I completely understand. A one-line reply either way would be a real help, and I will stop following up.\n\n' +
    sigText_();
}

function sigHtml_() {
  return '<p>Thank you for your time,<br><b>' + esc_(CONFIG.SENDER.NAME) + '</b><br>' +
    esc_(CONFIG.SENDER.PHONE) + '<br><a href="' + CONFIG.SENDER.LINKEDIN + '">LinkedIn</a></p>';
}

function sigText_() {
  return 'Thank you for your time,\n' + CONFIG.SENDER.NAME + '\n' + CONFIG.SENDER.PHONE + '\n' + CONFIG.SENDER.LINKEDIN;
}

/* ====================== STEP 1: FIRST SEND (manual) ====================== */

function sendFirstEmails() {
  const sh = getSheet_();
  const { rows, idx } = readRows_(sh);
  const resume = getResume_();
  let budget = Math.min(CONFIG.DAILY_LIMIT, MailApp.getRemainingDailyQuota());
  let sent = 0, bad = 0, failed = 0;

  for (let i = 0; i < rows.length && budget > 0; i++) {
    const r = rows[i], rowNum = i + 2;
    if (String(r[idx.Status] || '').trim()) continue;

    const email = String(r[idx.Email] || '').trim().toLowerCase();
    const name = String(r[idx.Name] || '').trim();
    const company = String(r[idx.Company] || '').trim() || 'your company';
    if (!email && !name && !company) continue;

    if (!isValidEmail_(email)) {
      sh.getRange(rowNum, idx.Status + 1).setValue('Invalid email');
      paintRow_(sh, rowNum, COLORS.bad);
      bad++; continue;
    }

    try {
      const draft = GmailApp.createDraft(email, CONFIG.SUBJECT.replace('{{first}}', firstName_(name)),
        firstEmailText_(name, company), {
          htmlBody: firstEmailHtml_(name, company),
          attachments: [resume],
          name: CONFIG.SENDER.NAME
        });
      const msg = draft.send();
      sh.getRange(rowNum, idx.Status + 1).setValue('Sent');
      sh.getRange(rowNum, idx['Sent At'] + 1).setValue(new Date());
      sh.getRange(rowNum, idx['Thread ID'] + 1).setValue(msg.getThread().getId());
      sent++; budget--;
    } catch (err) {
      sh.getRange(rowNum, idx.Status + 1).setValue('Failed');
      sh.getRange(rowNum, idx.Notes + 1).setValue(String(err).slice(0, 120));
      paintRow_(sh, rowNum, COLORS.bad);
      failed++;
    }
    SpreadsheetApp.flush();
    Utilities.sleep(CONFIG.PAUSE_MS);
  }
  toast_('First emails sent: ' + sent + ' | invalid: ' + bad + ' | failed: ' + failed +
    ' | quota left today: ' + MailApp.getRemainingDailyQuota());
}

/* ====================== STEP 2: REPLY CHECK ====================== */

function checkReplies() {
  const sh = getSheet_();
  const { rows, idx } = readRows_(sh);
  const me = myAddresses_();
  let found = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i], rowNum = i + 2;
    const status = String(r[idx.Status] || '').trim();
    if (status !== 'Sent' && status !== 'Followed up') continue;

    const threadId = String(r[idx['Thread ID']] || '').trim();
    if (!threadId) continue;

    let thread;
    try { thread = GmailApp.getThreadById(threadId); } catch (e) { continue; }
    if (!thread) continue;

    if (thread.getMessages().some(m => !isFromMe_(m.getFrom(), me))) {
      sh.getRange(rowNum, idx.Status + 1).setValue('Replied');
      sh.getRange(rowNum, idx['Replied At'] + 1).setValue(new Date());
      paintRow_(sh, rowNum, COLORS.replied);
      found++;
    }
  }
  toast_('Reply check done. New replies: ' + found);
  return found;
}

/* ====================== STEP 3: FOLLOW-UPS ====================== */

function sendFollowUps() {
  const sh = getSheet_();
  const { rows, idx } = readRows_(sh);
  const resume = getResume_();
  const now = new Date();
  let budget = Math.min(CONFIG.DAILY_LIMIT, MailApp.getRemainingDailyQuota());
  let sent = 0, closed = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i], rowNum = i + 2;
    const status = String(r[idx.Status] || '').trim();

    if (status === 'Sent' && budget > 0) {
      const sentAt = r[idx['Sent At']];
      if (!(sentAt instanceof Date) || daysBetween_(sentAt, now) < CONFIG.FOLLOWUP_AFTER_DAYS) continue;
      try {
        sendFollowUpEmail_(String(r[idx['Thread ID']] || '').trim(),
          String(r[idx.Email] || '').trim().toLowerCase(),
          String(r[idx.Name] || '').trim(),
          String(r[idx.Company] || '').trim() || 'your company', resume);
        sh.getRange(rowNum, idx.Status + 1).setValue('Followed up');
        sh.getRange(rowNum, idx['Follow Up At'] + 1).setValue(new Date());
        paintRow_(sh, rowNum, COLORS.followed);
        sent++; budget--;
      } catch (err) {
        sh.getRange(rowNum, idx.Notes + 1).setValue('Follow-up failed: ' + String(err).slice(0, 100));
      }
      SpreadsheetApp.flush();
      Utilities.sleep(CONFIG.PAUSE_MS);

    } else if (status === 'Followed up') {
      const fu = r[idx['Follow Up At']];
      if (fu instanceof Date && daysBetween_(fu, now) >= CONFIG.CLOSE_AFTER_DAYS) {
        sh.getRange(rowNum, idx.Status + 1).setValue('No reply');
        paintRow_(sh, rowNum, COLORS.dead);
        closed++;
      }
    }
  }
  toast_('Follow-ups sent: ' + sent + ' | closed as no reply: ' + closed);
}

function forceFollowUpSelected() {
  const sh = getSheet_();
  const { rows, idx } = readRows_(sh);
  const sel = sh.getActiveRange();
  if (!sel) { toast_('Select the rows you want to chase, then run this.'); return; }

  const start = Math.max(sel.getRow(), 2);
  const end = sel.getRow() + sel.getNumRows() - 1;
  if (end < 2) { toast_('That is the header row. Select data rows instead.'); return; }

  const ui = SpreadsheetApp.getUi();
  if (ui.alert('Force follow-up',
      'Send a follow-up now to rows ' + start + '-' + end + ', ignoring the ' +
      CONFIG.FOLLOWUP_AFTER_DAYS + '-day wait?\n\nRows marked Replied are skipped.',
      ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  const resume = getResume_();
  let sent = 0, skipped = 0;

  for (let rowNum = start; rowNum <= end; rowNum++) {
    const r = rows[rowNum - 2];
    if (!r) continue;
    const status = String(r[idx.Status] || '').trim();
    const threadId = String(r[idx['Thread ID']] || '').trim();

    if (status !== 'Sent' && status !== 'Followed up') { skipped++; continue; }
    if (!threadId) {
      sh.getRange(rowNum, idx.Notes + 1).setValue('No thread ID - first email was not sent by this script');
      skipped++; continue;
    }

    try {
      sendFollowUpEmail_(threadId, String(r[idx.Email] || '').trim().toLowerCase(),
        String(r[idx.Name] || '').trim(),
        String(r[idx.Company] || '').trim() || 'your company', resume);
      sh.getRange(rowNum, idx.Status + 1).setValue('Followed up');
      sh.getRange(rowNum, idx['Follow Up At'] + 1).setValue(new Date());
      paintRow_(sh, rowNum, COLORS.followed);
      sent++;
    } catch (err) {
      sh.getRange(rowNum, idx.Notes + 1).setValue('Force follow-up failed: ' + String(err).slice(0, 100));
      skipped++;
    }
    SpreadsheetApp.flush();
    Utilities.sleep(CONFIG.PAUSE_MS);
  }
  toast_('Forced follow-ups sent: ' + sent + ' | skipped: ' + skipped);
}

/* ============ SEND A FOLLOW-UP TO THE RECRUITER, IN THREAD ============ */
/**
 * Never use GmailMessage.reply() here. When the recruiter has not answered,
 * the last message in the thread is your own, so reply() would send the
 * follow-up back to yourself. This builds a real message addressed to the
 * recruiter and uses In-Reply-To / References to keep it in the thread.
 *
 * Uses the Gmail advanced service when enabled; otherwise falls back to a
 * plain "Re:" email, which still reaches the recruiter.
 */
function sendFollowUpEmail_(threadId, toEmail, name, company, resume) {
  if (!isValidEmail_(toEmail)) throw new Error('No valid recruiter email on this row');

  const thread = GmailApp.getThreadById(threadId);
  if (!thread) throw new Error('Thread not found for ID ' + threadId);

  let subject = thread.getFirstMessageSubject() || CONFIG.SUBJECT.replace('{{first}}', firstName_(name));
  if (!/^re:/i.test(subject)) subject = 'Re: ' + subject;

  const text = followUpText_(name, company);
  const html = followUpHtml_(name, company);

  let messageId = '';
  try { messageId = thread.getMessages()[0].getHeader('Message-ID') || ''; } catch (e) {}

  if (typeof Gmail !== 'undefined' && Gmail.Users && Gmail.Users.Messages) {
    Gmail.Users.Messages.send({
      raw: buildRawEmail_({
        to: toEmail,
        from: CONFIG.SENDER.NAME + ' <' + Session.getActiveUser().getEmail() + '>',
        subject: subject, inReplyTo: messageId, text: text, html: html, blob: resume
      }),
      threadId: threadId
    }, 'me');
    return;
  }

  GmailApp.sendEmail(toEmail, subject, text,
    { htmlBody: html, attachments: [resume], name: CONFIG.SENDER.NAME });
}

function buildRawEmail_(o) {
  const outer = 'mix_' + Utilities.getUuid().replace(/-/g, '');
  const inner = 'alt_' + Utilities.getUuid().replace(/-/g, '');
  const nl = '\r\n';
  let m = '';
  m += 'To: ' + o.to + nl + 'From: ' + o.from + nl + 'Subject: ' + o.subject + nl;
  if (o.inReplyTo) m += 'In-Reply-To: ' + o.inReplyTo + nl + 'References: ' + o.inReplyTo + nl;
  m += 'MIME-Version: 1.0' + nl;
  m += 'Content-Type: multipart/mixed; boundary="' + outer + '"' + nl + nl;
  m += '--' + outer + nl + 'Content-Type: multipart/alternative; boundary="' + inner + '"' + nl + nl;
  m += '--' + inner + nl + 'Content-Type: text/plain; charset="UTF-8"' + nl +
       'Content-Transfer-Encoding: base64' + nl + nl +
       wrap76_(Utilities.base64Encode(o.text, Utilities.Charset.UTF_8)) + nl;
  m += '--' + inner + nl + 'Content-Type: text/html; charset="UTF-8"' + nl +
       'Content-Transfer-Encoding: base64' + nl + nl +
       wrap76_(Utilities.base64Encode(o.html, Utilities.Charset.UTF_8)) + nl;
  m += '--' + inner + '--' + nl + nl;
  if (o.blob) {
    const fname = o.blob.getName() || 'resume.pdf';
    m += '--' + outer + nl;
    m += 'Content-Type: ' + (o.blob.getContentType() || 'application/pdf') + '; name="' + fname + '"' + nl;
    m += 'Content-Disposition: attachment; filename="' + fname + '"' + nl;
    m += 'Content-Transfer-Encoding: base64' + nl + nl;
    m += wrap76_(Utilities.base64Encode(o.blob.getBytes())) + nl;
  }
  m += '--' + outer + '--';
  return Utilities.base64EncodeWebSafe(m);
}

function wrap76_(s) { return String(s).replace(/(.{76})/g, '$1\r\n'); }

/* ====================== DIAGNOSTICS ====================== */

function diagnose() {
  const sh = getSheet_();
  const { rows, idx } = readRows_(sh);
  const now = new Date();
  const tally = {};
  let dueNow = 0, soonest = null, noThread = 0;

  rows.forEach(r => {
    if (!String(r[idx.Email] || '').trim()) return;
    const status = String(r[idx.Status] || '').trim() || '(not sent yet)';
    tally[status] = (tally[status] || 0) + 1;
    if (status === 'Sent') {
      if (!String(r[idx['Thread ID']] || '').trim()) noThread++;
      const sentAt = r[idx['Sent At']];
      if (sentAt instanceof Date) {
        const waited = daysBetween_(sentAt, now);
        if (waited >= CONFIG.FOLLOWUP_AFTER_DAYS) dueNow++;
        else {
          const left = CONFIG.FOLLOWUP_AFTER_DAYS - waited;
          if (soonest === null || left < soonest) soonest = left;
        }
      }
    }
  });

  let msg = 'Row counts by status:\n';
  Object.keys(tally).forEach(k => { msg += '  ' + k + ': ' + tally[k] + '\n'; });
  msg += '\nFollow-ups due right now: ' + dueNow;
  if (dueNow === 0 && soonest !== null) msg += '\nNext becomes due in about ' + (Math.round(soonest * 10) / 10) + ' days.';
  if (noThread > 0) msg += '\n' + noThread + ' sent row(s) have no Thread ID and cannot be followed up.';
  msg += '\n\nGmail sends left today: ' + MailApp.getRemainingDailyQuota();
  msg += '\nGmail advanced service: ' + (typeof Gmail !== 'undefined' ? 'enabled' : 'NOT enabled (fallback in use)');
  msg += '\nWait set in CONFIG: ' + CONFIG.FOLLOWUP_AFTER_DAYS + ' days.';
  SpreadsheetApp.getUi().alert('Follow-up status', msg, SpreadsheetApp.getUi().ButtonSet.OK);
}

/* ====================== DAILY AUTOMATION ====================== */

function dailyRun() {
  checkReplies();   // replies first, so nobody who answered gets chased
  sendFollowUps();
}

function enableDaily() {
  disableDaily();
  ScriptApp.newTrigger('dailyRun').timeBased().everyDays(1).atHour(CONFIG.CHECK_HOUR).create();
  toast_('Daily reply-check and follow-up is ON (around ' + CONFIG.CHECK_HOUR + ':00). First emails still need your click.');
}

function disableDaily() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'dailyRun')
    .forEach(t => ScriptApp.deleteTrigger(t));
}

/* ====================== TEST ====================== */

function sendTestEmail() {
  const me = Session.getActiveUser().getEmail();
  const resume = getResume_();
  GmailApp.sendEmail(me, '[TEST 1/2 first email] ' + CONFIG.SUBJECT.replace('{{first}}', 'Riya'),
    firstEmailText_('Riya Sharma', 'Acme Corp'),
    { htmlBody: firstEmailHtml_('Riya Sharma', 'Acme Corp'), attachments: [resume], name: CONFIG.SENDER.NAME });
  GmailApp.sendEmail(me, '[TEST 2/2 follow-up] ' + CONFIG.SUBJECT.replace('{{first}}', 'Riya'),
    followUpText_('Riya Sharma', 'Acme Corp'),
    { htmlBody: followUpHtml_('Riya Sharma', 'Acme Corp'), attachments: [resume], name: CONFIG.SENDER.NAME });
  toast_('Two test emails sent to ' + me);
}

/* ====================== HELPERS ====================== */

function getSheet_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(CONFIG.SHEET_NAME);
  if (!sh) throw new Error('No tab named "' + CONFIG.SHEET_NAME + '". Run menu > Set up sheet.');
  return sh;
}

function readRows_(sh) {
  const values = sh.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim().toLowerCase());
  const idx = {};
  HEADERS.forEach(h => {
    const i = headers.indexOf(h.toLowerCase());
    if (i === -1) throw new Error('Missing column: ' + h + '. Run menu > Set up sheet.');
    idx[h] = i;
  });
  return { rows: values.slice(1), idx: idx };
}

function getResume_() {
  if (!CONFIG.RESUME_FILE_ID || CONFIG.RESUME_FILE_ID.indexOf('PASTE') === 0) {
    throw new Error('Set RESUME_FILE_ID in CONFIG first.');
  }
  try { return DriveApp.getFileById(CONFIG.RESUME_FILE_ID).getBlob(); }
  catch (e) { throw new Error('Cannot open the resume file. Check RESUME_FILE_ID. ' + e); }
}

function myAddresses_() {
  const list = [String(Session.getActiveUser().getEmail()).toLowerCase()];
  try { GmailApp.getAliases().forEach(a => list.push(String(a).toLowerCase())); } catch (e) {}
  return list;
}

function isFromMe_(from, me) {
  const f = String(from).toLowerCase();
  return me.some(a => a && f.indexOf(a) > -1);
}

function paintRow_(sh, rowNum, color) {
  sh.getRange(rowNum, 1, 1, HEADERS.length).setBackground(color);
}

function daysBetween_(a, b) { return (b.getTime() - a.getTime()) / 86400000; }

function firstName_(name) {
  const f = String(name || '').trim().split(/\s+/)[0];
  return f ? f.charAt(0).toUpperCase() + f.slice(1) : 'there';
}

function isValidEmail_(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e); }

function esc_(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function toast_(msg) {
  Logger.log(msg);
  try { SpreadsheetApp.getActive().toast(msg, 'Recruiter Emailer', 8); } catch (e) {}
}
