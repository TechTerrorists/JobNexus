'use client';

import React, { useState } from 'react';
import { useSessionContext } from '@livekit/components-react';
import { RemoteParticipant } from 'livekit-client';
import type { Quiz } from './types';

interface QuizProps {
  quiz: Quiz;
  onSubmit?: () => void;
}

export const QuizComponent: React.FC<QuizProps> = ({ quiz, onSubmit }) => {
  const session = useSessionContext();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const handleSubmit = async () => {
    const allAnswered = quiz.questions.every(q => selectedAnswers[q.id]);
    
    if (!allAnswered) {
      alert('Please answer all questions before submitting!');
      return;
    }

    setIsSubmitting(true);

    const agentParticipant = Array.from(session.room.remoteParticipants.values()).find(
      (p: RemoteParticipant) => p.identity.includes('agent')
    );

    if (agentParticipant) {
      try {
        const payload = JSON.stringify({
          id: quiz.id,
          answers: selectedAnswers,
        });
        
        await session.room.localParticipant.performRpc({
          destinationIdentity: agentParticipant.identity,
          method: 'agent.submitQuiz',
          payload: payload,
        });
        
        if (onSubmit) {
          onSubmit();
        }
      } catch (error) {
        console.error('Error submitting quiz:', error);
        alert('Failed to submit quiz. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="quiz-container" style={{ maxWidth: '100%', margin: '0' }}>
      <h2 style={{ marginBottom: '20px', color: 'black' }}>Quiz</h2>
      
      {quiz.questions.map((question, qIndex) => (
        <div 
          key={question.id} 
          className="question-container"
          style={{
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <h3 style={{ marginBottom: '15px', fontSize: '16px', color: 'black' }}>
            {qIndex + 1}. {question.text}
          </h3>
          
          <div className="answers">
            {question.answers.map((answer) => (
              <label
                key={answer.id}
                style={{
                  display: 'block',
                  padding: '12px',
                  marginBottom: '8px',
                  backgroundColor: 'white',
                  border: selectedAnswers[question.id] === answer.id 
                    ? '2px solid #4F46E5' 
                    : '2px solid #E5E7EB',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: 'black',
                }}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={answer.id}
                  checked={selectedAnswers[question.id] === answer.id}
                  onChange={() => handleAnswerSelect(question.id, answer.id)}
                  style={{ marginRight: '10px' }}
                />
                {answer.text}
              </label>
            ))}
          </div>
        </div>
      ))}
      
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: isSubmitting ? '#9CA3AF' : '#4F46E5',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s',
        }}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
      </button>
    </div>
  );
};