'use client';

import { useEffect, useState } from 'react';
import { PartyPopper } from 'lucide-react';

const CONFETTI_COUNT = 35;
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

type ConfettiPiece = {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
};

function generateConfetti(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 300,
    duration: 2000 + Math.random() * 1000,
  }));
}

export default function SettledUpState() {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setConfetti(generateConfetti());
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="relative flex min-h-[300px] flex-col items-center justify-center px-4">
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(400px) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>

      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute -top-10 h-2 w-2 rounded"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animation: `fall ${piece.duration}ms linear ${piece.delay}ms forwards`,
          }}
        />
      ))}

      <PartyPopper className="mb-4 h-16 w-16 text-primary" />
      <h2 className="mb-2 text-2xl font-semibold">All settled up!</h2>
      <p className="text-sm text-muted-foreground">Everyone in this group is even — no payments needed.</p>
    </div>
  );
}