'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Thread } from '@/types'; // Ensure this import path is correct

export default function CAThreadPage() {
  const params = useParams();
  
  // Join the CA parts in case of multiple segments
  const ca = Array.isArray(params.ca) 
    ? decodeURIComponent(params.ca.join('/'))
    : decodeURIComponent(params.ca as string);

  const [posts, setPosts] = useState<Thread[]>([]);

  // Fetch posts for this CA
  const fetchPosts = useCallback(async () => {
    try {
      const response = await fetch(`/api/ca-posts?ca=${encodeURIComponent(ca)}`);
      const data: Thread[] = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  }, [ca]);

  useEffect(() => {
    console.log('Current CA:', ca); // Debug log
    fetchPosts();
  }, [ca, fetchPosts]);

  return (
    <div>
      <h1>CA Thread: {ca}</h1>
      {/* Rest of your thread rendering logic */}
      {posts.map((post) => (
        <div key={post.id}>
          {/* Render each post */}
          <p>{post.message}</p>
          {/* Add more post details as needed */}
        </div>
      ))}
    </div>
  );
}