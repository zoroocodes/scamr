export interface Thread {
    id: number;
    ca: string;
    message: string;
    twitter?: string | null;
    link?: string | null;
    gif?: string | null;
    timestamp: Date;
  }
  
  export interface TopThread {
    ca: string;
    postCount: number;
  }