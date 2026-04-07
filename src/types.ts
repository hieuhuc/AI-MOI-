export interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Quiz {
  id?: string;
  title: string;
  duration: number; // minutes
  questions: Question[];
  status: 'open' | 'closed';
  teacherId: string;
  createdAt: any;
}

export interface Result {
  id?: string;
  quizId: string;
  studentName: string;
  studentCode: string;
  score: number;
  answers: number[];
  submittedAt: any;
}
