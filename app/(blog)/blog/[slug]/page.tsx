import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import Post from "@/lib/models/Post";
import { MDXRemote } from "next-mdx-remote/rsc";
import Comments from "@/components/Comments";
import LikeButton from "@/components/LikeButton";
import { formatDistanceToNow, format } from "date-fns";
import remarkGfm from "remark-gfm";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();
  const post = await Post.findOne({ slug, status: "published" }).lean();
  if (!post) return {};

  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.subheading,
    alternates: { canonical: post.canonicalUrl ?? `/blog/${slug}` },
    openGraph: {
      title: post.seoTitle ?? post.title,
      description: post.seoDescription ?? post.subheading,
      images: post.coverImage ? [{ url: post.coverImage }] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: post.seoTitle ?? post.title,
      description: post.seoDescription ?? post.subheading,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export async function generateStaticParams() {
  try {
    await connectDB();
    const posts = await Post.find({ status: "published" }).select("slug").lean();
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export const dynamic = "force-dynamic";

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  await connectDB();

  // Check slug history
  const historical = await Post.findOne({ slugHistory: slug }).select("slug").lean();
  if (historical) redirect(`/blog/${historical.slug}`);

  const post = await Post.findOne({ slug })
    .populate("author", "name image bio website twitter")
    .populate("series", "title slug description")
    .lean();

  if (!post) notFound();
  if (post.status === "draft" || post.status === "archived") notFound();

  // Get series posts for navigation
  let seriesPosts: { slug: string; title: string; seriesOrder?: number }[] = [];
  if (post.series) {
    seriesPosts = await Post.find({ series: post.series, status: "published" })
      .select("slug title seriesOrder")
      .sort({ seriesOrder: 1 })
      .lean() as { slug: string; title: string; seriesOrder?: number }[];
  }

  const currentIndex = seriesPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex > 0 ? seriesPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < seriesPosts.length - 1 ? seriesPosts[currentIndex + 1] : null;

  const author = post.author as unknown as { name: string; image?: string; bio?: string; website?: string; twitter?: string };

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.seoDescription ?? post.subheading,
    image: post.coverImage,
    datePublished: post.publishDate?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: author.name },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          {post.series && (
            <Link
              href={`/series/${(post.series as unknown as { slug: string }).slug}`}
              className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline mb-3 block"
            >
              ← {(post.series as unknown as { title: string }).title}
            </Link>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog?tag=${tag}`}
                className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                #{tag}
              </Link>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4 leading-tight">
            {post.title}
          </h1>

          {post.subheading && (
            <p className="text-xl text-zinc-500 dark:text-zinc-400 mb-6">{post.subheading}</p>
          )}

          <div className="flex items-center gap-4">
            {author.image && (
              <Image
                src={author.image}
                alt={author.name}
                width={40}
                height={40}
                className="rounded-full"
              />
            )}
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">{author.name}</p>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                {post.publishDate && (
                  <time dateTime={post.publishDate.toISOString()}>
                    {format(new Date(post.publishDate), "MMMM d, yyyy")}
                  </time>
                )}
                <span>·</span>
                <span>{post.readingTime} min read</span>
              </div>
            </div>
          </div>
        </header>

        {/* Cover image */}
        {post.coverImage && (
          <div className="mb-8 -mx-4 md:mx-0">
            <Image
              src={post.coverImage}
              alt={post.coverImageAlt ?? post.title}
              width={800}
              height={400}
              className="w-full rounded-none md:rounded-xl object-cover max-h-96"
            />
          </div>
        )}

        {/* MDX Content */}
        <div className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-bold prose-code:font-mono prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800">
          <MDXRemote
            source={post.body}
            options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
          />
        </div>

        {/* Like button */}
        <div className="mt-10 flex items-center gap-4">
          <LikeButton postId={String(post._id)} likeCount={post.likeCount} />
        </div>

        {/* Series navigation */}
        {seriesPosts.length > 1 && (
          <nav className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 mb-4 font-medium">More in this series</p>
            <div className="flex justify-between gap-4">
              {prevPost ? (
                <Link
                  href={`/blog/${prevPost.slug}`}
                  className="flex-1 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
                >
                  <p className="text-xs text-zinc-400 mb-1">← Previous</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{prevPost.title}</p>
                </Link>
              ) : <div className="flex-1" />}
              {nextPost ? (
                <Link
                  href={`/blog/${nextPost.slug}`}
                  className="flex-1 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors text-right"
                >
                  <p className="text-xs text-zinc-400 mb-1">Next →</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{nextPost.title}</p>
                </Link>
              ) : <div className="flex-1" />}
            </div>
          </nav>
        )}

        {/* Author bio */}
        {author.bio && (
          <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex gap-4">
            {author.image && (
              <Image
                src={author.image}
                alt={author.name}
                width={56}
                height={56}
                className="rounded-full flex-shrink-0"
              />
            )}
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white mb-1">{author.name}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{author.bio}</p>
              <div className="flex gap-3 mt-2">
                {author.website && (
                  <a href={author.website} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                    Website
                  </a>
                )}
                {author.twitter && (
                  <a href={`https://twitter.com/${author.twitter}`} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                    Twitter
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Comments */}
        <Comments postId={String(post._id)} />
      </article>
    </>
  );
}
