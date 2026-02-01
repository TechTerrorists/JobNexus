import React, { useMemo } from 'react';
import { Track } from 'livekit-client';
import { AnimatePresence, motion } from 'motion/react';
import {
  type TrackReference,
  VideoTrack,
  useLocalParticipant,
  useTracks,
  useVoiceAssistant,
} from '@livekit/components-react';
import { AgentAudioVisualizerBar } from '@/components/agents-ui/agent-audio-visualizer-bar';
import { cn } from '@/lib/shadcn/utils';

const MotionContainer = motion.create('div');

const ANIMATION_TRANSITION = {
  type: 'spring' as const,
  stiffness: 675,
  damping: 75,
  mass: 1,
};

export function useLocalTrackRef(source: Track.Source) {
  const { localParticipant } = useLocalParticipant();
  const publication = localParticipant.getTrackPublication(source);
  const trackRef = useMemo<TrackReference | undefined>(
    () => (publication ? { source, participant: localParticipant, publication } : undefined),
    [source, publication, localParticipant]
  );
  return trackRef;
}

interface TileLayoutProps {
  chatOpen: boolean;
  learningPanelOpen?: boolean;
}

export function TileLayout({ chatOpen, learningPanelOpen = false }: TileLayoutProps) {
  const {
    state: agentState,
    audioTrack: agentAudioTrack,
    videoTrack: agentVideoTrack,
  } = useVoiceAssistant();
  const [screenShareTrack] = useTracks([Track.Source.ScreenShare]);
  const cameraTrack: TrackReference | undefined = useLocalTrackRef(Track.Source.Camera);

  const isCameraEnabled = cameraTrack && !cameraTrack.publication.isMuted;
  const isScreenShareEnabled = screenShareTrack && !screenShareTrack.publication.isMuted;

  const isAvatar = agentVideoTrack !== undefined;
  const videoWidth = agentVideoTrack?.publication.dimensions?.width ?? 0;
  const videoHeight = agentVideoTrack?.publication.dimensions?.height ?? 0;

  return (
    <div className={cn(
      "pointer-events-none z-40",
      chatOpen ? "relative h-full w-full" : "absolute inset-0 bottom-32 md:bottom-40"
    )}>
      {/* Main container for the interview layout */}
      <div className="relative h-full w-full">
        {/* Agent/Interviewer Video - Position changes based on state */}
        <div
          className={cn(
            'absolute transition-all duration-300',
            learningPanelOpen
              ? 'top-4 left-4 flex items-start justify-start'
              : chatOpen
                ? 'inset-0 flex items-center justify-center'
                : 'inset-0 flex items-center justify-center pb-4'
          )}
        >
          <AnimatePresence mode="popLayout">
            {!isAvatar && (
              // Audio Agent - Visualizer
              <MotionContainer
                key="agent"
                layoutId="agent"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={ANIMATION_TRANSITION}
                className={cn(
                  'bg-background rounded-2xl border border-transparent transition-all',
                  learningPanelOpen
                    ? 'h-[80px] w-[80px]'
                    : chatOpen
                      ? 'h-[120px] w-[120px]'
                      : 'h-[300px] w-[300px] md:h-[400px] md:w-[400px]'
                )}
              >
                <AgentAudioVisualizerBar
                  barCount={5}
                  state={agentState}
                  audioTrack={agentAudioTrack}
                  className="flex h-full items-center justify-center gap-2 px-4 py-2"
                >
                  <span
                    className={cn([
                      'bg-muted rounded-full',
                      'origin-center transition-colors duration-250 ease-linear',
                      'data-[lk-highlighted=true]:bg-foreground data-[lk-muted=true]:bg-muted',
                      learningPanelOpen || chatOpen ? 'min-h-2 w-2' : 'min-h-6 w-6',
                    ])}
                  />
                </AgentAudioVisualizerBar>
              </MotionContainer>
            )}

            {isAvatar && (
              // Avatar Agent - Video (small in corner when panel open, large when closed)
              <MotionContainer
                key="avatar"
                layoutId="avatar"
                initial={{
                  scale: 0.9,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                transition={ANIMATION_TRANSITION}
                className={cn(
                  'overflow-hidden rounded-2xl bg-black shadow-2xl',
                  learningPanelOpen
                    ? 'h-[280px] w-[380px]'
                    : chatOpen
                      ? 'h-[200px] w-[280px]'
                      : 'h-[70vh] max-h-[600px] w-auto max-w-[90vw] aspect-video'
                )}
              >
                <VideoTrack
                  width={videoWidth}
                  height={videoHeight}
                  trackRef={agentVideoTrack}
                  className="h-full w-full object-cover"
                />
              </MotionContainer>
            )}
          </AnimatePresence>
        </div>

        {/* User Camera/Screen Share - Small, top right corner */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
          <AnimatePresence>
            {((cameraTrack && isCameraEnabled) || (screenShareTrack && isScreenShareEnabled)) && (
              <MotionContainer
                key="camera"
                layout="position"
                layoutId="camera"
                initial={{ opacity: 0, scale: 0, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0, x: 20 }}
                transition={ANIMATION_TRANSITION}
                className="pointer-events-auto rounded-xl overflow-hidden shadow-lg border-2 border-white/20"
              >
                <VideoTrack
                  trackRef={cameraTrack || screenShareTrack}
                  width={(cameraTrack || screenShareTrack)?.publication.dimensions?.width ?? 0}
                  height={(cameraTrack || screenShareTrack)?.publication.dimensions?.height ?? 0}
                  className="bg-muted h-[100px] w-[140px] md:h-[120px] md:w-[160px] object-cover"
                />
              </MotionContainer>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
