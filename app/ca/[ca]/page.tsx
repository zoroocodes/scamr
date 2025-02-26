'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import io, { Socket } from 'socket.io-client';

// Dynamically import EmojiPicker to prevent SSR issues
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { 
  ssr: false 
});

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

// Safe date formatting to avoid hydration issues
const formatDate = (timestamp: string | number | Date) => {
  const date = new Date(timestamp);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')} ${
    String(date.getUTCHours()).padStart(2, '0')
  }:${String(date.getUTCMinutes()).padStart(2, '0')}`;
};

let socket: Socket | undefined;

export default function CAThread() {
  const params = useParams();
  const ca = decodeURIComponent(params.ca as string);
  
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState({
    ca: ca,
    message: '',
    twitter: '',
    link: '',
    gif: '',
  });
  const [gifSearch, setGifSearch] = useState('');
  const [gifs, setGifs] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    const socketInitializer = async () => {
      socket = io();

      socket.on('connect', () => {
        console.log('Connected to socket in thread page');
      });

      socket.on('newPost', (post: any) => {
        if (post.ca === ca) {
          setPosts(prevPosts => {
            // Prevent duplicates
            const isExisting = prevPosts.some(p => 
              p.id === post.id || 
              (p.tempId && p.tempId === post.tempId)
            );
            
            if (isExisting) return prevPosts;
            return [post, ...prevPosts];
          });
        }
      });
    };

    socketInitializer();

    // Fetch initial posts
    const fetchPosts = async () => {
      try {
        const response = await fetch(`/api/ca-posts?ca=${encodeURIComponent(ca)}`);
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };
    fetchPosts();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [ca]);

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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const extractedLinks = extractUrls(newPost.message);
      const links = newPost.link 
        ? [...extractedLinks, newPost.link] 
        : extractedLinks;

      // Generate a temporary ID to prevent duplicates
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const postData = {
        ...newPost,
        tempId, // Add temporary ID
        link: links.length > 0 ? links[0] : null,
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
        socket.emit('newPost', { ...data, tempId });
      } else {
        console.error('Socket is not initialized');
      }

      // Optimistically add the post to the list
      setPosts(prevPosts => {
        const isExisting = prevPosts.some(p => p.id === data.id);
        if (isExisting) return prevPosts;
        return [data, ...prevPosts];
      });

      // Reset form
      setNewPost({
        ca: ca,
        message: '',
        twitter: '',
        link: '',
        gif: '',
      });
      setGifs([]);
      setGifSearch('');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to post message: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1B] text-[#c5c8c9] font-mono">
      {/* Header with Back Button */}
      <div className="bg-[#262627] p-2 border-b border-[#343536] flex items-center">
        <Link 
          href="/" 
          className="mr-4 text-[#c5c8c9] hover:text-white"
        >
          ← Back
        </Link>
        <h1 className="text-xl font-bold">CA Thread: {ca}</h1>
      </div>

      {/* Post Form */}
      <div className="max-w-3xl mx-auto mt-4 p-2">
        <form onSubmit={handleSubmit} className="bg-[#262627] p-4 mb-4 border border-[#343536]">
          <input
            type="text"
            placeholder="Twitter (optional)"
            className="w-full mb-2 p-2 bg-[#1A1A1B] border border-[#343536] text-[#c5c8c9] focus:outline-none focus:border-[#545456]"
            value={newPost.twitter}
            onChange={(e) => setNewPost({...newPost, twitter: e.target.value})}
          />
          <input
            type="text"
            placeholder="Manual Link (optional)"
            className="w-full mb-2 p-2 bg-[#1A1A1B] border border-[#343536] text-[#c5c8c9] focus:outline-none focus:border-[#545456]"
            value={newPost.link}
            onChange={(e) => setNewPost({...newPost, link: e.target.value})}
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

        {/* Posts */}
        <div className="space-y-4">
          {posts.map((post, index) => (
            <div 
              key={`${post.id || post.tempId || 'unknown'}-${index}`} 
              className="bg-[#262627] p-4 border border-[#343536]"
            >
              <div className="text-[#737577] text-sm mb-2">
                {formatDate(post.timestamp)} No.{post.id || index}
                {post.twitter && (
                  <span className="ml-2 text-[#8A2BE2]">@{post.twitter}</span>
                )}
                {post.link && (
                  <a 
                    href={post.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-500 hover:underline"
                  >
                    Link
                  </a>
                )}
              </div>
              <div className="whitespace-pre-wrap break-all">
                {renderTextWithLinksAndEmojis(post.message)}
              </div>
              {post.gif && (
                <Image 
                  src={post.gif} 
                  alt="Post GIF" 
                  width={500}
                  height={300}
                  unoptimized
                  className="max-w-full h-auto mt-2"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}