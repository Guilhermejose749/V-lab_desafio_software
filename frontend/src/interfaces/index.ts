export interface User {
  id: number;
  email: string;
}

export interface Course {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  creator_id: number;
  creator_email: string;
}

export interface Lesson {
  id: number;
  title: string;
  status: string;
  video_url?: string;
  course_id: number;
}

export interface ExternalUser {
  name: { first: string; last: string };
  picture: { medium: string; thumbnail: string };
}