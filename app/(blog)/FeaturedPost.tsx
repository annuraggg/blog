import { IPost } from "@/lib/models/Post";
import Link from "next/link";
import { DirectionAwareHover } from "@/components/ui/direction-aware-hover";

type FeaturedPostProps = {
  post: IPost;
};

const FeaturedPost = ({ post }: FeaturedPostProps) => {
  return (
    <article className="grid md:grid-cols-2 gap-10 items-center">
      {/* Image */}
      {post.coverImage && (
        <Link href={`/blog/${post.slug}`} className="block group">
          <DirectionAwareHover
            imageUrl={post.coverImage}
            alt={post.title}
            type="featured"
            className="w-full"
          />
        </Link>
      )}

      {/* Content */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 text-sm">
          <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-sm text-xs font-semibold tracking-wide font-sans">
            FEATURED
          </span>

          {post.tags?.[0] && (
            <span className="text-zinc-500 dark:text-zinc-400">
              in {post.tags[0]}
            </span>
          )}
        </div>

        <Link href={`/blog/${post.slug}`}>
          <h2 className="text-3xl md:text-4xl font-semibold text-zinc-900 dark:text-white leading-tight hover:underline">
            {post.title}
          </h2>
        </Link>

        {post.body && (
          <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed line-clamp-3">
            {post.body}
          </p>
        )}

        {post.publishDate && (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {new Date(post.publishDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        )}
      </div>
    </article>
  );
};

export default FeaturedPost;
