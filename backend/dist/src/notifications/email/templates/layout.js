export function escapeHtml(value) {
    const input = String(value ?? '');
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function renderDetails(details) {
    if (!details.length)
        return '';
    const rows = details
        .map((item) => `
      <tr>
        <td style="padding:8px 0;color:#7d6e5a;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;vertical-align:top;">${escapeHtml(item.label)}</td>
        <td style="padding:8px 0;color:#1f1a16;font-size:14px;font-weight:600;text-align:right;vertical-align:top;">${escapeHtml(item.value)}</td>
      </tr>
    `)
        .join('');
    return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0 8px;border-top:1px solid #e8dfd4;border-bottom:1px solid #e8dfd4;">
      ${rows}
    </table>
  `;
}
export function renderBrandedEmail(options) {
    const messages = options.message
        .map((line) => `<p style="margin:0 0 12px;color:#3a3128;font-size:14px;line-height:1.75;">${escapeHtml(line)}</p>`)
        .join('');
    const details = options.details ? renderDetails(options.details) : '';
    const cta = options.ctaLabel && options.ctaUrl
        ? `
      <div style="margin:22px 0 0;">
        <a href="${escapeHtml(options.ctaUrl)}" style="display:inline-block;background:#b7956c;color:#ffffff;text-decoration:none;padding:12px 20px;font-size:13px;font-weight:600;letter-spacing:0.04em;">${escapeHtml(options.ctaLabel)}</a>
      </div>
    `
        : '';
    const accent = options.accentText
        ? `<p style="margin:18px 0 0;color:#8a7054;font-size:13px;line-height:1.65;">${escapeHtml(options.accentText)}</p>`
        : '';
    return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>${escapeHtml(options.title)}</title>
      </head>
      <body style="margin:0;padding:0;background:#f6f2ed;font-family:Georgia, 'Times New Roman', serif;">
        <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${escapeHtml(options.preheader ?? options.title)}</span>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f2ed;padding:28px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e8dfd4;">
                <tr>
                  <td style="padding:18px 24px;background:linear-gradient(90deg,#f7f0e7,#fdfbf7);border-bottom:1px solid #eadfce;">
                    <p style="margin:0;color:#a7865f;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;font-family:Arial,sans-serif;">TatVivah</p>
                    <p style="margin:6px 0 0;color:#2f261d;font-size:20px;font-family:Georgia, 'Times New Roman', serif;">Premium Wedding Marketplace</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:26px 24px 12px;">
                    ${options.eyebrow
        ? `<p style="margin:0 0 10px;color:#a7865f;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;font-family:Arial,sans-serif;">${escapeHtml(options.eyebrow)}</p>`
        : ''}
                    <h1 style="margin:0 0 14px;color:#1f1a16;font-size:30px;line-height:1.2;font-weight:500;">${escapeHtml(options.title)}</h1>
                    ${options.greeting
        ? `<p style="margin:0 0 14px;color:#3a3128;font-size:14px;line-height:1.75;">${escapeHtml(options.greeting)}</p>`
        : ''}
                    ${messages}
                    ${details}
                    ${cta}
                    ${accent}
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 24px 24px;border-top:1px solid #f0e6da;">
                    <p style="margin:0;color:#7d6e5a;font-size:12px;line-height:1.7;font-family:Arial,sans-serif;">
                      Need assistance? Reply to this email and our support team will help you.
                    </p>
                    <p style="margin:8px 0 0;color:#9a8b79;font-size:11px;line-height:1.6;font-family:Arial,sans-serif;">
                      You are receiving this because of activity on your TatVivah account.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
//# sourceMappingURL=layout.js.map