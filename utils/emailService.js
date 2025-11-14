// utils/emailService.js
import nodemailer from 'nodemailer';

// إعداد الـ transporter (الخدمة المسؤولة عن الإرسال)
const transporter = nodemailer.createTransport({
  service: 'gmail', // يمكنك استخدام أي خدمة أخرى مثل SendGrid, Mailgun
  auth: {
    user: process.env.EMAIL_USER || 'quackplan1@gmail.com', // بريدك الإلكتروني من ملف .env
    pass: process.env.EMAIL_PASS || 'vgqfjbkbvlrzxppx', // كلمة مرور التطبيقات (App Password) من حساب جوجل
  },
});

/**
 * @param {string} to - البريد الإلكتروني للمستلم
 * @param {string} otp - رمز التحقق
 */
export const sendVerificationEmail = async (to, otp) => {
// داخل دالة sendVerificationEmail في utils/emailService.js

const mailOptions = {
  from: `"${process.env.APP_NAME}" <${process.env.EMAIL_USER}>`,
  to: to,
  subject: `Your Verification Code for ${process.env.APP_NAME}`,
  // --- استبدل الـ html القديم بهذا الكود ---
  html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; margin: 0; padding: 40px;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="background-color: #007bff; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;"> QuackPlan</h1>
        </div>
        <div style="padding: 30px; text-align: center;">
          <h2 style="color: #333333;">Email Verification</h2>
          <p style="font-size: 16px; color: #555555; margin: 20px 0;">
            Thank you for registering. Please use the following code to verify your email address. The code is valid for 10 minutes.
          </p>
          <div style="display: inline-block; background-color: #e9ecef; color: #333; font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 15px 40px; border-radius: 8px; margin: 20px 0; user-select: all;">
            ${otp}
          </div>
          <p style="font-size: 14px; color: #777777;">
            If you did not request this, please ignore this email.
          </p>
        </div>
        <div style="background-color: #f1f1f1; color: #777777; font-size: 12px; text-align: center; padding: 15px;">
          &copy; ${new Date().getFullYear()} ${process.env.APP_NAME}. All rights reserved.
        </div>
      </div>
    </div>
  `,
};



  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (to, otp) => {
  const mailOptions = {
    from: `"QuackPlan" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: `Password Reset Code for ${process.env.APP_NAME}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; margin: 0; padding: 40px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="background-color: #007bff; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">${process.env.APP_NAME || 'QuackPlan'}</h1>
          </div>
          <div style="padding: 30px; text-align: center;">
            <h2 style="color: #333333;">Password Reset</h2>
            <p style="font-size: 16px; color: #555555; margin: 20px 0;">
              You requested a password reset. Please use the following code to reset your password. The code is valid for 10 minutes.
            </p>
            <div style="display: inline-block; background-color: #e9ecef; color: #333; font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 15px 40px; border-radius: 8px; margin: 20px 0; user-select: all;">
              ${otp}
            </div>
            <p style="font-size: 14px; color: #777777;">
              If you did not request this, please ignore this email.
            </p>
          </div>
          <div style="background-color: #f1f1f1; color: #777777; font-size: 12px; text-align: center; padding: 15px;">
            &copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'QuackPlan'}. All rights reserved.
          </div>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
