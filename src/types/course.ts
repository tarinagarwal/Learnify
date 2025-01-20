export interface Chapter {
  id?: string;
  course_id?: string;
  title: string;
  content?: string;
  description?: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface Course {
  id?: string;
  user_id?: string;
  title: string;
  description: string;
  chapters?: Chapter[];
  created_at?: string;
  updated_at?: string;
}

export interface CourseOutline {
  title: string;
  description: string;
  chapters: {
    title: string;
    description: string;
    order_index: number;
  }[];
}
