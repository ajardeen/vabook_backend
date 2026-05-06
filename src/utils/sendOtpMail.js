import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendOtpMail = async ({
  email,
  otp,
  name,
}) => {
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