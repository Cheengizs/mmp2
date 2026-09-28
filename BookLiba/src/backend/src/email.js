const nodemailer = require("nodemailer");
const { logger } = require("./logger.js");

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info("Создан тестовый Ethereal SMTP аккаунт для отправки почты");
  }

  return transporter;
}

async function sendPasswordResetEmail(toEmail, resetToken) {
  const mailer = await getTransporter();
  const resetUrl = `http://localhost:5173/?resetToken=${resetToken}`;

  const info = await mailer.sendMail({
    from: '"Библиотека BookLiba" <noreply@bookliba.local>',
    to: toEmail,
    subject: "Восстановление пароля в BookLiba",
    html: `
      <div style="font-family: sans-serif; max-width: 500px; padding: 20px; background-color: #1c1c21; color: #f3f4f6; border-radius: 8px;">
        <h2 style="color: #60a5fa; margin-top: 0;">Восстановление пароля</h2>
        <p>Вы получили это письмо, потому что запросили сброс пароля для вашего аккаунта в BookLiba.</p>
        <p>Ссылка действительна в течение <strong>15 минут</strong>:</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Сбросить пароль
          </a>
        </p>
        <p style="color: #9ca3af; font-size: 13px;">Или используйте токен сброса напрямую: <code style="color: #60a5fa;">${resetToken}</code></p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">Если вы не запрашивали сброс, просто проигнорируйте это письмо.</p>
      </div>
    `,
  });

  logger.info(
    { messageId: info.messageId, to: toEmail },
    "Письмо сброса пароля отправлено",
  );

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    logger.info(
      `[Эмуляция Email] Просмотр отправленного письма: ${previewUrl}`,
    );
  }

  return previewUrl || true;
}

module.exports = { sendPasswordResetEmail };
