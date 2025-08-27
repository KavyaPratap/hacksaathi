'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { Github, Linkedin, Twitter, Code, Users, Star, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

gsap.registerPlugin(Draggable);

interface Dev {
  id: number;
  name: string;
  role: string;
  img: string;
  dataAiHint: string;
  details: {
    bio: string;
    links: {
      github: string;
      linkedin: string;
      twitter: string;
    };
  };
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const devs: Dev[] = [
  {
    id: 1,
    name: "Alex Johnson",
    role: "Lead Frontend Developer",
    img: `${supabaseUrl}/storage/v1/object/public/media/dev1.png`,
    dataAiHint: "man portrait",
    details: {
      bio: "Crafting elegant code and leading the technical vision. GSAP enthusiast.",
      links: { github: "#", linkedin: "#", twitter: "#" }
    }
  },
  {
    id: 2,
    name: "Maria Garcia",
    role: "UI/UX Designer",
    img: `${supabaseUrl}/storage/v1/object/public/media/dev2.png`,
    dataAiHint: "woman portrait",
    details: {
      bio: "Designing intuitive and beautiful user experiences. Passionate about user-centric design.",
      links: { github: "#", linkedin: "#", twitter: "#" }
    }
  },
  {
    id: 3,
    name: "Sam Chen",
    role: "Frontend Specialist",
    img: `${supabaseUrl}/storage/v1/object/public/media/dev3.png`,
    dataAiHint: "person smiling",
    details: {
      bio: "Bringing designs to life with React and Tailwind CSS. Always learning.",
      links: { github: "#", linkedin: "#", twitter: "#" }
    }
  },
  {
    id: 4,
    name: "Priya Patel",
    role: "Lead Backend Engineer",
    img: `${supabaseUrl}/storage/v1/object/public/media/dev4.png`,
    dataAiHint: "woman smiling",
    details: {
      bio: "Building robust and scalable backend systems. Expert in Node.js and databases.",
      links: { github: "#", linkedin: "#", twitter: "#" }
    }
  },
  {
      id: 5,
      name: "Chris Evans",
      role: "Frontend Developer",
      img: `${supabaseUrl}/storage/v1/object/public/media/dev5.png`,
      dataAiHint: "man smiling",
      details: {
          bio: "Passionate about creating smooth user interfaces and performant web applications.",
          links: { github: "#", linkedin: "#", twitter: "#" }
      }
  },
  {
      id: 6,
      name: "Ben Carter",
      role: "Backend Developer",
      img: `${supabaseUrl}/storage/v1/object/public/media/dev6.png`,
      dataAiHint: "person portrait",
      details: {
          bio: "Architecting secure and efficient server-side logic and database structures.",
          links: { github: "#", linkedin: "#", twitter: "#" }
      }
  },
  {
      id: 7,
      name: "David Lee",
      role: "Backend Engineer",
      img: `${supabaseUrl}/storage/v1/object/public/media/dev7.png`,
      dataAiHint: "man face",
      details: {
          bio: "Lover of clean APIs, microservices, and ensuring data integrity.",
          links: { github: "#", linkedin: "#", twitter: "#" }
      }
  },
  {
      id: 8,
      name: "Jessica Wu",
      role: "QA Tester",
      img: `${supabaseUrl}/storage/v1/object/public/media/dev8.png`,
      dataAiHint: "woman face",
      details: {
          bio: "Dedicated to ensuring a bug-free and seamless user experience through meticulous testing.",
          links: { github: "#", linkedin: "#", twitter: "#" }
      }
  },
  {
      id: 9,
      name: "Tom Harris",
      role: "Automation Tester",
      img: `${supabaseUrl}/storage/v1/object/public/media/dev9.png`,
      dataAiHint: "man professional",
      details: {
          bio: "Building automated testing pipelines to ensure code quality and stability.",
          links: { github: "#", linkedin: "#", twitter: "#" }
      }
  },
  {
      id: 10,
      name: "Rachel Green",
      role: "Content Writer",
      img: `${supabaseUrl}/storage/v1/object/public/media/dev10.png`,
      dataAiHint: "woman professional",
      details: {
          bio: "Weaving words to tell our story, explain our features, and engage our community.",
          links: { github: "#", linkedin: "#", twitter: "#" }
      }
  }
];


const initialCardSettings = [
    { rot: -12, scale: 0.85, origin: "bottom left", z: 1 },
    { rot: -6, scale: 0.9, origin: "bottom left", z: 2 },
    { rot: 0, scale: 0.95, origin: "bottom center", z: 3 },
    { rot: 6, scale: 0.9, origin: "bottom right", z: 2 },
    { rot: 12, scale: 0.85, origin: "bottom right", z: 1 },
];

export const Developers = () => {
    const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [cardsOrder, setCardsOrder] = useState<(HTMLElement | null)[]>([]);
  const [flippedCard, setFlippedCard] = useState<number | null>(null);

  const autoSwipeInterval = useRef<NodeJS.Timeout | null>(null);
  const isDragging = useRef(false);

  const EASE = "back.out(1.7)";
  const SHADOW = "0px 10px 30px -5px rgba(0,0,0,0.3)";
  const MAX_DRAG_DISTANCE = 150;

  const resetDraggablePosition = useCallback((currentCards: (HTMLElement | null)[]) => {
    const visibleCards = currentCards.slice(0, 5);
    visibleCards.forEach((card, i) => {
        if (!card) return;
        const devId = parseInt(card.dataset.devId || '0');
        
        let settings;
        if (flippedCard === devId) {
            settings = {
                x: 0,
                y: 0,
                rotation: 0,
                scale: 1.1,
                zIndex: 10,
                boxShadow: SHADOW,
            };
        } else {
            const initial = initialCardSettings[i % initialCardSettings.length];
            settings = {
                x: 0,
                y: 0,
                rotation: initial.rot,
                scale: initial.scale,
                transformOrigin: initial.origin,
                boxShadow: SHADOW,
                zIndex: initial.z,
            };
        }

        gsap.to(card, {
            ...settings,
            ease: EASE,
        });
    });

    currentCards.slice(5).forEach(card => {
        if (!card) return;
        gsap.set(card, { scale: 0, zIndex: 0 });
    });
  }, [flippedCard]);

  const flipCards = useCallback((direction: "right" | "left") => {
    if (flippedCard !== null) return;
    setCardsOrder(prevCards => {
        const newCards = [...prevCards];
        if (direction === "left") {
            const first = newCards.shift();
            if(first) newCards.push(first);
        } else {
            const last = newCards.pop();
            if(last) newCards.unshift(last);
        }
        return newCards;
    });
  }, [flippedCard]);

  const startAutoSwipe = useCallback(() => {
    stopAutoSwipe();
    autoSwipeInterval.current = setInterval(() => {
      if (!isDragging.current && flippedCard === null) {
        flipCards('left');
      }
    }, 3000);
  }, [flipCards, flippedCard]);

  const stopAutoSwipe = () => {
    if (autoSwipeInterval.current) {
      clearInterval(autoSwipeInterval.current);
      autoSwipeInterval.current = null;
    }
  };

  useEffect(() => {
    const currentCards = cardRefs.current.filter(c => c);
    setCardsOrder(currentCards);
  }, []);

  useEffect(() => {
    if (flippedCard !== null) {
      stopAutoSwipe();
    } else {
      startAutoSwipe();
    }
    resetDraggablePosition(cardsOrder);
  }, [cardsOrder, resetDraggablePosition, flippedCard, startAutoSwipe]);
  
  useEffect(() => {
    let proxy = document.createElement("div");
    let draggableInstance: Draggable | null = null;

    const createDraggable = () => {
      draggableInstance = Draggable.create(proxy, {
        trigger: containerRef.current,
        type: "x",
        bounds: { minX: -MAX_DRAG_DISTANCE, maxX: MAX_DRAG_DISTANCE },
        onDragStart: function() {
          isDragging.current = true;
          stopAutoSwipe();
        },
        onDrag: function() {
          const centralCard = cardsOrder[Math.floor(initialCardSettings.length / 2)];
          if(centralCard) {
              gsap.to(centralCard, {
                  rotation: this.x / 20,
                  ease: "power2.out"
              });
          }
        },
        onDragEnd: function() {
          isDragging.current = false;
          
          if (Math.abs(this.x) > 50) {
              flipCards(this.x < 0 ? 'left' : 'right');
          } else {
              const centralCard = cardsOrder[Math.floor(initialCardSettings.length / 2)];
              if(centralCard) {
                  gsap.to(centralCard, { rotation: 0, ease: EASE });
              }
          }
          gsap.set(this.target, { x: 0 });
          startAutoSwipe();
        }
      })[0];
    };
    
    if (flippedCard === null) {
        createDraggable();
        startAutoSwipe();
    }

    return () => {
      if (draggableInstance) draggableInstance.kill();
      stopAutoSwipe();
    };
  }, [cardsOrder, flippedCard, flipCards, startAutoSwipe]);
  
  const handleCardClick = (id: number) => {
    if (isDragging.current) return;
    setFlippedCard(prevFlipped => {
        const newFlipped = prevFlipped === id ? null : id;
        return newFlipped;
    });
  };
  
  return (
    <div className="bg-background min-h-screen">
         <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-xl font-semibold">Meet the Developers</h1>
            </div>
            </div>
        </header>
        <div className="container mx-auto px-4 text-center py-12">
            <div ref={containerRef} className="relative flex h-[475px] w-full items-center justify-center cursor-grab active:cursor-grabbing">
            {devs.map((dev, i) => {
                const isFlipped = flippedCard === dev.id;

                return (
                <div
                    key={dev.id}
                    ref={el => { cardRefs.current[i] = el; }}
                    data-dev-id={dev.id}
                    className={cn(
                        "card-container absolute h-[380px] w-[260px]",
                        "md:h-[400px] md:w-[280px]",
                        "lg:h-[450px] lg:w-[320px]",
                        "cursor-pointer"
                    )}
                    style={{ perspective: '1000px' }}
                    onClick={() => handleCardClick(dev.id)}
                >
                    <div 
                    className="card-flipper w-full h-full relative"
                    style={{ 
                        transformStyle: 'preserve-3d',
                        transition: 'transform 0.6s',
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}
                    >
                    {/* Card Front */}
                    <div className="card-front absolute w-full h-full overflow-hidden rounded-2xl border-4 border-white shadow-lg bg-gray-800 dark:bg-gray-700" style={{ backfaceVisibility: 'hidden' }}>
                        <img src={dev.img} alt={dev.name} data-ai-hint={dev.dataAiHint} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-4 w-full">
                            <h3 className="font-bold text-xl text-white">{dev.name}</h3>
                            <p className="text-sm text-gray-200">{dev.role}</p>
                        </div>
                    </div>

                    {/* Card Back */}
                    <div className="card-back absolute w-full h-full rounded-2xl border-4 border-white bg-gray-800 dark:bg-gray-700 p-6 flex flex-col justify-center items-center text-center text-white" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <h3 className="text-2xl font-bold mb-2">{dev.name}</h3>
                        <p className="text-gray-300 mb-4">{dev.details.bio}</p>
                        <div className="flex gap-4">
                        <a href={dev.details.links.github} className="hover:text-primary transition-colors"><Github /></a>
                        <a href={dev.details.links.linkedin} className="hover:text-primary transition-colors"><Linkedin /></a>
                        <a href={dev.details.links.twitter} className="hover:text-primary transition-colors"><Twitter /></a>
                        </div>
                    </div>
                    </div>
                </div>
                );
            })}
            </div>
        </div>
    </div>
  );
}
