import { PostEditor } from "@/components/blog/PostEditor";


export default function NewPostPage() {
  return (
    <PostEditor
      initial={{
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        metaTitle: "",
        metaDescription: "",
        ogImage: "",
        focusKeyword: "",
        status: "draft",
      }}
    />
  );
}
