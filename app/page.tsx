'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  const [tokenPrice, setTokenPrice] = useState('$0.027');
  const [tokenSupply, setTokenSupply] = useState('100,000,000');
  const [copied, setCopied] = useState(false);
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  
  const contractAddress = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS || 'CA COMING SOON';
  const pumpFunUrl = process.env.NEXT_PUBLIC_PUMP_FUN_URL || 'https://pump.fun';
  
  const copyToClipboard = () => {
    if (contractAddress && contractAddress !== 'CA COMING SOON') {
      navigator.clipboard.writeText(contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleJoystickMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isJoystickActive) {
      // Limit joystick movement to a small range
      const maxMove = 5;
      const rect = e.currentTarget.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const x = Math.max(-maxMove, Math.min(maxMove, (e.clientX - rect.left - centerX) / 3));
      const y = Math.max(-maxMove, Math.min(maxMove, (e.clientY - rect.top - centerY) / 3));
      
      setJoystickPosition({ x, y });
    }
  };
  
  const resetJoystick = () => {
    setJoystickPosition({ x: 0, y: 0 });
    setIsJoystickActive(false);
  };
  
  return (
    <div className="arcade-wrapper h-screen flex items-center justify-center bg-black p-2 overflow-hidden">
      {/* Entire arcade cabinet */}
      <div className="arcade-cabinet relative h-full max-h-[95vh] flex flex-col max-w-5xl w-full mx-auto">
        {/* Top marquee */}
        <div className="marquee bg-gradient-to-r from-purple-900 via-purple-700 to-purple-900 rounded-t-xl p-2 border-b-8 border-gray-900 relative overflow-hidden flex-shrink-0">
          {/* Marquee lights */}
          <div className="absolute inset-x-0 top-0 h-1 flex">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="h-1 flex-1 arcade-light"></div>
            ))}
          </div>
          
          <h1 className="text-center font-heading text-4xl md:text-5xl lg:text-6xl tracking-widest text-white drop-shadow-glow">
            ARCADE
          </h1>
          <p className="text-center font-heading text-sm md:text-base text-yellow-300">
            AI-POWERED GAME MAKER
          </p>
        </div>
        
        {/* Cabinet body */}
        <div className="cabinet-body relative flex-grow bg-gradient-to-b from-gray-800 to-gray-900 p-3 md:p-4 rounded-b-xl border-x-8 border-b-8 border-gray-900 flex flex-col">
          {/* Inset screen bezel */}
          <div className="screen-bezel bg-black p-2 md:p-3 rounded-lg border-8 border-gray-800 shadow-inset flex-grow flex flex-col">
            {/* The actual screen */}
            <div className="screen-inner relative bg-black rounded overflow-hidden flex-grow flex flex-col">
              {/* CRT effect overlay */}
              <div className="crt-overlay absolute inset-0 pointer-events-none z-20"></div>
              
              {/* Screen content */}
              <div className="screen-content relative z-10 h-full p-3 md:p-4 arcade-text-glow grid-bg flex flex-col">
                {/* Top arcade-style score display for CA and Twitter */}
                <div className="arcade-display-bar flex justify-between items-center mb-3">
                  {/* Left side - CA display */}
                  <div 
                    onClick={copyToClipboard}
                    className="token-display bg-black border-2 border-cyan-800 rounded px-3 py-1 flex items-center cursor-pointer hover:border-cyan-500 transition-colors"
                    title={contractAddress !== 'CA COMING SOON' ? "Click to copy" : ""}
                  >
                    <span className="pixel-text text-yellow-300 text-xs md:text-sm mr-2">$ARCADE:</span>
                    <span className={`text-green-400 text-xs md:text-sm font-mono ${contractAddress !== 'CA COMING SOON' ? 'hover:text-green-300' : ''}`}>
                      {contractAddress}
                    </span>
                    {copied && (
                      <span className="text-green-500 ml-1 animate-pulse">✓</span>
                    )}
                  </div>
                  
                  {/* Right side - Twitter link */}
                  <a
                    href="https://twitter.com/arcade_platform"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link bg-black border-2 border-blue-800 rounded px-3 py-1 flex items-center hover:border-blue-500 transition-colors"
                  >
                    <span className="pixel-text text-blue-400 text-xs md:text-sm">@arcade</span>
                    <svg className="w-3 h-3 ml-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                    </svg>
                  </a>
                </div>
                
                {/* Main content - flex-grow to take available space */}
                <div className="text-center flex-grow flex flex-col justify-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="intro-text mb-6"
                  >
                    <div className="pixel-text text-2xl md:text-3xl lg:text-4xl text-cyan-300 mb-3 glow-text">CREATE. PLAY. EARN.</div>
                    <p className="text-green-400 text-base md:text-xl lg:text-2xl max-w-xl mx-auto font-bold">
                      CREATE AI-POWERED ARCADE GAMES IN SECONDS
                    </p>
                  </motion.div>
                  
                  {/* Features highlight */}
                  <div className="hidden md:block mb-4">
                    <p className="text-purple-300 text-lg">Powered by advanced AI & blockchain technology</p>
                    <div className="flex justify-center space-x-4 mt-2">
                      <span className="bg-gray-800 rounded-full px-3 py-1 text-yellow-300">No-Code</span>
                      <span className="bg-gray-800 rounded-full px-3 py-1 text-green-300">Fast Generation</span>
                      <span className="bg-gray-800 rounded-full px-3 py-1 text-pink-300">Customizable</span>
                    </div>
                  </div>
                                    
                  {/* Game description */}
                  <motion.div 
                    className="game-steps flex flex-col md:flex-row gap-4 justify-between max-w-3xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <div className="game-step bg-black border-2 border-cyan-800 rounded-lg p-3 flex-1 hover:border-cyan-500 transition-colors">
                      <h3 className="text-pink-500 text-base md:text-lg font-bold mb-1">DESCRIBE</h3>
                      <p className="text-green-400 text-sm md:text-base">Type your game idea</p>
                    </div>
                    <div className="game-step bg-black border-2 border-cyan-800 rounded-lg p-3 flex-1 hover:border-yellow-500 transition-colors">
                      <h3 className="text-yellow-400 text-base md:text-lg font-bold mb-1">GENERATE</h3>
                      <p className="text-green-400 text-sm md:text-base">AI builds your game</p>
                    </div>
                    <div className="game-step bg-black border-2 border-cyan-800 rounded-lg p-3 flex-1 hover:border-cyan-500 transition-colors">
                      <h3 className="text-cyan-400 text-base md:text-lg font-bold mb-1">PLAY & SHARE</h3>
                      <p className="text-green-400 text-sm md:text-base">Ready in seconds</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Control panel */}
          <div className="control-panel mt-3 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-3 rounded-lg border-t-4 border-gray-700 flex-shrink-0">
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8">
              {/* Joystick - now interactive */}
              <div className="joystick-area hidden md:block">
                <div 
                  className="joystick-base w-16 h-16 rounded-full bg-black border-4 border-gray-700 flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.6)] cursor-grab active:cursor-grabbing relative overflow-hidden"
                  onMouseDown={() => setIsJoystickActive(true)}
                  onMouseMove={handleJoystickMove}
                  onMouseUp={resetJoystick}
                  onMouseLeave={resetJoystick}
                >
                  {/* Directional guides */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                    <div className="w-0.5 h-full bg-gray-500 absolute"></div>
                    <div className="w-full h-0.5 bg-gray-500 absolute"></div>
                  </div>
                  
                  {/* Joystick handle */}
                  <div 
                    className="joystick w-8 h-12 bg-red-600 rounded-full shadow-lg relative transition-transform"
                    style={{ 
                      transform: `translate(${joystickPosition.x}px, ${joystickPosition.y}px) translateY(-4px)`
                    }}
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-5 bg-red-700 rounded-full"></div>
                  </div>
                </div>
                <div className="text-center text-xs text-gray-400 mt-1">DRAG ME</div>
              </div>
              
              {/* Action buttons */}
              <div className="action-buttons flex space-x-4">
                <Link href="/create">
                  <div className="arcade-btn bg-red-600 hover:bg-red-500 active:translate-y-1 active:shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3)]">
                    <span className="text-lg font-bold">CREATE</span>
                  </div>
                </Link>
                
                <Link href="/explore">
                  <div className="arcade-btn bg-blue-600 hover:bg-blue-500 active:translate-y-1 active:shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3)]">
                    <span className="text-lg font-bold">PLAY</span>
                  </div>
                </Link>
              </div>
              
              {/* Coin slot */}
              <div className="coin-slot hidden md:flex flex-col items-center">
                <a 
                  href={pumpFunUrl}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="w-12 h-16 bg-gray-900 rounded-sm border-2 border-gray-700 flex flex-col items-center justify-center relative hover:bg-gray-800 transition-colors"
                >
                  <div className="absolute top-2 w-8 h-1 bg-black rounded-sm"></div>
                  <div className="text-yellow-400 text-xs mt-3 animate-pulse">INSERT</div>
                  <div className="text-yellow-400 text-xs animate-pulse">COIN</div>
                </a>
              </div>
            </div>
          </div>
          
          {/* Cabinet decorations - side art */}
          <div className="absolute -left-4 md:-left-8 top-1/4 bottom-1/4 w-4 md:w-8 bg-gray-900 opacity-50"></div>
          <div className="absolute -right-4 md:-right-8 top-1/4 bottom-1/4 w-4 md:w-8 bg-gray-900 opacity-50"></div>
        </div>
      </div>
    </div>
  );
}
