import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { BlogPost, PostPage } from "@/types/post";

const postsDirectory = path.join(process.cwd(), "posts");

// Markdown 파일에서 포스트 데이터 읽기
export function getPostFromMarkdown(filename: string): BlogPost {
  const fullPath = path.join(postsDirectory, filename);
  const fileContents = fs.readFileSync(fullPath, "utf8");

  // gray-matter로 frontmatter와 본문 분리
  const { data, content } = matter(fileContents);

  // ---page--- 구분자로 페이지 나누기
  const pageContents = content
    .split("---page---")
    .map((page) => page.trim())
    .filter((page) => page.length > 0);

  // 페이지 객체 배열 생성
  const pages: PostPage[] = pageContents.map((content, index) => ({
    pageNumber: index + 1,
    content: content,
  }));

  // 파일명에서 ID 추출 (예: 2025-10-01-first-story.md -> 1)
  const id = filename.match(/^\d{4}-\d{2}-\d{2}/)
    ? parseInt(filename.split("-").slice(2, 3).join(""), 10) ||
      Math.abs(
        filename
          .split("")
          .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
      )
    : 1;

  return {
    id,
    title: data.title,
    date: data.date,
    author: data.author,
    pages,
    thumbnail: data.thumbnail,
    description: data.description,
    tags: data.tags || [],
  };
}

// 모든 포스트 가져오기
export function getAllPosts(): BlogPost[] {
  // posts 디렉토리가 없으면 빈 배열 반환
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const filenames = fs.readdirSync(postsDirectory);
  const posts = filenames
    .filter((filename) => filename.endsWith(".md"))
    .map((filename) => getPostFromMarkdown(filename))
    .sort((a, b) => (a.date > b.date ? -1 : 1)); // 날짜 내림차순 정렬

  return posts;
}

// ID로 포스트 찾기
export function getPostById(id: number): BlogPost | undefined {
  const posts = getAllPosts();
  return posts.find((post) => post.id === id);
}

// 포스트 목록 (제목, 날짜, 썸네일 등)
export function getPostsSummary() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    date: post.date,
    author: post.author,
    thumbnail: post.thumbnail,
    description: post.description,
    tags: post.tags,
  }));
}
