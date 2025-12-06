import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Heart, 
  Baby, 
  MessageSquare, 
  Calendar,
  Sparkles,
  ChevronRight,
  Shield,
  Lock
} from 'lucide-react';

const slides = [
  {
    id: 1,
    title: "A'lo Maman",
    subtitle: "Votre compagnon santé",
    description: "La plateforme complète pour suivre votre grossesse, la santé de vos enfants et échanger avec des spécialistes.",
    icon: Heart,
    gradient: "from-pink-500 via-rose-500 to-red-500",
    bgColor: "#fce7f3",
    illustration: "💕",
    emoji: true
  },
  {
    id: 2,
    title: "Pour les Mamans",
    subtitle: "Tout pour vous et vos enfants",
    description: "Suivi de grossesse, carnets de santé, contraception, rendez-vous médicaux et assistant IA.",
    icon: Baby,
    gradient: "from-purple-500 via-pink-500 to-rose-500",
    bgColor: "#fae8ff",
    features: [
      { icon: Calendar, text: "RDV faciles", color: "bg-blue-500" },
      { icon: Baby, text: "Carnets santé", color: "bg-pink-500" },
      { icon: Sparkles, text: "Assistant IA", color: "bg-purple-500" },
      { icon: MessageSquare, text: "Communauté", color: "bg-amber-500" }
    ]
  },
  {
    id: 3,
    title: "Sécurité totale",
    subtitle: "Vos données protégées",
    description: "Chiffrement de bout en bout AES-256, données médicales 100% sécurisées et conformité totale.",
    icon: Shield,
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    bgColor: "#d1fae5",
    features: [
      { icon: Lock, text: "Chiffrement", color: "bg-green-500" },
      { icon: Shield, text: "Confidentiel", color: "bg-teal-500" },
      { icon: Heart, text: "CMU acceptée", color: "bg-emerald-500" },
      { icon: Sparkles, text: "Gratuit", color: "bg-cyan-500" }
    ]
  },
  {
    id: 4,
    title: "Prête ?",
    subtitle: "Commencez maintenant",
    description: "Rejoignez des milliers de mamans et créez votre compte gratuitement.",
    icon: Sparkles,
    gradient: "from-amber-500 via-orange-500 to-rose-500",
    bgColor: "#fed7aa",
    illustration: "🎉",
    emoji: true,
    isLast: true
  }
];

export default function IntroSlides() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [direction, setDirection] = useState('next');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setDirection('next');
      setCurrentSlide(currentSlide + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setDirection('prev');
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = () => {
    localStorage.setItem('intro_completed', 'true');
    navigate(createPageUrl('Intro'), { replace: true });
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentSlide < slides.length - 1) {
      handleNext();
    }
    if (isRightSwipe && currentSlide > 0) {
      handlePrevious();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div 
      className="fixed inset-0 overflow-hidden"
      style={{ 
        backgroundColor: slide.bgColor,
        transition: 'background-color 0.5s ease'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Skip button */}
      {!slide.isLast && (
        <button 
          onClick={handleSkip}
          className="absolute top-4 right-4 z-20 px-4 py-2 text-gray-700 font-medium text-sm rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white transition-all active:scale-95"
        >
          Passer
        </button>
      )}

      {/* Main Content */}
      <div className="h-full flex flex-col items-center justify-center px-6 pb-32 pt-16">
        {/* Icon/Illustration */}
        <div className="mb-8 relative">
          {slide.emoji ? (
            <div 
              className="text-9xl transition-all duration-500"
              style={{
                animation: direction === 'next' ? 'slideInRight 0.5s ease-out' : 'slideInLeft 0.5s ease-out'
              }}
            >
              {slide.illustration}
            </div>
          ) : (
            <div 
              className={`w-32 h-32 rounded-[2.5rem] bg-gradient-to-br ${slide.gradient} flex items-center justify-center shadow-2xl transition-all duration-500`}
              style={{
                animation: direction === 'next' ? 'scaleIn 0.5s ease-out' : 'scaleIn 0.5s ease-out'
              }}
            >
              <Icon className="w-16 h-16 text-white" />
            </div>
          )}
        </div>

        {/* Title */}
        <h1 
          className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 text-center transition-all duration-500"
          style={{
            animation: direction === 'next' ? 'fadeInUp 0.6s ease-out 0.1s backwards' : 'fadeInUp 0.6s ease-out 0.1s backwards'
          }}
        >
          {slide.title}
        </h1>

        {/* Subtitle */}
        <p 
          className={`text-xl font-bold bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent mb-4 text-center transition-all duration-500`}
          style={{
            animation: direction === 'next' ? 'fadeInUp 0.6s ease-out 0.2s backwards' : 'fadeInUp 0.6s ease-out 0.2s backwards'
          }}
        >
          {slide.subtitle}
        </p>

        {/* Description */}
        <p 
          className="text-gray-700 text-lg leading-relaxed max-w-md text-center mb-8 transition-all duration-500"
          style={{
            animation: direction === 'next' ? 'fadeInUp 0.6s ease-out 0.3s backwards' : 'fadeInUp 0.6s ease-out 0.3s backwards'
          }}
        >
          {slide.description}
        </p>

        {/* Features Grid */}
        {slide.features && (
          <div className="grid grid-cols-2 gap-3 max-w-sm w-full">
            {slide.features.map((feature, index) => {
              const FeatureIcon = feature.icon;
              return (
                <div 
                  key={index}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg active:scale-95 transition-all"
                  style={{
                    animation: `fadeInUp 0.5s ease-out ${0.4 + index * 0.1}s backwards`
                  }}
                >
                  <div className={`w-10 h-10 rounded-xl ${feature.color} flex items-center justify-center mb-2 mx-auto`}>
                    <FeatureIcon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800 text-center">{feature.text}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Navigation - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-6 space-y-4 safe-area-bottom">
        {/* Dots Indicator */}
        <div className="flex justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentSlide ? 'next' : 'prev');
                setCurrentSlide(index);
              }}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide 
                  ? `w-8 bg-gradient-to-r ${slide.gradient}` 
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleNext}
          className={`w-full h-14 rounded-2xl text-lg font-bold bg-gradient-to-r ${slide.gradient} text-white shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2`}
        >
          {slide.isLast ? (
            <>
              Commencer
              <Sparkles className="w-5 h-5" />
            </>
          ) : (
            <>
              Suivant
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .safe-area-bottom {
          padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
}