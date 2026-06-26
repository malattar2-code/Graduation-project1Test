const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

// تحميل ملف .env
dotenv.config();

// إنشاء transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// تأكيد الاتصال مع SMTP
transporter.verify()
  .then(() => console.log("✅ SMTP ready"))
  .catch((err) => console.error("❌ SMTP error", err));

async function sendVerificationEmail(to, verifyUrl) {
  const mailOptions = {
    from: `"Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify your email",
    text: `Click to verify: ${verifyUrl}`,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #14213d;">Password Reset Request</h2>
        <p>You have requested to reset your password. Use the verification code below:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <h1 style="color: #ff9a17; font-size: 32px; letter-spacing: 5px; margin: 0;">${verifyUrl}</h1>
        </div>
        <p><strong>This code will expire in 10 minutes.</strong></p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
        <p style="color: #6c757d; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Verification email sent");
  } catch (err) {
    console.error("❌ Error sending verification email:", err);
    throw new Error("Failed to send verification email");
  }
}
// NEW FUNCTION: Send password reset code
async function sendPasswordResetEmail(to, verificationCode) {
  const mailOptions = {
    from: `"Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Password Reset Verification Code",
    text: `Your password reset verification code is: ${verificationCode}. This code will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #14213d;">Password Reset Request</h2>
        <p>You have requested to reset your password. Use the verification code below:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <h1 style="color: #ff9a17; font-size: 32px; letter-spacing: 5px; margin: 0;">${verificationCode}</h1>
        </div>
        <p><strong>This code will expire in 10 minutes.</strong></p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
        <p style="color: #6c757d; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Password reset email sent to:", to);
  } catch (err) {
    console.error("❌ Error sending password reset email:", err);
    throw new Error("Failed to send password reset email");
  }
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
