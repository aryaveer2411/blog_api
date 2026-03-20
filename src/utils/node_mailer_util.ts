import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  auth: {
    user: env.EMAIL,
    pass: env.EMAIL_APP_PASSWORD,
  },
  secure: true,
  port: 465,
});

export const sendEmail = async (
  userEmail: string,
  subject: string,
  html: string,
) => {
  await transporter.sendMail({
    from: env.EMAIL,
    to: userEmail, // the email address you want to send an email to
    subject: subject, // The title or subject of the email
    html: html, // I like sending my email as html, you can send \
  });
  console.log("Email sent");
};
