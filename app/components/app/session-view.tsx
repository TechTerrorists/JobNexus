'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useSessionContext, useSessionMessages } from '@livekit/components-react';
import { BookOpen, X } from 'lucide-react';
import type { AppConfig } from '@/app-config';
import {
  AgentControlBar,
  type AgentControlBarControls,
} from '@/components/agents-ui/agent-control-bar';
import { ChatTranscript } from '@/components/app/chat-transcript';
import { TileLayout } from '@/components/app/tile-layout';
import { LearningPanel } from '@/components/learning/LearningPanel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shadcn/utils';
import { Shimmer } from '../ai-elements/shimmer';

const MotionBottom = motion.create('div');
const MotionMessage = motion.create(Shimmer);

const BOTTOM_VIEW_MOTION_PROPS = {
  variants: {
    visible: {
      opacity: 1,
      translateY: '0%',
    },
    hidden: {
      opacity: 0,
      translateY: '100%',
    },
  },
  initial: 'hidden' as const,
  animate: 'visible' as const,
  exit: 'hidden' as const,
  transition: {
    duration: 0.3,
    delay: 0.5,
    ease: 'easeOut' as const,
  },
};

const SHIMMER_MOTION_PROPS = {
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
} as const;

interface FadeProps {
  top?: boolean;
  bottom?: boolean;
  className?: string;
}

export function Fade({ top = false, bottom = false, className }: FadeProps) {
  return (
    <div
      className={cn(
        'from-background pointer-events-none h-4 bg-linear-to-b to-transparent',
        top && 'bg-linear-to-b',
        bottom && 'bg-linear-to-t',
        className
      )}
    />
  );
}

interface SessionViewProps {
  appConfig: AppConfig;
}

export const SessionView = ({
  appConfig,
  ...props
}: React.ComponentProps<'section'> & SessionViewProps) => {
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);
  const [chatOpen, setChatOpen] = useState(false);
  const [learningPanelOpen, setLearningPanelOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const controls: AgentControlBarControls = {
    leave: true,
    microphone: true,
    chat: appConfig.supportsChatInput,
    camera: appConfig.supportsVideoInput,
    screenShare: appConfig.supportsScreenShare,
  };

  useEffect(() => {
    const lastMessage = messages.at(-1);
    const lastMessageIsLocal = lastMessage?.from?.isLocal === true;

    if (scrollAreaRef.current && lastMessageIsLocal) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <section
      className="bg-background relative z-10 h-svh w-svw overflow-hidden flex"
      {...props}
    >
      {/* Learning Panel - Slide in from left */}
      {/* Always render LearningPanel so RPC handlers stay registered */}
      <motion.div
        initial={false}
        animate={{
          width: learningPanelOpen ? '50%' : 0,
          opacity: learningPanelOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          "relative border-r border-gray-200 overflow-hidden bg-white dark:bg-gray-900",
          !learningPanelOpen && "pointer-events-none"
        )}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLearningPanelOpen(false)}
          className="absolute top-4 right-4 z-10"
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="h-full overflow-y-auto min-w-100">
          <LearningPanel onContentReceived={() => setLearningPanelOpen(true)} />
        </div>
      </motion.div>

      {/* Main Interview Area - Full width when learning panel closed */}
      <div className={cn(
        "relative flex flex-col transition-all duration-300",
        learningPanelOpen ? "w-1/2" : "w-full"
      )}>
        {/* Content area - side by side when chat is open */}
        <div className={cn(
          "flex-1 flex transition-all duration-300",
          chatOpen ? "flex-row" : "flex-col"
        )}>
          {/* Video area - left side when chat open */}
          <div className={cn(
            "relative transition-all duration-300",
            chatOpen ? "w-1/2 h-full" : "flex-1"
          )}>
            <TileLayout chatOpen={chatOpen} learningPanelOpen={learningPanelOpen} />
          </div>

          {/* Chat transcript - right side when chat open */}
          <div className={cn(
            "transition-all duration-300 overflow-hidden",
            chatOpen ? "w-1/2 h-full" : "w-0"
          )}>
            <Fade top className="absolute inset-x-0 top-0 z-10 h-10" />
            <div className="h-full overflow-y-auto px-4 pt-16 pb-4" ref={scrollAreaRef}>
              <ChatTranscript
                hidden={!chatOpen}
                messages={messages}
                className="space-y-3 transition-opacity duration-300 ease-out"
              />
            </div>
          </div>
        </div>

        {/* Bottom controls */}
        <MotionBottom
          {...BOTTOM_VIEW_MOTION_PROPS}
          className="relative z-50 px-3 md:px-12"
        >
          {/* Pre-connect message */}
          {appConfig.isPreConnectBufferEnabled && (
            <AnimatePresence>
              {messages.length === 0 && (
                <MotionMessage
                  key="pre-connect-message"
                  duration={2}
                  aria-hidden={messages.length > 0}
                  {...SHIMMER_MOTION_PROPS}
                  className="pointer-events-none mx-auto block w-full max-w-2xl pb-4 text-center text-sm font-semibold"
                >
                  Agent is listening, ask it a question
                </MotionMessage>
              )}
            </AnimatePresence>
          )}
          <div className="bg-background relative mx-auto max-w-2xl pb-3 md:pb-12">
            <Fade bottom className="absolute inset-x-0 top-0 h-4 -translate-y-full" />
            <AgentControlBar
              variant="livekit"
              controls={controls}
              isChatOpen={chatOpen}
              isConnected={session.isConnected}
              onDisconnect={session.end}
              onIsChatOpenChange={setChatOpen}
            />
          </div>
        </MotionBottom>
      </div>
    </section>
  );
};
