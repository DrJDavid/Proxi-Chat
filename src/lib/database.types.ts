export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string;
          content: string;
          metadata: {
            filename?: string;
            chunk?: number;
            [key: string]: any;
          };
          embedding: number[];
          created_at: string;
        };
        Insert: {
          content: string;
          metadata?: {
            filename?: string;
            chunk?: number;
            [key: string]: any;
          };
          embedding: number[];
        };
        Update: {
          content?: string;
          metadata?: {
            filename?: string;
            chunk?: number;
            [key: string]: any;
          };
          embedding?: number[];
        };
      };
      users: {
        Row: {
          id: string;
          username: string;
          email: string;
          created_at: string;
        };
        Insert: {
          username: string;
          email: string;
        };
        Update: {
          username?: string;
          email?: string;
        };
      };
    };
    Functions: {
      create_documents_table: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      create_match_documents_function: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      match_documents: {
        Args: {
          query_embedding: number[];
          match_count?: number;
          similarity_threshold?: number;
        };
        Returns: Array<{
          content: string;
          metadata: {
            filename?: string;
            chunk?: number;
            [key: string]: any;
          };
          similarity: number;
        }>;
      };
    };
  };
} 