import React from 'react';

interface FallbackNoticeProps {
  type: 'tooSmall' | 'rotateOrResize';
}

/**
 * FallbackNotice Component
 * 
 * Displays a full-screen fallback message when the device screen size
 * doesn't meet the minimum 1280px requirement for the CFA Master Clerk Entry Tool.
 * 
 * @param type - Determines the message shown:
 *   - 'tooSmall': Device is physically incapable of reaching 1280px
 *   - 'rotateOrResize': Device is capable but current layout is too narrow
 */
export default function FallbackNotice({ type }: FallbackNoticeProps) {
  const messages = {
    tooSmall: {
      title: "🐾 Oops! This tool needs a bit more space.",
      description: "Your device screen is too small to run the CFA Master Clerk Entry Tool.",
      action: "Please switch to a desktop or larger display."
    },
    rotateOrResize: {
      title: "🐾 Oops! This tool needs a bit more room to stretch.",
      description: "Your screen is currently too narrow for optimal use.",
      action: "Try rotating your device to landscape mode or maximizing your browser window."
    }
  };

  const currentMessage = messages[type];

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center text-center px-2 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 relative overflow-hidden fallback-screen">
      {/* Enhanced animated background elements - Even smaller for landscape */}
      <div className="absolute top-4 left-4 w-16 h-16 bg-gradient-to-br from-pink-300 to-purple-300 rounded-full blur-xl opacity-70 animate-pulse"></div>
      <div className="absolute bottom-4 right-4 w-14 h-14 bg-gradient-to-br from-blue-300 to-cyan-300 rounded-full blur-lg opacity-70 animate-pulse" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-gradient-to-br from-emerald-300 to-green-300 rounded-full blur-md opacity-70 animate-pulse" style={{animationDelay: '2s'}}></div>
      <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-gradient-to-br from-amber-300 to-orange-300 rounded-full blur-md opacity-60 animate-pulse" style={{animationDelay: '0.5s'}}></div>
      
      {/* Main content container - Ultra compact for landscape */}
      <div className="relative z-10 max-w-xs mx-auto">
        {/* Cat animation container - 1.25x bigger for better visibility */}
        <div 
          className="relative mb-3 flex items-end justify-center mx-auto" 
          style={{ 
            overflow: 'visible',
            height: '112px',  // 1.25x bigger (90px * 1.25)
            width: '150px',   // 1.25x bigger (120px * 1.25)
          }}
        >
          
          {/* Cat Shadow - 1.25x bigger */}
          <img
            src="/assets/cat_shadow.svg"
            alt="Cat shadow"
            className="animate-shadow-expand"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 'calc(50% - 27px)',
              width: '55px',
              height: '16px',
              zIndex: 10,
              display: 'block',
            }}
          />
          
          {/* Cat Image - 1.25x bigger */}
          <img 
            src="/assets/cat_top.png" 
            alt="Jumping cat" 
            className="animate-cat-jump"
            style={{
              position: 'absolute',
              bottom: '8px',
              left: 'calc(50% - 62px)',
              width: '125px',
              height: '79px',
              zIndex: 20,
              display: 'block',
            }}
          />
          
          {/* Question Mark - 1.25x bigger */}
          <div 
            style={{
              position: 'absolute',
              bottom: '84px',
              left: 'calc(50% - 11px)',
              width: '22px',
              height: '22px',
              zIndex: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'rotate(15deg)',
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#8b5cf6',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              animation: 'cat-jump 2.2s infinite ease-in-out, question-blink 2.5s infinite ease-in-out',
              animationDelay: '0.05s, 0s',
            }}
          >
            ?
          </div>
        </div>

        {/* Enhanced Message content - Ultra compact for landscape */}
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg border-2 border-gradient-to-r from-pink-200 via-purple-200 to-indigo-200 p-4 transform animate-in zoom-in-95 duration-300 hover:shadow-xl transition-all duration-500">
          {/* Decorative elements - Even smaller for landscape */}
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full animate-pulse"></div>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-gradient-to-br from-indigo-400 to-blue-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
          
          <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3 tracking-tight" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
            {currentMessage.title}
          </h1>
          
          <div className="space-y-3 text-gray-700">
            {/* Enhanced description with exact GeneralTab styling */}
            <p className="text-sm font-normal text-gray-900 leading-relaxed px-2 text-left">
              This app is designed for <span className="font-semibold text-pink-600 bg-pink-100 px-1.5 py-0.5 rounded-md">desktop usage</span>. {type === 'tooSmall' ? (
                <>Your device screen is <span className="font-semibold text-pink-600 bg-pink-100 px-1.5 py-0.5 rounded-md">too small</span> for optimal use.</>
              ) : (
                <>Your screen is currently <span className="font-semibold text-pink-600 bg-pink-100 px-1.5 py-0.5 rounded-md">too narrow</span> for optimal use.</>
              )}
            </p>
            
            {/* Enhanced action suggestion - Consistent styling for all messages */}
            <div className="rounded-lg border-2 p-3 transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 shadow-sm shadow-amber-200/50">
              <div className="flex items-center space-x-2">
                <div className="text-lg text-amber-600">
                  🔄
                </div>
                <p className="font-bold text-sm text-amber-800 text-left">
                  {currentMessage.action}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 