'use client';

import React, { useState } from 'react';
import { useSessionContext } from '@livekit/components-react';
import { RemoteParticipant } from 'livekit-client';
import type { FlashCard } from './types';

interface FlashCardProps {
  card: FlashCard;
}

export const FlashCardComponent: React.FC<FlashCardProps> = ({ card }) => {
  const session = useSessionContext();
  const [isFlipped, setIsFlipped] = useState(card.isFlipped);

  const handleFlip = async () => {
    setIsFlipped(!isFlipped);

    const agentParticipant = Array.from(session.room.remoteParticipants.values()).find(
      (p: RemoteParticipant) => p.identity.includes('agent')
    );

    if (agentParticipant) {
      try {
        const payload = JSON.stringify({ id: card.id });
        
        await session.room.localParticipant.performRpc({
          destinationIdentity: agentParticipant.identity,
          method: 'agent.flipFlashCard',
          payload: payload,
        });
      } catch (error) {
        console.error('Error flipping card:', error);
        setIsFlipped(!isFlipped);
      }
    }
  };

  return (
    <div 
      className="flashcard-container cursor-pointer hover:scale-[1.02] transition-transform"
      onClick={handleFlip}
      style={{
        width: '100%',
        maxWidth: '400px',
        height: '180px',
        perspective: '1000px',
      }}
    >
      <div
        className="flashcard"
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
        }}
      >
        {/* Front (Question) */}
        <div
          className="flashcard-front"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#4F46E5',
            color: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="w-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
                Question
              </span>
              <svg 
                className="w-5 h-5 opacity-60" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <p className="text-base leading-relaxed text-center font-medium">
              {card.question}
            </p>
          </div>
          <div className="mt-4 text-xs opacity-70">
            Click to reveal answer
          </div>
        </div>

        {/* Back (Answer) */}
        <div
          className="flashcard-back"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#10B981',
            color: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="w-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
                Answer
              </span>
              <svg 
                className="w-5 h-5 opacity-60" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <p className="text-base leading-relaxed text-center font-medium">
              {card.answer}
            </p>
          </div>
          <div className="mt-4 text-xs opacity-70">
            Click to see question
          </div>
        </div>
      </div>
    </div>
  );
};