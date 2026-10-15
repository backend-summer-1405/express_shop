import nodemailer from 'nodemailer';

// ==================== Transporter ====================

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
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

// ==================== Send Email ====================

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
    text: text || html.replace(/<[^>]*>/g, ''), // متن ساده از HTML
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    console.error('❌ Email send error:', error);
    throw error;
  }
};
