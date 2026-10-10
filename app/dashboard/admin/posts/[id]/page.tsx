import { notFound } from "next/navigation";
import { PostEditor } from "@/components/blog/PostEditor";
import { getPost } from "../_actions";


export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  return (
    <PostEditor
      initial={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        content: post.content,
        metaTitle: post.meta_title ?? "",
        metaDescription: post.meta_description ?? "",
        ogImage: post.og_image ?? "",
        focusKeyword: post.focus_keyword ?? "",
        status: post.status,
      }}
    />
  );
}
