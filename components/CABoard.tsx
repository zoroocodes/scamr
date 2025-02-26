'use client';

import React, { useState, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import Image from 'next/image';


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

// Render function for text with clickable links and emojis
const renderTextWithLinksAndEmojis = (text: string) => {
  // Split text including URLs
  const parts = text.split(/(https?:\/\/[^\s]+|\s+)/g);
  
  return parts.map((part, index) => {
    // Check if it's a URL
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

const CABoard = () => {
  const [threads, setThreads] = useState<{[key: string]: any[]}>({});
  
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

  // Fetch posts function
  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/ca-posts' + (searchTerm ? `?search=${searchTerm}` : ''));
      const data = await response.json();
      
      // Make sure data is an array
      const postsArray = Array.isArray(data) ? data : [];
      
      // Group messages by CA
      const grouped = postsArray.reduce((acc: any, post: any) => {
        if (!acc[post.ca]) {
          acc[post.ca] = [];
        }
        acc[post.ca].push(post);
        return acc;
      }, {});
  
      // Sort messages within each CA by timestamp
      Object.keys(grouped).forEach(ca => {
        grouped[ca].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      });
  
      setThreads(grouped);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setThreads({});  // Set empty object on error
    }
  };

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


  // Click outside handler for emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const emojiPickerElement = document.querySelector('.emoji-picker-react');
      if (emojiPickerElement && !emojiPickerElement.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  // Effect to fetch posts on search term change
  useEffect(() => {
    fetchPosts();
  }, [searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Extract links from the message
      const extractedLinks = extractUrls(newPost.message);

      // Combine manually entered link with extracted links
      const links = newPost.link 
        ? [...extractedLinks, newPost.link] 
        : extractedLinks;

      const postData = {
        ca: newPost.ca,
        message: newPost.message,
        twitter: newPost.twitter || null,
        gif: newPost.gif || null,
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
      
      if (response.ok) {
        fetchPosts(); // Refresh posts after successful submission
        setNewPost({ 
          ca: '', 
          message: '', 
          twitter: '', 
          gif: ''
        });
        setGifs([]); // Clear gif search results
        setGifSearch(''); // Clear gif search input
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to post message: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1B] text-[#c5c8c9] font-mono">
      {/* Header */}
      <div className="bg-[#262627] p-2 text-center border-b border-[#343536]">
        <h1 className="text-xl font-bold">Scamr - Contract Address discussions</h1>
      </div>

      {/* Post Form */}
      <div className="max-w-3xl mx-auto mt-4 p-2">
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
                  key={index} 
                  src={gif} 
                  alt={`GIF ${index}`}
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

        {/* Thread View */}
        <div className="space-y-8 mb-16">
          {Object.entries(threads).map(([ca, posts]) => (
            <div key={ca} className="bg-[#262627] border border-[#343536]">
              {/* Thread Header */}
              <div className="bg-[#1d1d1e] p-2 border-b border-[#343536]">
                <span className="text-[#789922] font-bold">&gt;{ca}</span>
                <span className="text-[#737577] ml-2">({posts.length} posts)</span>
              </div>
              
              {/* Thread Posts */}
              <div className="p-2 space-y-2">
                {posts.map((post) => (
                  <div key={post.id} className="p-2 border-b border-[#343536] last:border-0">
                    <div className="text-[#737577] text-sm mb-1">
                      {new Date(post.timestamp).toLocaleString()} No.{post.id}
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
                        className="max-w-full h-auto mt-2"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search Box */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#262627] p-2 border-t border-[#343536]">
        <input
          type="text"
          placeholder="Search contract address or messages..."
          className="w-full max-w-3xl mx-auto block p-2 bg-[#1A1A1B] border border-[#343536] text-[#c5c8c9] focus:outline-none focus:border-[#545456]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>
  );
};

export default CABoard;