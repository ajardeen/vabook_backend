import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST, // smtp.gmail.com
  port: 587, // Use 587
  secure: false, // Must be false for 587
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Helps if the hosting environment has cert issues
  },
});
export const sendOtpMail = async ({ email, otp, name }) => {
  try {
    await transporter.sendMail({
      from: `"Lunchbox Legends" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Your OTP Verification Code",
      html: `<h2>Hello ${name}</h2><p>Your OTP is: <b>${otp}</b></p>`,
    });
    console.log("Mail sent!");
  } catch (error) {
    console.error("Mail failed:", error);
  }
};
