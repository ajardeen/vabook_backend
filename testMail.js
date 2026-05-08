import "dotenv/config"; // This loads env vars immediately before other imports
import { sendOtpMail } from "./src/utils/sendOtpMail.js";

// Now these will actually have values
// console.log(process.env.MAIL_USER); 

await sendOtpMail({
  email: "3rdmysteryunknown@gmail.com",
  otp: "12345",
  name: "Test User",
});