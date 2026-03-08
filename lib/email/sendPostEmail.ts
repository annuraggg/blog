import { connectDB } from "@/lib/db";
import Subscriber from "@/lib/models/Subscriber";

interface PostEmailPayload {
  title: string;
  slug: string;
  coverImage: string;
  excerpt: string;
}

export async function sendPostEmail(post: PostEmailPayload): Promise<void> {
  await connectDB();

  console.log("Fetching subscribers for newsletter...");
  const subscribers = await Subscriber.find({ unsubscribed: false }).lean();
  console.log(`Found ${subscribers.length} subscribers.`);
  if (!subscribers.length) return;

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("BREVO_API_KEY is not set.");
    return;
  }

  const siteUrl = process.env.SITE_URL;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME;

  const templateId = 5;

  for (const subscriber of subscribers) {
    const unsubscribeUrl = `${siteUrl}/api/unsubscribe?email=${encodeURIComponent(
      subscriber.email,
    )}`;

    const postUrl = `${siteUrl}/blog/${post.slug}`;

    console.log(`Sending email to ${subscriber.email}`);

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
          templateId: templateId,
          params: {
            title: post.title,
            post_url: postUrl,
            excerpt: post.excerpt,
            unsubscribe_url: unsubscribeUrl,
            cover: post.coverImage,
          },
        }),
      });

      if (!res.ok) {
        console.error(await res.text());
      }
    } catch (e) {
      console.error(`Error sending email to ${subscriber.email}:`, e);
    }
  }
}
