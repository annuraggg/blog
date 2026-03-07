import { IPost } from "@/lib/models/Post";
import { format } from "date-fns";
import Link from "next/link";
import { DirectionAwareHover } from "@/components/ui/direction-aware-hover";

type PostProps = {
  post: IPost;
};

const PostCard = ({ post }: PostProps) => {
  const category = post.tags?.[0];

  return (
    <article key={String(post._id)} className="group">
      <Link href={`/blog/${post.slug}`} className="block">
        {post.coverImage && (
          <DirectionAwareHover imageUrl={post.coverImage} alt={post.title} type="post" />
        )}
      </Link>

      <div className="text-sm mb-2 flex items-center gap-2 mt-4">
        {category && (
          <Link
            href={`/blog?tag=${category}`}
            className="text-blue-500 hover:underline"
          >
            {category}
          </Link>
        )}

        {post.publishDate && (
          <>
            <span className="text-zinc-500 dark:text-zinc-400">
              {format(new Date(post.publishDate), "MMM dd, yyyy")}
            </span>
          </>
        )}
      </div>

      {/* Title */}
      <Link href={`/blog/${post.slug}`}>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white group-hover:text-blue-500 transition-colors mb-2">
          {post.title}
        </h2>
      </Link>

      {/* Description */}
      {post.subheading && (
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
          {post.subheading}
        </p>
      )}
    </article>
  );
};

export default PostCard;
