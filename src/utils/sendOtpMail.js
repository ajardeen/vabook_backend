import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST, // smtp.gmail.com
  port: 465,                   // Change from 587 to 465
  secure: true,                // Use true for 465, false for 587
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // Ensure this is a 16-character App Password
  },
  // Keep these for cloud stability
  connectionTimeout: 20000, 
  greetingTimeout: 20000,
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