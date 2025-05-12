'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Share2, ThumbsUp, Bookmark, Twitter, Facebook, Linkedin } from 'lucide-react';

export default function ArticleLayout({ children }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Header */}
      <header className={`sticky top-0 z-30 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md' : 'bg-white'
      }`}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/learn" className="flex items-center group">
            <ArrowLeft className="w-5 h-5 mr-2 text-gray-600 group-hover:text-gray-900 transition-all duration-300" />
            <span className="text-gray-600 group-hover:text-gray-900 transition-all duration-300">Back to Learning Hub</span>
          </Link>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button 
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-all duration-300"
              >
                <Share2 className="w-5 h-5" />
              </button>
              
              {showShareMenu && (
                <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-lg py-2 px-3 w-40 z-40">
                  <div className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
                    <Twitter className="w-4 h-4 text-blue-400" />
                    <span className="text-sm">Twitter</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
                    <Facebook className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Facebook</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
                    <Linkedin className="w-4 h-4 text-blue-700" />
                    <span className="text-sm">LinkedIn</span>
                  </div>
                </div>
              )}
            </div>
            <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-all duration-300">
              <ThumbsUp className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-all duration-300">
              <Bookmark className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-8 mt-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <Link href="/learn" className="text-gray-700 hover:text-gray-900 font-medium">
                Back to Learning Hub
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                AgriChain Home
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/register" className="text-gray-600 hover:text-gray-900">
                Sign Up
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Log In
              </Link>
            </div>
          </div>
          <div className="mt-6 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} AgriChain. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
} 