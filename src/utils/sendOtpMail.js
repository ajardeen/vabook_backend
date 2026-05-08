import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.MAIL_PORT) || 465,
  secure: true, // true for port 465
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  // Added these two lines to help with Render's network:
  connectionTimeout: 10000, // Wait 10s before timing out
  debug: true, // Log details to Render console
});

export const sendOtpMail = async ({ email, otp, name }) => {
  await transporter.sendMail({
    from: `"Lunchbox Legends" <${process.env.MAIL_USER}>`,

    to: email,

    subject: "Your OTP Verification Code",

    html: `
      <div style="font-family:sans-serif">
        <h2>Hello ${name}</h2>

        <p>Your verification OTP is:</p>

        <h1>${otp}</h1>

        <p>
          OTP expires in 5 minutes.
        </p>
      </div>
    `,
  });
};
