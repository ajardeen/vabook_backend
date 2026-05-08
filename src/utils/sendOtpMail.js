import "dotenv/config";

import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for port 465, false for other ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // Use an App Password, not your regular password
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
