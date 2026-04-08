// P7-B1.1: Rive avatar — "Robocat" with global cursor-following head tracking
import { useCallback, useEffect, useRef } from 'react';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

const STATE_MACHINE = 'State Machine';
const ARTBOARD = 'Catbot';

export default function RiveAvatar({
  onClick,
  active,
  isSpeaking = false,
}: {
  onClick: () => void;
  active: boolean;
  isSpeaking?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { rive, RiveComponent } = useRive({
    src: '/rive/assistant-robot.riv',
    stateMachines: STATE_MACHINE,
    artboard: ARTBOARD,
    autoplay: true,
  });

  const chatInput = useStateMachineInput(rive, STATE_MACHINE, 'Chat');

  // Global mouse tracking: forward cursor position to Rive canvas
  useEffect(() => {
    if (!containerRef.current) return;

    const onMouseMove = (e: MouseEvent) => {
      const canvas = containerRef.current?.querySelector('canvas');
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Map global cursor to canvas-relative coordinates
      // Scale down so the full viewport maps to the canvas area
      const dx = (e.clientX - centerX) / (window.innerWidth * 0.5);
      const dy = (e.clientY - centerY) / (window.innerHeight * 0.5);
      const localX = rect.width / 2 + dx * rect.width * 0.4;
      const localY = rect.height / 2 + dy * rect.height * 0.4;

      // Fire a native mousemove event on the canvas
      const syntheticEvent = new MouseEvent('mousemove', {
        clientX: rect.left + localX,
        clientY: rect.top + localY,
        bubbles: false,
        cancelable: true,
      });
      canvas.dispatchEvent(syntheticEvent);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [rive]);

  // Sync Chat face with hover OR speaking
  useEffect(() => {
    if (chatInput) chatInput.value = isSpeaking;
  }, [isSpeaking, chatInput]);

  const handleHover = useCallback(() => {
    if (chatInput) chatInput.value = true;
  }, [chatInput]);

  const handleHoverEnd = useCallback(() => {
    if (chatInput && !isSpeaking) chatInput.value = false;
  }, [chatInput, isSpeaking]);

  return (
    <div
      ref={containerRef}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      onMouseEnter={handleHover}
      onMouseLeave={handleHoverEnd}
      className="cursor-pointer"
      title="AI asistentas"
      aria-label="AI asistentas"
    >
      <div className="w-[128px] h-[128px] overflow-hidden rounded-full">
        <RiveComponent className="w-[128px] h-[128px]" />
      </div>
    </div>
  );
}
