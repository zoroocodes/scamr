'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import EmojiPicker from 'emoji-picker-react';
import { Thread, TopThread } from '@/types';
import io, { Socket } from 'socket.io-client';

let socket: Socket | undefined;

// Utility function to extract URLs from text
const extractUrls = (text: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return (text.match(urlRegex) || []).filter((url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });
};

// Render function for text with clickable links
const renderTextWithLinksAndEmojis = (text: string) => {
  const parts = text.split(/(https?:\/\/[^\s]+|\s+)/g);
  
  return parts.map((part, index) => {
    try {
      new URL(part);
      return (
        <a 
          key={index} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-500 hover:underline break-all"
        >
          {part}
        </a>
      );
    } catch {
      return part;
    }
  });
};

export default function HomePage() {
  const [threads, setThreads] = useState<any[]>([]);
  const [topThreads, setTopThreads] = useState<any[]>([]);
  const [newPost, setNewPost] = useState({
    ca: '',
    message: '',
    twitter: '',
    gif: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [gifSearch, setGifSearch] = useState('');
  const [gifs, setGifs] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    const socketInitializer = async () => {
      socket = io();

      socket.on('connect', () => {
        console.log('Connected to socket');
      });

      socket.on('newPost', (post: any) => {
        setThreads(prevThreads => [post, ...prevThreads]);
      });
    };

    socketInitializer();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Fetch threads and top threads
  const fetchThreads = useCallback(async () => {
    try {
      // Fetch recent threads with optional search
      const threadsResponse = await fetch(`/api/ca-posts${searchTerm ? `?search=${searchTerm}` : ''}`);
      const threadsData = await threadsResponse.json();
      setThreads(Array.isArray(threadsData) ? threadsData : []);

      // Fetch top threads
      const topResponse = await fetch('/api/threads/top');
      const topData = await topResponse.json();
      setTopThreads(Array.isArray(topData) ? topData : []);
    } catch (error) {
      console.error('Error fetching threads:', error);
      setThreads([]);
      setTopThreads([]);
    }
  }, [searchTerm]);

  // Tenor API GIF search
  const searchGifs = async () => {
    if (!gifSearch) return;

    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(gifSearch)}&key=${process.env.NEXT_PUBLIC_TENOR_API_KEY}&limit=10`
      );
      const data = await response.json();
      
      const gifUrls = data.results.map((gif: any) => 
        gif.media_formats.gif.url
      );
      
      setGifs(gifUrls);
    } catch (error) {
      console.error('Error searching GIFs:', error);
    }
  };

  // Emoji picker handler
  const addEmoji = (emojiData: any) => {
    const emoji = emojiData.emoji;
    setNewPost(prev => ({
      ...prev,
      message: prev.message + emoji
    }));
    setShowEmojiPicker(false);
  };

  // Submit post handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const extractedLinks = extractUrls(newPost.message);

      const postData = {
        ...newPost,
        link: extractedLinks.length > 0 ? extractedLinks[0] : null,
      };

      const response = await fetch('/api/ca-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to post message');
      }
      
      // Emit the new post through socket
      if (socket) {
        socket.emit('newPost', data);
      } else {
        console.error('Socket is not initialized');
      }

      // Reset form
      setNewPost({
        ca: '',
        message: '',
        twitter: '',
        gif: '',
      });
      setGifs([]);
      setGifSearch('');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to post message: ' + (error instanceof Error ? error.message : String(error)));
    }
  }, [newPost]);

  // Fetch threads on component mount and when search term changes
  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  return (
    <div className="min-h-screen bg-[#1A1A1B] text-[#c5c8c9] font-mono">
      {/* Top Bar */}
      <div className="bg-[#262627] p-4 border-b border-[#343536] text-center">
        <h1 className="text-xl font-bold text-[#c5c8c9]">Crypto Threads</h1>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto mt-4 p-2">
        {/* Search Box */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#262627] p-2 border-t border-[#343536]">
          <input
            type="text"
            placeholder="Search contract addresses or messages..."
            className="w-full max-w-3xl mx-auto block p-2 bg-[#1A1A1B] border border-[#343536] text-[#c5c8c9] focus:outline-none focus:border-[#545456]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Post Form */}
        <form onSubmit={handleSubmit} className="bg-[#262627] p-4 mb-4 border border-[#343536]">
          <input
            type="text"
            placeholder="Contract Address"
            className="w-full mb-2 p-2 bg-[#1A1A1B] border border-[#343536] text-[#c5c8c9] focus:outline-none focus:border-[#545456]"
            value={newPost.ca}
            onChange={(e) => setNewPost({...newPost, ca: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Twitter (optional)"
            className="w-full mb-2 p-2 bg-[#1A1A1B] border border-[#343536] text-[#c5c8c9] focus:outline-none focus:border-[#545456]"
            value={newPost.twitter}
            onChange={(e) => setNewPost({...newPost, twitter: e.target.value})}
          />
          
          {/* GIF Search */}
          <div className="flex mb-2">
            <input
              type="text"
              placeholder="Search GIFs (optional)"
              className="flex-grow p-2 bg-[#1A1A1B] border border-[#343536] text-[#c5c8c9] focus:outline-none focus:border-[#545456]"
              value={gifSearch}
              onChange={(e) => setGifSearch(e.target.value)}
            />
            <button
              type="button"
              onClick={searchGifs}
              className="ml-2 px-4 bg-[#2F2F30] hover:bg-[#363637] text-[#c5c8c9]"
            >
              Search
            </button>
          </div>

          {/* GIF Results */}
          {gifs.length > 0 && (
            <div className="flex overflow-x-auto space-x-2 mb-2 pb-2">
              {gifs.map((gif, index) => (
                <Image 
                  key={`${gif}-${index}`}
                  src={gif} 
                  alt={`GIF ${index}`}
                  width={100}
                  height={100}
                  unoptimized
                  className={`h-20 w-auto cursor-pointer ${newPost.gif === gif ? 'border-2 border-blue-500' : ''}`}
                  onClick={() => setNewPost({...newPost, gif})}
                />
              ))}
            </div>
          )}

          {/* Textarea with Emoji Picker */}
          <div className="relative">
            <textarea
              placeholder="Your message... (URLs and emojis supported)"
              className="w-full mb-2 p-2 bg-[#1A1A1B] border border-[#343536] text-[#c5c8c9] focus:outline-none focus:border-[#545456]"
              rows={3}
              value={newPost.message}
              onChange={(e) => setNewPost({...newPost, message: e.target.value})}
              required
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute top-2 right-2 text-2xl"
            >
              😊
            </button>
            
            {showEmojiPicker && (
              <div className="absolute z-10 right-0 mt-1">
                <EmojiPicker 
                  onEmojiClick={addEmoji}
                  theme="dark"
                />
              </div>
            )}
          </div>
          
          <button 
            type="submit"
            className="bg-[#2F2F30] hover:bg-[#363637] text-[#c5c8c9] px-4 py-2 w-full transition-colors"
          >
            Post
          </button>
        </form>

        {/* Top Threads Section */}
        <div className="bg-[#262627] border border-[#343536] mb-4">
          <div className="bg-[#1d1d1e] p-2 border-b border-[#343536] flex justify-between items-center">
            <h2 className="text-sm font-semibold text-[#737577] uppercase tracking-wider">
              Top Threads
            </h2>
            <Link 
              href="/all-threads" 
              className="text-xs text-[#737577] hover:text-white transition-colors"
            >
              View All
            </Link>
          </div>
          <div className="p-2 space-y-2">
            {topThreads.map((thread) => (
              <Link 
                key={`${thread.ca}-${thread.postCount}`}
                href={`/ca/${encodeURIComponent(thread.ca)}`}
                className="block hover:bg-[#1A1A1B] p-2 rounded transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs text-[#789922] truncate block">
                      {thread.ca}
                    </span>
                    <span className="text-[#737577] text-xs">
                      {thread.postCount} posts
                    </span>
                  </div>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 text-[#737577]" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M14 5l7 7m0 0l-7 7m7-7H3" 
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Threads */}
        <div className="space-y-8 mb-16">
          {Array.isArray(threads) && threads.map((thread) => (
            <div key={`${thread.id}-${thread.ca}-${thread.timestamp}`} className="bg-[#262627] border border-[#343536]">
              <div className="bg-[#1d1d1e] p-2 border-b border-[#343536]">
                <span className="text-[#789922] font-bold">&gt;{thread.ca}</span>
                <Link 
                  href={`/ca/${encodeURIComponent(thread.ca)}`}
                  className="ml-2 text-[#737577] hover:underline"
                >
                  View Thread
                </Link>
              </div>
              
              <div className="p-2 space-y-2">
                <div className="p-2 border-b border-[#343536]">
                  <div className="text-[#737577] text-sm mb-1">
                    {new Date(thread.timestamp).toLocaleString()} No.{thread.id}
                    {thread.twitter && (
                      <span className="ml-2 text-[#8A2BE2]">@{thread.twitter}</span>
                    )}
                    {thread.link && (
                      <a 
                        href={thread.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-500 hover:underline"
                      >
                        Link
                      </a>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap break-all">
                    {renderTextWithLinksAndEmojis(thread.message)}
                  </div>
                  {thread.gif && (
                    <Image 
                      src={thread.gif} 
                      alt="Post GIF" 
                      width={500}
                      height={300}
                      unoptimized
                      className="max-w-full h-auto mt-2"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}