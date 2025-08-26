'use client';

import React, { useEffect } from 'react';
import { ArrowRight, Users, MessageCircle, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TextGenerateEffect from '@/components/ui/typewriter';
import { useRouter } from 'next/navigation';

export default function MinimalHero() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/login');
  };

  useEffect(() => {
    // Set all words to visible immediately without animation
    const words = document.querySelectorAll<HTMLElement>('.word');
    words.forEach((word) => {
      word.style.opacity = '1';
      word.style.transform = 'translateY(0)';
    });
  }, []);

  return (
    <div className="font-primary relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Enhanced 3D Grid Background with stronger perspective - Red and Black theme */}
      <div className="absolute top-0 z-[0] h-full w-full bg-background">
        {/* Red spotlight effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[100px] animate-pulse"></div>
        
        {/* Star sparkles in background with floating animations */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Define keyframes for floating animations in globals.css */}
          <style jsx>{`
            @keyframes float-up-down {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
            @keyframes float-left-right {
              0%, 100% { transform: translateX(0); }
              50% { transform: translateX(10px); }
            }
            @keyframes float-diagonal {
              0%, 100% { transform: translate(0, 0); }
              50% { transform: translate(5px, -5px); }
            }
            @keyframes float-diagonal-alt {
              0%, 100% { transform: translate(0, 0); }
              50% { transform: translate(-5px, -5px); }
            }
            @keyframes float-circular {
              0% { transform: translate(0, 0); }
              25% { transform: translate(3px, 3px); }
              50% { transform: translate(0, 5px); }
              75% { transform: translate(-3px, 3px); }
              100% { transform: translate(0, 0); }
            }
            @keyframes twinkle {
              0%, 100% { opacity: 0.2; }
              50% { opacity: 0.8; }
            }
            @keyframes pulse-size {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.2); }
            }
          `}</style>
          
          {/* Small animated stars with different positions, sizes and animations */}
          {/* Original stars with enhanced animations */}
          <div className="absolute top-[15%] left-[10%] w-[2px] h-[2px] rounded-full bg-foreground opacity-70" style={{ animation: 'twinkle 3s ease-in-out infinite, float-up-down 8s ease-in-out infinite' }}></div>
          <div className="absolute top-[25%] left-[30%] w-[1px] h-[1px] rounded-full bg-foreground opacity-50" style={{ animation: 'twinkle 2s ease-in-out infinite, float-left-right 10s ease-in-out infinite' }}></div>
          <div className="absolute top-[40%] left-[80%] w-[2px] h-[2px] rounded-full bg-foreground opacity-60" style={{ animation: 'twinkle 4s ease-in-out infinite, float-diagonal 12s ease-in-out infinite' }}></div>
          <div className="absolute top-[65%] left-[15%] w-[1px] h-[1px] rounded-full bg-foreground opacity-40" style={{ animation: 'twinkle 3.5s ease-in-out infinite, float-up-down 9s ease-in-out infinite' }}></div>
          <div className="absolute top-[75%] left-[60%] w-[2px] h-[2px] rounded-full bg-foreground opacity-70" style={{ animation: 'twinkle 2.5s ease-in-out infinite, float-left-right 11s ease-in-out infinite' }}></div>
          <div className="absolute top-[85%] left-[85%] w-[1px] h-[1px] rounded-full bg-foreground opacity-50" style={{ animation: 'twinkle 3s ease-in-out infinite, float-diagonal 10s ease-in-out infinite' }}></div>
          <div className="absolute top-[10%] left-[70%] w-[1px] h-[1px] rounded-full bg-foreground opacity-60" style={{ animation: 'twinkle 4s ease-in-out infinite, float-up-down 13s ease-in-out infinite' }}></div>
          <div className="absolute top-[50%] left-[40%] w-[2px] h-[2px] rounded-full bg-foreground opacity-70" style={{ animation: 'twinkle 3s ease-in-out infinite, float-left-right 9s ease-in-out infinite' }}></div>
          <div className="absolute top-[30%] left-[50%] w-[1px] h-[1px] rounded-full bg-foreground opacity-40" style={{ animation: 'twinkle 2.5s ease-in-out infinite, float-diagonal 11s ease-in-out infinite' }}></div>
          <div className="absolute top-[60%] left-[25%] w-[1px] h-[1px] rounded-full bg-foreground opacity-50" style={{ animation: 'twinkle 3.5s ease-in-out infinite, float-up-down 10s ease-in-out infinite' }}></div>
          
          {/* Additional stars with different animations */}
          <div className="absolute top-[5%] left-[20%] w-[2px] h-[2px] rounded-full bg-foreground opacity-60" style={{ animation: 'twinkle 3.2s ease-in-out infinite, float-diagonal 9.5s ease-in-out infinite' }}></div>
          <div className="absolute top-[12%] left-[45%] w-[1px] h-[1px] rounded-full bg-foreground opacity-50" style={{ animation: 'twinkle 2.7s ease-in-out infinite, float-left-right 12s ease-in-out infinite' }}></div>
          <div className="absolute top-[18%] left-[65%] w-[2px] h-[2px] rounded-full bg-foreground opacity-70" style={{ animation: 'twinkle 3.8s ease-in-out infinite, float-up-down 10.5s ease-in-out infinite' }}></div>
          <div className="absolute top-[22%] left-[85%] w-[1px] h-[1px] rounded-full bg-foreground opacity-40" style={{ animation: 'twinkle 2.3s ease-in-out infinite, float-diagonal 11.5s ease-in-out infinite' }}></div>
          <div className="absolute top-[35%] left-[5%] w-[2px] h-[2px] rounded-full bg-foreground opacity-60" style={{ animation: 'twinkle 4.2s ease-in-out infinite, float-left-right 9.8s ease-in-out infinite' }}></div>
          <div className="absolute top-[45%] left-[25%] w-[1px] h-[1px] rounded-full bg-foreground opacity-50" style={{ animation: 'twinkle 3.1s ease-in-out infinite, float-up-down 12.5s ease-in-out infinite' }}></div>
          <div className="absolute top-[55%] left-[55%] w-[2px] h-[2px] rounded-full bg-foreground opacity-70" style={{ animation: 'twinkle 2.9s ease-in-out infinite, float-diagonal 10.2s ease-in-out infinite' }}></div>
          <div className="absolute top-[70%] left-[35%] w-[1px] h-[1px] rounded-full bg-foreground opacity-40" style={{ animation: 'twinkle 3.7s ease-in-out infinite, float-left-right 11.8s ease-in-out infinite' }}></div>
          <div className="absolute top-[80%] left-[75%] w-[2px] h-[2px] rounded-full bg-foreground opacity-60" style={{ animation: 'twinkle 2.6s ease-in-out infinite, float-up-down 9.2s ease-in-out infinite' }}></div>
          <div className="absolute top-[90%] left-[45%] w-[1px] h-[1px] rounded-full bg-foreground opacity-50" style={{ animation: 'twinkle 3.4s ease-in-out infinite, float-diagonal 12.8s ease-in-out infinite' }}></div>
          
          {/* Medium-sized stars for more variety */}
          <div className="absolute top-[8%] left-[38%] w-[3px] h-[3px] rounded-full bg-foreground opacity-30" style={{ animation: 'twinkle 4.5s ease-in-out infinite, float-up-down 14s ease-in-out infinite' }}></div>
          <div className="absolute top-[33%] left-[68%] w-[3px] h-[3px] rounded-full bg-foreground opacity-25" style={{ animation: 'twinkle 3.9s ease-in-out infinite, float-left-right 13.5s ease-in-out infinite' }}></div>
          <div className="absolute top-[58%] left-[12%] w-[3px] h-[3px] rounded-full bg-foreground opacity-20" style={{ animation: 'twinkle 4.8s ease-in-out infinite, float-diagonal 15s ease-in-out infinite' }}></div>
          <div className="absolute top-[78%] left-[92%] w-[3px] h-[3px] rounded-full bg-foreground opacity-25" style={{ animation: 'twinkle 4.2s ease-in-out infinite, float-up-down 12.2s ease-in-out infinite' }}></div>
          
          {/* Even more stars for increased density */}
          <div className="absolute top-[3%] left-[52%] w-[1px] h-[1px] rounded-full bg-foreground opacity-45" style={{ animation: 'twinkle 2.8s ease-in-out infinite, float-diagonal-alt 9.3s ease-in-out infinite' }}></div>
          <div className="absolute top-[7%] left-[88%] w-[2px] h-[2px] rounded-full bg-foreground opacity-55" style={{ animation: 'twinkle 3.3s ease-in-out infinite, float-up-down 11.3s ease-in-out infinite' }}></div>
          <div className="absolute top-[13%] left-[3%] w-[1px] h-[1px] rounded-full bg-foreground opacity-40" style={{ animation: 'twinkle 2.4s ease-in-out infinite, float-left-right 10.4s ease-in-out infinite' }}></div>
          <div className="absolute top-[17%] left-[33%] w-[2px] h-[2px] rounded-full bg-foreground opacity-65" style={{ animation: 'twinkle 3.6s ease-in-out infinite, float-diagonal 12.6s ease-in-out infinite' }}></div>
          <div className="absolute top-[23%] left-[73%] w-[1px] h-[1px] rounded-full bg-foreground opacity-50" style={{ animation: 'twinkle 2.9s ease-in-out infinite, float-up-down 9.9s ease-in-out infinite' }}></div>
          <div className="absolute top-[28%] left-[18%] w-[2px] h-[2px] rounded-full bg-foreground opacity-60" style={{ animation: 'twinkle 3.1s ease-in-out infinite, float-left-right 11.1s ease-in-out infinite' }}></div>
          <div className="absolute top-[32%] left-[58%] w-[1px] h-[1px] rounded-full bg-foreground opacity-45" style={{ animation: 'twinkle 2.7s ease-in-out infinite, float-diagonal-alt 10.7s ease-in-out infinite' }}></div>
          <div className="absolute top-[37%] left-[93%] w-[2px] h-[2px] rounded-full bg-foreground opacity-55" style={{ animation: 'twinkle 3.4s ease-in-out infinite, float-up-down 12.4s ease-in-out infinite' }}></div>
          <div className="absolute top-[43%] left-[8%] w-[1px] h-[1px] rounded-full bg-foreground opacity-40" style={{ animation: 'twinkle 2.5s ease-in-out infinite, float-left-right 9.5s ease-in-out infinite' }}></div>
          <div className="absolute top-[48%] left-[63%] w-[2px] h-[2px] rounded-full bg-foreground opacity-65" style={{ animation: 'twinkle 3.7s ease-in-out infinite, float-diagonal 13.7s ease-in-out infinite' }}></div>
          <div className="absolute top-[53%] left-[33%] w-[1px] h-[1px] rounded-full bg-foreground opacity-50" style={{ animation: 'twinkle 2.8s ease-in-out infinite, float-up-down 10.8s ease-in-out infinite' }}></div>
          <div className="absolute top-[57%] left-[78%] w-[2px] h-[2px] rounded-full bg-foreground opacity-60" style={{ animation: 'twinkle 3.2s ease-in-out infinite, float-left-right 12.2s ease-in-out infinite' }}></div>
          <div className="absolute top-[63%] left-[48%] w-[1px] h-[1px] rounded-full bg-foreground opacity-45" style={{ animation: 'twinkle 2.6s ease-in-out infinite, float-diagonal-alt 9.6s ease-in-out infinite' }}></div>
          <div className="absolute top-[68%] left-[3%] w-[2px] h-[2px] rounded-full bg-foreground opacity-55" style={{ animation: 'twinkle 3.5s ease-in-out infinite, float-up-down 11.5s ease-in-out infinite' }}></div>
          <div className="absolute top-[73%] left-[83%] w-[1px] h-[1px] rounded-full bg-foreground opacity-40" style={{ animation: 'twinkle 2.3s ease-in-out infinite, float-left-right 10.3s ease-in-out infinite' }}></div>
          <div className="absolute top-[77%] left-[23%] w-[2px] h-[2px] rounded-full bg-foreground opacity-65" style={{ animation: 'twinkle 3.8s ease-in-out infinite, float-diagonal 13.8s ease-in-out infinite' }}></div>
          <div className="absolute top-[83%] left-[53%] w-[1px] h-[1px] rounded-full bg-foreground opacity-50" style={{ animation: 'twinkle 2.7s ease-in-out infinite, float-up-down 9.7s ease-in-out infinite' }}></div>
          <div className="absolute top-[88%] left-[13%] w-[2px] h-[2px] rounded-full bg-foreground opacity-60" style={{ animation: 'twinkle 3.3s ease-in-out infinite, float-left-right 11.3s ease-in-out infinite' }}></div>
          <div className="absolute top-[93%] left-[73%] w-[1px] h-[1px] rounded-full bg-foreground opacity-45" style={{ animation: 'twinkle 2.4s ease-in-out infinite, float-diagonal-alt 10.4s ease-in-out infinite' }}></div>
          
          {/* Additional medium and large stars */}
          <div className="absolute top-[15%] left-[82%] w-[3px] h-[3px] rounded-full bg-foreground opacity-30" style={{ animation: 'twinkle 4.3s ease-in-out infinite, float-diagonal 13.3s ease-in-out infinite' }}></div>
          <div className="absolute top-[42%] left-[47%] w-[3px] h-[3px] rounded-full bg-foreground opacity-25" style={{ animation: 'twinkle 3.8s ease-in-out infinite, float-up-down 12.8s ease-in-out infinite' }}></div>
          <div className="absolute top-[67%] left-[62%] w-[3px] h-[3px] rounded-full bg-foreground opacity-20" style={{ animation: 'twinkle 4.6s ease-in-out infinite, float-left-right 14.6s ease-in-out infinite' }}></div>
          <div className="absolute top-[27%] left-[7%] w-[4px] h-[4px] rounded-full bg-foreground opacity-15" style={{ animation: 'twinkle 5s ease-in-out infinite, float-diagonal-alt 15s ease-in-out infinite' }}></div>
          <div className="absolute top-[72%] left-[42%] w-[4px] h-[4px] rounded-full bg-foreground opacity-15" style={{ animation: 'twinkle 5.5s ease-in-out infinite, float-up-down 16.5s ease-in-out infinite' }}></div>
          
          {/* Extra stars with new animations */}
          <div className="absolute top-[4%] left-[27%] w-[2px] h-[2px] rounded-full bg-foreground opacity-60" style={{ animation: 'twinkle 3.1s ease-in-out infinite, float-circular 12.1s ease-in-out infinite' }}></div>
          <div className="absolute top-[9%] left-[56%] w-[1px] h-[1px] rounded-full bg-foreground opacity-50" style={{ animation: 'twinkle 2.6s ease-in-out infinite, float-circular 11.6s ease-in-out infinite' }}></div>
          <div className="absolute top-[14%] left-[94%] w-[2px] h-[2px] rounded-full bg-foreground opacity-65" style={{ animation: 'twinkle 3.4s ease-in-out infinite, float-circular 13.4s ease-in-out infinite' }}></div>
          <div className="absolute top-[19%] left-[14%] w-[1px] h-[1px] rounded-full bg-foreground opacity-45" style={{ animation: 'twinkle 2.9s ease-in-out infinite, float-circular 10.9s ease-in-out infinite' }}></div>
          <div className="absolute top-[24%] left-[42%] w-[2px] h-[2px] rounded-full bg-foreground opacity-55" style={{ animation: 'twinkle 3.7s ease-in-out infinite, float-circular 14.7s ease-in-out infinite' }}></div>
          <div className="absolute top-[29%] left-[76%] w-[1px] h-[1px] rounded-full bg-foreground opacity-40" style={{ animation: 'twinkle 2.4s ease-in-out infinite, float-circular 11.4s ease-in-out infinite' }}></div>
          <div className="absolute top-[34%] left-[22%] w-[2px] h-[2px] rounded-full bg-foreground opacity-60" style={{ animation: 'twinkle 3.2s ease-in-out infinite, float-circular 12.2s ease-in-out infinite' }}></div>
          <div className="absolute top-[39%] left-[66%] w-[1px] h-[1px] rounded-full bg-foreground opacity-50" style={{ animation: 'twinkle 2.7s ease-in-out infinite, float-circular 13.7s ease-in-out infinite' }}></div>
          <div className="absolute top-[44%] left-[17%] w-[2px] h-[2px] rounded-full bg-foreground opacity-65" style={{ animation: 'twinkle 3.5s ease-in-out infinite, float-circular 14.5s ease-in-out infinite' }}></div>
          <div className="absolute top-[49%] left-[87%] w-[1px] h-[1px] rounded-full bg-foreground opacity-45" style={{ animation: 'twinkle 2.8s ease-in-out infinite, float-circular 10.8s ease-in-out infinite' }}></div>
          <div className="absolute top-[54%] left-[7%] w-[2px] h-[2px] rounded-full bg-foreground opacity-55" style={{ animation: 'twinkle 3.6s ease-in-out infinite, float-circular 13.6s ease-in-out infinite' }}></div>
          <div className="absolute top-[59%] left-[37%] w-[1px] h-[1px] rounded-full bg-foreground opacity-40" style={{ animation: 'twinkle 2.5s ease-in-out infinite, float-circular 12.5s ease-in-out infinite' }}></div>
          <div className="absolute top-[64%] left-[72%] w-[2px] h-[2px] rounded-full bg-foreground opacity-60" style={{ animation: 'twinkle 3.3s ease-in-out infinite, float-circular 11.3s ease-in-out infinite' }}></div>
          <div className="absolute top-[69%] left-[27%] w-[1px] h-[1px] rounded-full bg-foreground opacity-50" style={{ animation: 'twinkle 2.6s ease-in-out infinite, float-circular 14.6s ease-in-out infinite' }}></div>
          <div className="absolute top-[74%] left-[52%] w-[2px] h-[2px] rounded-full bg-foreground opacity-65" style={{ animation: 'twinkle 3.8s ease-in-out infinite, float-circular 15.8s ease-in-out infinite' }}></div>
          <div className="absolute top-[79%] left-[7%] w-[1px] h-[1px] rounded-full bg-foreground opacity-45" style={{ animation: 'twinkle 2.7s ease-in-out infinite, float-circular 10.7s ease-in-out infinite' }}></div>
          <div className="absolute top-[84%] left-[32%] w-[2px] h-[2px] rounded-full bg-foreground opacity-55" style={{ animation: 'twinkle 3.4s ease-in-out infinite, float-circular 12.4s ease-in-out infinite' }}></div>
          <div className="absolute top-[89%] left-[62%] w-[1px] h-[1px] rounded-full bg-foreground opacity-40" style={{ animation: 'twinkle 2.3s ease-in-out infinite, float-circular 13.3s ease-in-out infinite' }}></div>
          <div className="absolute top-[94%] left-[87%] w-[2px] h-[2px] rounded-full bg-foreground opacity-60" style={{ animation: 'twinkle 3.9s ease-in-out infinite, float-circular 14.9s ease-in-out infinite' }}></div>
          
          {/* Larger stars with pulse-size animation */}
          <div className="absolute top-[6%] left-[76%] w-[3px] h-[3px] rounded-full bg-foreground opacity-25" style={{ animation: 'twinkle 4.4s ease-in-out infinite, pulse-size 7.4s ease-in-out infinite' }}></div>
          <div className="absolute top-[21%] left-[26%] w-[3px] h-[3px] rounded-full bg-foreground opacity-30" style={{ animation: 'twinkle 4.7s ease-in-out infinite, pulse-size 8.7s ease-in-out infinite' }}></div>
          <div className="absolute top-[36%] left-[81%] w-[3px] h-[3px] rounded-full bg-foreground opacity-20" style={{ animation: 'twinkle 5.1s ease-in-out infinite, pulse-size 9.1s ease-in-out infinite' }}></div>
          <div className="absolute top-[51%] left-[21%] w-[3px] h-[3px] rounded-full bg-foreground opacity-25" style={{ animation: 'twinkle 4.9s ease-in-out infinite, pulse-size 7.9s ease-in-out infinite' }}></div>
          <div className="absolute top-[66%] left-[91%] w-[3px] h-[3px] rounded-full bg-foreground opacity-30" style={{ animation: 'twinkle 5.3s ease-in-out infinite, pulse-size 8.3s ease-in-out infinite' }}></div>
          <div className="absolute top-[81%] left-[16%] w-[3px] h-[3px] rounded-full bg-foreground opacity-20" style={{ animation: 'twinkle 4.6s ease-in-out infinite, pulse-size 9.6s ease-in-out infinite' }}></div>
          
          {/* Extra large stars with combined animations */}
          <div className="absolute top-[12%] left-[12%] w-[4px] h-[4px] rounded-full bg-foreground opacity-15" style={{ animation: 'twinkle 5.2s ease-in-out infinite, pulse-size 10.2s ease-in-out infinite, float-circular 18.2s ease-in-out infinite' }}></div>
          <div className="absolute top-[47%] left-[73%] w-[4px] h-[4px] rounded-full bg-foreground opacity-15" style={{ animation: 'twinkle 5.7s ease-in-out infinite, pulse-size 11.7s ease-in-out infinite, float-circular 19.7s ease-in-out infinite' }}></div>
          <div className="absolute top-[86%] left-[42%] w-[4px] h-[4px] rounded-full bg-foreground opacity-15" style={{ animation: 'twinkle 6.1s ease-in-out infinite, pulse-size 12.1s ease-in-out infinite, float-circular 20.1s ease-in-out infinite' }}></div>
        </div>
        
        {/* 3D perspective grid with enhanced depth */}
        <div className="pointer-events-none absolute h-full w-full overflow-hidden opacity-70 [perspective:500px]">
          <div className="absolute inset-0 [transform:rotateX(45deg)]">
            <div className="absolute animate-grid [inset:0%_0px] [margin-left:-50%] [height:300vh] [width:600vw] [transform-origin:100%_0_0] [background-image:linear-gradient(to_right,hsl(var(--primary)/0.1)_1px,transparent_0),linear-gradient(to_bottom,hsl(var(--primary)/0.05)_1px,transparent_0)] [background-size:100px_100px] [background-repeat:repeat]"></div>
          </div>
          
          {/* Gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent to-70%"></div>
          
          {/* Side gradients for edge fading */}
          <div className="absolute inset-y-0 left-0 w-[20%] bg-gradient-to-r from-background to-transparent"></div>
          <div className="absolute inset-y-0 right-0 w-[20%] bg-gradient-to-l from-background to-transparent"></div>
          
          {/* Enhanced depth with shadow */}
          <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.4)]"></div>
        </div>
      </div>
      
      {/* Original grid overlay */}
      <svg
        className="absolute inset-0 h-full w-full z-[1]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="hsl(var(--primary) / 0.1)"
              strokeWidth="0.5"
              className="transition-colors duration-300"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <line
          x1="0"
          y1="20%"
          x2="100%"
          y2="20%"
          className="grid-line"
          style={{ animationDelay: '0.5s' }}
        />
        <line
          x1="0"
          y1="80%"
          x2="100%"
          y2="80%"
          className="grid-line"
          style={{ animationDelay: '1s' }}
        />
        <line
          x1="20%"
          y1="0"
          x2="20%"
          y2="100%"
          className="grid-line"
          style={{ animationDelay: '1.5s' }}
        />
        <line
          x1="80%"
          y1="0"
          x2="80%"
          y2="100%"
          className="grid-line"
          style={{ animationDelay: '2s' }}
        />
        <line
          x1="50%"
          y1="0"
          x2="50%"
          y2="100%"
          className="grid-line"
          style={{ animationDelay: '2.5s', opacity: 0.05 }}
        />
        <line
          x1="0"
          y1="50%"
          x2="100%"
          y2="50%"
          className="grid-line"
          style={{ animationDelay: '3s', opacity: 0.05 }}
        />
        <circle
          cx="20%"
          cy="20%"
          r="2"
          className="detail-dot"
          style={{ animationDelay: '3s' }}
        />
        <circle
          cx="80%"
          cy="20%"
          r="2"
          className="detail-dot"
          style={{ animationDelay: '3.2s' }}
        />
        <circle
          cx="20%"
          cy="80%"
          r="2"
          className="detail-dot"
          style={{ animationDelay: '3.4s' }}
        />
        <circle
          cx="80%"
          cy="80%"
          r="2"
          className="detail-dot"
          style={{ animationDelay: '3.6s' }}
        />
        <circle
          cx="50%"
          cy="50%"
          r="1.5"
          className="detail-dot"
          style={{ animationDelay: '4s' }}
        />
      </svg>

      {/* Simple corner elements without animations - Red theme */}
      <div className="absolute top-8 left-8 z-10">
        <div className="absolute top-0 left-0 h-4 w-4 opacity-40 bg-primary"></div>
        <div className="absolute top-0 left-0 h-px w-12 opacity-30 bg-primary"></div>
        <div className="absolute top-0 left-0 h-12 w-px opacity-30 bg-primary"></div>
      </div>
      <div className="absolute top-8 right-8 z-10">
        <div className="absolute top-0 right-0 h-4 w-4 opacity-40 bg-primary"></div>
        <div className="absolute top-0 right-0 h-px w-12 opacity-30 bg-primary"></div>
        <div className="absolute top-0 right-0 h-12 w-px opacity-30 bg-primary"></div>
      </div>
      <div className="absolute bottom-8 left-8 z-10">
        <div className="absolute bottom-0 left-0 h-4 w-4 opacity-40 bg-primary"></div>
        <div className="absolute bottom-0 left-0 h-px w-12 opacity-30 bg-primary"></div>
        <div className="absolute bottom-0 left-0 h-12 w-px opacity-30 bg-primary"></div>
      </div>
      <div className="absolute right-8 bottom-8 z-10">
        <div className="absolute right-0 bottom-0 h-4 w-4 opacity-40 bg-primary"></div>
        <div className="absolute right-0 bottom-0 h-px w-12 opacity-30 bg-primary"></div>
        <div className="absolute right-0 bottom-0 h-12 w-px opacity-30 bg-primary"></div>
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-8 py-16 md:px-20 md:py-28">
        {/* Top tagline - Red and Black theme */}
        <div className="text-center mb-16 md:mb-24">
          <div className="inline-flex items-center gap-3 mb-10">
            <div className="relative">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-soft relative z-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-code w-5 h-5 text-primary-foreground"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
              </div>
              {/* Red glow effect */}
              <div className="absolute -inset-3 bg-primary/20 rounded-3xl blur-xl -z-10"></div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground">
              HackSaathi
            </h1>
          </div>
          <div className="mx-auto w-fit rounded-3xl border-[2px] border-primary/30 px-6 py-3 text-sm text-foreground/80 flex items-center">
            <TextGenerateEffect words="Build your perfect hackathon team" speed={70} />
            <ArrowRight className="ml-3 inline h-4 w-4 text-primary" />
          </div>
        </div>

        {/* Main headline - Red and Black theme */}
        <div className="mx-auto max-w-5xl text-center mb-20 md:mb-28">
          <h1 className="text-decoration text-3xl leading-tight font-extralight tracking-tight md:text-5xl lg:text-6xl">
            <div className="mb-6 md:mb-10">
              <TextGenerateEffect 
                words="Find your perfect hackathon team" 
                className="text-foreground" 
                speed={60} 
              />
            </div>
          </h1>
          <div className="text-2xl leading-relaxed font-thin md:text-3xl lg:text-4xl text-muted-foreground max-w-4xl mx-auto px-4">
              <TextGenerateEffect 
                words="Connect with talented developers, designers, and innovators. Build amazing projects together." 
                speed={40} 
              />
          </div>
        </div>
        
           {/* Get Started Button */}
          <div className="text-center mt-12">
            <Button
              size="lg"
              className="relative w-full sm:w-auto min-w-52 py-6 text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary-hsl),0.4)]"
              onClick={handleGetStarted}
            >
              Get Started
              <ArrowRight className="ml-2" />
            </Button>
            <div className="text-sm text-muted-foreground mt-6">
              Join the community. It's free!
            </div>
          </div>

        {/* Features Section - Incorporated into hero */}
        <div className="w-full max-w-6xl mx-auto px-4 mt-28">
          <style jsx>{`
            @keyframes card-pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.02); }
            }
            @keyframes icon-bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-5px); }
            }
            @keyframes glow-pulse {
              0%, 100% { box-shadow: 0 0 15px hsla(var(--primary), 0.5); }
              50% { box-shadow: 0 0 25px hsla(var(--primary), 0.8); }
            }
          `}</style>
          <div className="grid md:grid-cols-3 gap-10 lg:gap-14">
            <div className="rounded-xl shadow-lg p-8 md:p-10 text-center border-0 bg-background/40 backdrop-blur-sm border border-primary/20 hover:border-primary/40 hover:shadow-[0_10px_25px_-5px_hsla(var(--primary),0.3)] hover:translate-y-[-5px] transition-all duration-500 group">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-red-800 rounded-2xl flex items-center justify-center mx-auto mb-8 text-white shadow-[0_0_15px_hsla(var(--primary),0.5)] group-hover:shadow-[0_0_25px_hsla(var(--primary),0.8)] transition-all duration-500">
                <Users className="w-10 h-10 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <h3 className="text-xl font-semibold mb-5 text-foreground">Smart Matching</h3>
              <p className="text-muted-foreground leading-relaxed">Find teammates with complementary skills and shared interests using our AI-powered matching system.</p>
            </div>
            <div className="rounded-xl shadow-lg p-8 md:p-10 text-center border-0 bg-background/40 backdrop-blur-sm border border-primary/20 hover:border-primary/40 hover:shadow-[0_10px_25px_-5px_hsla(var(--primary),0.3)] hover:translate-y-[-5px] transition-all duration-500 group">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-red-800 rounded-2xl flex items-center justify-center mx-auto mb-8 text-white shadow-[0_0_15px_hsla(var(--primary),0.5)] group-hover:shadow-[0_0_25px_hsla(var(--primary),0.8)] transition-all duration-500">
                <MessageCircle className="w-10 h-10 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <h3 className="text-xl font-semibold mb-5 text-foreground">Team Collaboration</h3>
              <p className="text-muted-foreground leading-relaxed">Built-in chat, project management, and collaboration tools to help your team succeed.</p>
            </div>
            <div className="rounded-xl shadow-lg p-8 md:p-10 text-center border-0 bg-background/40 backdrop-blur-sm border border-primary/20 hover:border-primary/40 hover:shadow-[0_10px_25px_-5px_hsla(var(--primary),0.3)] hover:translate-y-[-5px] transition-all duration-500 group">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-red-800 rounded-2xl flex items-center justify-center mx-auto mb-8 text-white shadow-[0_0_15px_hsla(var(--primary),0.5)] group-hover:shadow-[0_0_25px_hsla(var(--primary),0.8)] transition-all duration-500">
                <Trophy className="w-10 h-10 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <h3 className="text-xl font-semibold mb-5 text-foreground">Track Success</h3>
              <p className="text-muted-foreground leading-relaxed">See your team's progress, celebrate wins, and build lasting connections in the developer community.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
