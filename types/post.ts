export interface PostPage {
  pageNumber: number;
  content: string;
}

export interface BlogPost {
  id: number;
  title: string;
  date: string;
  author: string;
  pages: PostPage[];
  thumbnail?: string; // 썸네일 이미지 경로 (선택사항)
  description?: string; // 짧은 설명 (선택사항)
  tags?: string[]; // 태그 배열 (선택사항)
}
