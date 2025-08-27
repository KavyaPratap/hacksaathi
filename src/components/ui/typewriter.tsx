'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TextGenerateEffectProps {
  words: string;
  className?: string;
  speed?: number;
}

export default function TextGenerateEffect({
  words,
  className,
  speed = 50,
}: TextGenerateEffectProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < words.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + words[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else {
      setIsComplete(true);
    }
  }, [currentIndex, words, speed]);

  return (
    <div className={cn('', className)}>
      {displayedText}
      {!isComplete && (
        <span className="inline-block w-1 h-5 ml-1 bg-current animate-blink" />
      )}
    </div>
  );
}