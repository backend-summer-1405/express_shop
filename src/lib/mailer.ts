import nodemailer from 'nodemailer';

// ==================== Transporter ====================

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ==================== Verify Connection ====================

export const verifyEmailConnection = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log('✅ SMTP server is ready to send emails');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection error:', error);
    return false;
  }
};

// ==================== Send Email (Generic) ====================

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  const { to, subject, html, text } = options;

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    console.error('❌ Email send error:', error);
    throw error;
  }
};

// ==================== Send OTP Verification Email ====================

export const sendOtpEmail = async (to: string, code: string): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">

              <!-- Header -->
              <tr>
                <td align="center" style="background-color: #4CAF50; padding: 30px 20px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px;">فروشگاه اکسپرس</h1>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 40px 30px; text-align: center;">
                  <h2 style="color: #333333; margin-top: 0; margin-bottom: 20px; font-size: 20px;">کد تایید حساب کاربری</h2>
                  <p style="color: #666666; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
                    سلام! برای تکمیل فرآیند ثبت‌ نام، لطفاً کد زیر را در وب‌سایت وارد کنید
                  </p>

                  <!-- OTP Code Box -->
                  <div style="background-color: #f1f8e9; border: 2px dashed #8bc34a; border-radius: 8px; padding: 20px; display: inline-block; margin-bottom: 30px;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2e7d32; font-family: 'Courier New', Courier, monospace;">
                      ${code}
                    </span>
                  </div>

                  <p style="color: #999999; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
                    ⏳ این کد تنها تا <strong style="color: #e53935;">۱۰ دقیقه</strong> اعتبار دارد
                    <br>
                    اگر شما درخواست ثبت‌ نام نداده‌اید، این ایمیل را نادیده بگیرید
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="background-color: #f9fafb; padding: 20px; border-top: 1px solid #eeeeee;">
                  <p style="color: #aaaaaa; font-size: 12px; margin: 0;">
                    © 2026 Express Shop. تمامی حقوق محفوظ است.
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

  await sendEmail({
    to,
    subject: 'کد تایید ثبت‌نام - فروشگاه اکسپرس',
    html,
  });
};
