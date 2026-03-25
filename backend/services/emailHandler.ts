import nodemailer, { Transporter } from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { getUserForEmail } from "../dbHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const transporter: Transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendThankYouEmail(
  userId: number,
  amount: number,
  campaignName: string
): Promise<void> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("sendThankYouEmail: EMAIL_USER or EMAIL_PASS not set, skipping");
    return;
  }

  const user = await getUserForEmail(userId);
  if (!user) {
    console.warn(`sendThankYouEmail: no user found for id ${userId}`);
    return;
  }

  const templateName =
    amount < 200
      ? "basicThankYouEmailTemplate.html"
      : "personalThankYouEmailTemplate.html";

  const templatePath = path.join(__dirname, "../emailTemplates", templateName);
  let html = readFileSync(templatePath, "utf-8");

  const fullName = `${user.firstname} ${user.surname}`;
  html = html.replace(
    /<span id="name">[^<]*<\/span>/g,
    `<span id="name">${fullName}</span>`
  );
  html = html.replace(
    /<span id="amount">[^<]*<\/span>/g,
    `<span id="amount">${amount} kr</span>`
  );
  html = html.replace(
    /<span id="campaignName">[^<]*<\/span>/g,
    `<span id="campaignName">${campaignName}</span>`
  );

  await transporter.sendMail({
    from: `"Den Danske Donation" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `Tak for din donation til ${campaignName}`,
    html,
  });

  console.log(`Thank-you email sent to ${user.email}`);
}
