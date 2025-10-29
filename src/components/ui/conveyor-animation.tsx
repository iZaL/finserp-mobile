"use client"

import { Fish } from "lucide-react"

interface FishSwimmingAnimationProps {
  className?: string
}

export function FishSwimmingAnimation({ className = "" }: FishSwimmingAnimationProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <style jsx>{`
        @keyframes swim {
          0% {
            transform: translateX(-150px) translateY(0px);
            opacity: 0;
          }
          5% {
            opacity: 0.5;
          }
          10% {
            transform: translateX(-100px) translateY(-3px);
            opacity: 0.6;
          }
          20% {
            transform: translateX(-50px) translateY(0px);
          }
          30% {
            transform: translateX(0px) translateY(-2px);
          }
          40% {
            transform: translateX(50px) translateY(0px);
          }
          50% {
            transform: translateX(100px) translateY(-3px);
          }
          60% {
            transform: translateX(150px) translateY(0px);
          }
          70% {
            transform: translateX(200px) translateY(-2px);
          }
          80% {
            transform: translateX(250px) translateY(0px);
          }
          90% {
            transform: translateX(300px) translateY(-3px);
            opacity: 0.6;
          }
          95% {
            opacity: 0.4;
          }
          100% {
            transform: translateX(calc(100vw + 50px)) translateY(0px);
            opacity: 0;
          }
        }

        .fish {
          position: absolute;
          left: 0;
          animation: swim 8s ease-in-out infinite;
          transform: translateX(-150px);
          opacity: 0;
        }

        .fish:nth-child(1) {
          top: 20%;
          animation-delay: 0s;
          animation-duration: 7s;
        }

        .fish:nth-child(2) {
          top: 50%;
          animation-delay: 2.5s;
          animation-duration: 8s;
        }

        .fish:nth-child(3) {
          top: 35%;
          animation-delay: 5s;
          animation-duration: 7.5s;
        }

        .fish:nth-child(4) {
          top: 65%;
          animation-delay: 1.5s;
          animation-duration: 8.5s;
        }

        .fish:nth-child(5) {
          top: 80%;
          animation-delay: 4s;
          animation-duration: 7s;
        }
      `}</style>

      <div className="fish">
        <Fish className="size-5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
      </div>
      <div className="fish">
        <Fish className="size-4 text-cyan-600 dark:text-cyan-400" strokeWidth={2} />
      </div>
      <div className="fish">
        <Fish className="size-6 text-blue-700 dark:text-blue-500" strokeWidth={2} />
      </div>
      <div className="fish">
        <Fish className="size-4 text-sky-600 dark:text-sky-400" strokeWidth={2} />
      </div>
      <div className="fish">
        <Fish className="size-5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
      </div>
    </div>
  )
}

// Keep the old name as an alias for backward compatibility
export { FishSwimmingAnimation as ConveyorAnimation }
