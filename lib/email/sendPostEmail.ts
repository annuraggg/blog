import { connectDB } from "@/lib/db";
import Subscriber from "@/lib/models/Subscriber";

interface PostEmailPayload {
  title: string;
  slug: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendPostEmail(post: PostEmailPayload): Promise<void> {
  await connectDB();

  const subscribers = await Subscriber.find({ unsubscribed: false }).lean();
  if (!subscribers.length) return;

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("BREVO_API_KEY is not set. Skipping newsletter emails.");
    return;
  }

  const siteUrl = process.env.SITE_URL ?? "https://yourdomain.com";
  const senderEmail = process.env.BREVO_SENDER_EMAIL ?? "no-reply@yourdomain.com";
  const senderName = process.env.BREVO_SENDER_NAME ?? "Blog";
  const safeTitle = escapeHtml(post.title);

  for (const subscriber of subscribers) {
    const unsubscribeUrl = `${siteUrl}/api/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;
    const htmlContent = `<h2>${safeTitle}</h2><p>A new article was published.</p><a href="${siteUrl}/blog/${post.slug}">Read the article</a><br/><br/><small><a href="${unsubscribeUrl}">Unsubscribe</a></small>`;

    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: { email: senderEmail, name: senderName },
          to: [{ email: subscriber.email }],
          subject: `New post: ${post.title}`,
          htmlContent,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`Failed to send email to ${subscriber.email}:`, err);
      }
    } catch (e) {
      console.error(`Error sending email to ${subscriber.email}:`, e);
    }
  }
}
