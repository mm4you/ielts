export const EMAIL_BRAND_CID = 'ielts-vocab-brand';
export const EMAIL_DOMAIN_CID = 'ielts-domain-update';
const appUrl = 'https://ielts.ungnhutkhang.id.vn';
function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
function layout(title: string, preheader: string, content: string, logoUrl: string, options: { heroUrl?: string; footerNote?: string } = {}) {
  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${escapeHtml(title)}</title>
<style>body{margin:0;padding:0}a{color:#0f6cbd}table{border-collapse:collapse}img{border:0;display:block} @media(max-width:600px){.mail-padding{padding:28px 22px!important}.mail-title{font-size:24px!important}.mail-outer{padding:24px 12px!important}} @media(prefers-color-scheme:dark){.mail-bg{background:#17191d!important}.mail-card{background:#202328!important;border-color:#343940!important}.mail-text{color:#f0f2f5!important}.mail-muted{color:#b3bac4!important}.mail-link{color:#8fc5f1!important}.mail-rule{border-color:#343940!important}.mail-code{background:#21364c!important;color:#d6eaff!important}.mail-button{background:#0f6cbd!important;color:#ffffff!important}}</style></head>
<body class="mail-bg" style="background:#f5f6f8;color:#242424;font-family:'Segoe UI',Arial,sans-serif;-webkit-text-size-adjust:100%">
<div style="display:none;font-size:1px;line-height:1px;color:#f5f6f8;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" class="mail-bg" style="background:#f5f6f8"><tr><td align="center" class="mail-outer" style="padding:40px 16px">
<table role="presentation" width="100%" style="max-width:600px"><tr><td class="mail-card mail-padding" style="padding:36px;background:#ffffff;border:1px solid #e3e7ed;border-radius:12px">
<table role="presentation" width="100%" style="border-bottom:1px solid #e7eaf0" class="mail-rule"><tr><td style="padding-right:10px;padding-bottom:24px;width:36px"><img src="${escapeHtml(logoUrl)}" width="36" height="36" alt="" /></td><td class="mail-text" style="font-size:17px;font-weight:600;color:#242424;padding-bottom:24px">IELTS Vocab</td></tr></table>
${options.heroUrl ? `<img src="${escapeHtml(options.heroUrl)}" width="528" alt="IELTS Vocab chuyển sang địa chỉ mới" style="display:block;width:100%;max-width:528px;height:auto;margin:26px 0 28px;border-radius:10px" />` : ''}
<h1 class="mail-title mail-text" style="font-size:27px;line-height:1.35;letter-spacing:-.5px;color:#242424;font-weight:600;margin:26px 0 20px">${escapeHtml(title)}</h1>
${content}
<table role="presentation" width="100%" style="margin-top:30px"><tr><td class="mail-rule" style="padding-top:20px;border-top:1px solid #e7eaf0"><p class="mail-muted" style="font-size:12px;line-height:1.7;color:#616161;margin:0">${escapeHtml(options.footerNote || 'Bạn nhận email này vì có tài khoản IELTS Vocab.')}<br>Cần hỗ trợ? <a class="mail-link" href="mailto:ieltsvocab939@gmail.com" style="color:#0f6cbd;text-decoration:none">Liên hệ IELTS Vocab</a></p></td></tr></table>
</td></tr></table></td></tr></table></body></html>`;
}
export function passwordResetEmail(code: string, logoUrl = `cid:${EMAIL_BRAND_CID}`) {
  if (!/^\d{6}$/.test(code)) throw new Error('Mã xác minh cần có 6 chữ số.');
  return {
    subject: 'Mã đặt lại mật khẩu — IELTS Vocab',
    text: `Mã đặt lại mật khẩu IELTS Vocab của bạn: ${code}\nMã có hiệu lực trong 5 phút. Không chia sẻ mã này với bất kỳ ai.\nNếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.\n${appUrl}`,
    html: layout('Đặt lại mật khẩu', 'Mã xác minh của bạn có hiệu lực trong 5 phút.', `
<p class="mail-text" style="font-size:15px;line-height:1.8;color:#242424;margin:0 0 22px">Nhập mã dưới đây để đặt lại mật khẩu của bạn.</p>
<table role="presentation" width="100%"><tr><td align="center" class="mail-code" style="background:#eaf3fc;border-radius:10px;padding:22px 12px;color:#0f548c;font-family:Consolas,'Courier New',monospace;font-size:34px;line-height:1.4;font-weight:600;letter-spacing:7px">${code}</td></tr></table>
<p class="mail-text" style="font-size:14px;line-height:1.8;color:#242424;margin:20px 0 10px">Mã có hiệu lực trong <strong>5 phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>
<p class="mail-muted" style="font-size:13px;line-height:1.8;color:#616161;margin:0">Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>`, logoUrl),
  };
}
export function domainChangeEmail(logoUrl = `cid:${EMAIL_BRAND_CID}`, heroUrl = `cid:${EMAIL_DOMAIN_CID}`) {
  return {
    subject: 'IELTS Vocab đã có địa chỉ mới',
    text: `Chào bạn,\n\nIELTS Vocab đã chuyển sang địa chỉ mới:\n${appUrl}/\n\nTài khoản và tiến độ học của bạn vẫn được giữ nguyên. Bạn tiếp tục đăng nhập bằng tài khoản đang dùng.\n\nHãy cập nhật dấu trang để truy cập đúng địa chỉ mới trong những lần học tiếp theo.\n\nCảm ơn bạn đã đồng hành cùng IELTS Vocab.`,
    html: layout('IELTS Vocab có địa chỉ mới', 'Tiếp tục học tại ielts.ungnhutkhang.id.vn. Tài khoản và tiến độ học được giữ nguyên.', `
<p class="mail-text" style="font-size:15px;line-height:1.8;color:#242424;margin:0 0 14px">Chào bạn,</p>
<p class="mail-text" style="font-size:15px;line-height:1.8;color:#242424;margin:0 0 20px">Từ nay, bạn có thể truy cập IELTS Vocab tại địa chỉ:</p>
<p class="mail-code" style="margin:0 0 22px;padding:18px 16px;border-radius:8px;background:#eaf3fc;overflow-wrap:anywhere;text-align:center"><a class="mail-link" href="${appUrl}/" style="color:#0f6cbd;font-size:19px;line-height:1.6;font-weight:600;text-decoration:none">ielts.ungnhutkhang.id.vn</a></p>
<p class="mail-text" style="font-size:15px;line-height:1.8;color:#242424;margin:0 0 24px"><strong>Tài khoản và tiến độ học được giữ nguyên.</strong> Bạn đăng nhập bằng tài khoản đang dùng.</p>
<table role="presentation" width="100%"><tr><td class="mail-button" bgcolor="#0f6cbd" style="background:#0f6cbd;border-radius:8px;text-align:center"><a class="mail-button" href="${appUrl}/" style="display:inline-block;padding:13px 22px;border:1px solid #0f6cbd;border-radius:8px;background:#0f6cbd;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;line-height:20px;mso-padding-alt:0">Truy cập IELTS Vocab</a></td></tr></table>
<p class="mail-muted" style="font-size:14px;line-height:1.8;color:#616161;margin:24px 0 14px">Hãy cập nhật dấu trang để truy cập đúng địa chỉ mới trong những lần học tiếp theo.</p>
<p class="mail-text" style="font-size:14px;line-height:1.8;color:#242424;margin:0">Hẹn gặp bạn ở buổi học tiếp theo.</p>`, logoUrl, { heroUrl }),
  };
}

export function feedbackEmail(data: { sender: string; type: string; contact?: string | null; message: string }, logoUrl = `cid:${EMAIL_BRAND_CID}`) {
  const field = (label: string, value: string) => `<tr><td class="mail-muted mail-rule" style="vertical-align:top;width:105px;padding:12px 12px 12px 0;border-bottom:1px solid #e7eaf0;font-size:13px;color:#616161">${escapeHtml(label)}</td><td class="mail-text mail-rule" style="vertical-align:top;padding:12px 0;border-bottom:1px solid #e7eaf0;font-size:14px;color:#242424;overflow-wrap:anywhere">${escapeHtml(value)}</td></tr>`;
  return {
    subject: `[IELTS Vocab] Góp ý mới: ${data.type}`,
    text: `Người gửi: ${data.sender}\nPhân loại: ${data.type}\nLiên hệ: ${data.contact || 'Không cung cấp'}\n\nNội dung:\n${data.message}`,
    html: layout('Góp ý mới từ người dùng', data.type, `<table role="presentation" width="100%" style="line-height:1.7;margin-bottom:26px">${field('Người gửi', data.sender)}${field('Phân loại', data.type)}${field('Liên hệ', data.contact || 'Không cung cấp')}</table><h2 class="mail-text" style="font-size:15px;line-height:1.5;color:#242424;font-weight:600;margin:0 0 12px">Nội dung góp ý</h2><div class="mail-text" style="color:#242424;font-size:15px;line-height:1.8;overflow-wrap:anywhere">${escapeHtml(data.message).replace(/\r?\n/g, '<br>')}</div>`, logoUrl, { footerNote: 'Thông báo tự động từ biểu mẫu góp ý IELTS Vocab.' }),
  };
}
