import nodemailer from 'nodemailer';

/**
 * Notification emails for new submissions.
 *
 * SMTP credentials come from the environment. With none set, the submission is
 * logged instead of emailed — so a misconfigured mailer never costs a lead,
 * and local development does not send real mail.
 */

let transport = null;

function getTransport() {
  if (transport) return transport;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    // Port 465 is implicit TLS; 587 upgrades via STARTTLS.
    secure: Number(SMTP_PORT ?? 587) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transport;
}

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]
  );

export async function sendNotification(submission, file) {
  const to = process.env.NOTIFY_EMAIL ?? 'info@levels.ge';
  const mailer = getTransport();

  if (!mailer) {
    console.log('[mailer] SMTP not configured; submission stored only:', {
      id: submission.id,
      form: submission.formName,
      email: submission.email,
    });
    return;
  }

  const rows = [
    ['Form', submission.formName],
    ['Language', submission.locale],
    ['Name', `${submission.firstName} ${submission.lastName}`],
    ['Email', submission.email],
    ['Phone', submission.phone],
    ['Company', submission.company],
    ['Course', submission.course],
    ['Date of birth', submission.birthday],
    ['Message', submission.message],
    ['Page', submission.pageUrl],
  ].filter(([, value]) => value);

  await mailer.sendMail({
    from: process.env.SMTP_FROM ?? `Levels Academy <${process.env.SMTP_USER}>`,
    to,
    // Replying to the notification replies to the enquirer.
    replyTo: `${submission.firstName} ${submission.lastName} <${submission.email}>`,
    subject: `New ${submission.formName} enquiry — ${submission.firstName} ${submission.lastName}`,
    text: rows.map(([label, value]) => `${label}: ${value}`).join('\n'),
    html: `<table style="border-collapse:collapse;font-family:system-ui,sans-serif">
      ${rows
        .map(
          ([label, value]) =>
            `<tr><td style="padding:6px 14px 6px 0;color:#5b6b7c">${escapeHtml(label)}</td>
                 <td style="padding:6px 0"><strong>${escapeHtml(value)}</strong></td></tr>`
        )
        .join('')}
    </table>`,
    attachments: file
      ? [{ filename: file.originalname, content: file.buffer, contentType: file.mimetype }]
      : [],
  });
}
