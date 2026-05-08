import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT), // Should be 587
  secure: false, // You requested no secure (STARTTLS)
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    // This helps prevent timeouts on cloud networks
    rejectUnauthorized: false,
    minVersion: "TLSv1.2"
  },
  connectionTimeout: 10000, 
  debug: true,
  logger: true 
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