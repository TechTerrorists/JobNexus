export interface FlashCard {
  id: string;
  question: string;
  answer: string;
  isFlipped: boolean;
}

export interface QuizAnswer {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  answers: QuizAnswer[];
}

export interface Quiz {
  id: string;
  questions: QuizQuestion[];
}