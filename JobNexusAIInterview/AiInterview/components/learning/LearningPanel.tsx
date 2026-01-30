'use client';

import React, { useState, useEffect } from 'react';
import { useSessionContext } from '@livekit/components-react';
import { FlashCardComponent } from './FlashCard';
import { QuizComponent } from './Quiz';
import type { FlashCard, Quiz } from './types';

export const LearningPanel: React.FC = () => {
  const session = useSessionContext();
  const [flashCards, setFlashCards] = useState<FlashCard[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    if (!session.room) return;

    const registerHandlers = () => {
      // Flash card handler
      session.room.localParticipant.registerRpcMethod(
        'client.flashcard',
        async (data: any) => {
          console.log('Received flashcard data:', data);
          
          try {
            const payload = JSON.parse(data.payload);
            
            if (payload.action === 'show') {
              const newCard: FlashCard = {
                id: payload.id,
                question: payload.question,
                answer: payload.answer,
                isFlipped: false,
              };
              
              setFlashCards(prev => [...prev, newCard]);
            } else if (payload.action === 'flip') {
              setFlashCards(prev => 
                prev.map(card => 
                  card.id === payload.id 
                    ? { ...card, isFlipped: !card.isFlipped }
                    : card
                )
              );
            }
          } catch (error) {
            console.error('Error handling flashcard:', error);
          }
          
          return '';
        }
      );

      // Quiz handler
      session.room.localParticipant.registerRpcMethod(
        'client.quiz',
        async (data: any) => {
          console.log('Received quiz data:', data);
          
          try {
            const payload = JSON.parse(data.payload);
            
            if (payload.action === 'show') {
              const newQuiz: Quiz = {
                id: payload.id,
                questions: payload.questions,
              };
              
              setCurrentQuiz(newQuiz);
            }
          } catch (error) {
            console.error('Error handling quiz:', error);
          }
          
          return '';
        }
      );
    };

    registerHandlers();
  }, [session.room]);

  const handleQuizSubmit = () => {
    setCurrentQuiz(null);
  };

  if (!session.room) {
    return null;
  }

  return (
    <div className="learning-panel h-full flex flex-col p-6 bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Learning Materials</h1>
        <p className="text-sm text-gray-600 mt-1">
          Flash cards and quizzes will appear here
        </p>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Quiz Section - Show first if active */}
        {currentQuiz && (
          <div className="quiz-section bg-white rounded-lg shadow-sm p-4">
            <QuizComponent 
              quiz={currentQuiz}
              onSubmit={handleQuizSubmit}
            />
          </div>
        )}

        {/* Flash Cards Section */}
        {flashCards.length > 0 && (
          <div className="flashcards-section">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Flash Cards ({flashCards.length})
            </h2>
            <div 
              className="flashcards-grid space-y-4"
            >
              {flashCards.map((card) => (
                <FlashCardComponent key={card.id} card={card} />
              ))}
            </div>
          </div>
        )}

        {/* Placeholder when nothing to show */}
        {flashCards.length === 0 && !currentQuiz && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                <svg 
                  className="w-8 h-8 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No learning materials yet
              </h3>
              <p className="text-sm text-gray-600">
                Ask the agent to create flash cards or quizzes to help you learn!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};