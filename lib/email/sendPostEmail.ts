import { connectDB } from "@/lib/db";
import Subscriber from "@/lib/models/Subscriber";
import { blogConfig } from "@/lib/config";

interface PostEmailPayload {
  title: string;
  slug: string;
  coverImage: string;
  excerpt: string;
}

export async function sendPostEmail(post: PostEmailPayload): Promise<void> {
  await connectDB();

  const subscribers = await Subscriber.find({ unsubscribed: false }).lean();
  if (!subscribers.length) return;

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("BREVO_API_KEY is not set.");
    return;
  }

  const siteUrl = blogConfig.url;
  const { senderEmail, senderName, templateId } = blogConfig.email;

  for (const subscriber of subscribers) {
    const unsubscribeUrl = `${siteUrl}/api/unsubscribe?email=${encodeURIComponent(
      subscriber.email,
    )}`;

    const postUrl = `${siteUrl}/blog/${post.slug}`;

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
          templateId,
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
      } else {
        // Track email send analytics
        await Subscriber.updateOne(
          { _id: subscriber._id },
          { $inc: { emailsSent: 1 }, $set: { lastEmailSentAt: new Date() } },
        );
      }
    } catch (e) {
      console.error(`Error sending email to ${subscriber.email}:`, e);
    }
  }
}
