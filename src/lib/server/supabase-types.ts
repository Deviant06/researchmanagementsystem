export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "ADMIN" | "STUDENT";
          name: string;
          email: string;
          group_id: string | null;
          email_alerts: boolean;
          created_at: string;
          updated_at: string;
          last_login_at: string | null;
        };
        Insert: {
          id: string;
          role?: "ADMIN" | "STUDENT";
          name: string;
          email: string;
          group_id?: string | null;
          email_alerts?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
        };
        Update: {
          role?: "ADMIN" | "STUDENT";
          name?: string;
          email?: string;
          group_id?: string | null;
          email_alerts?: boolean;
          updated_at?: string;
          last_login_at?: string | null;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      stages: {
        Row: {
          id: string;
          group_id: string;
          stage_key:
            | "title-proposal"
            | "chapter-1"
            | "chapter-2"
            | "chapter-3"
            | "data-gathering"
            | "data-analysis"
            | "chapter-4-5"
            | "final-defense";
          status:
            | "NOT_STARTED"
            | "SUBMITTED"
            | "UNDER_REVIEW"
            | "REVISED"
            | "APPROVED";
          due_date: string;
          updated_at: string;
          last_submission_at: string | null;
          last_reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          stage_key: Database["public"]["Tables"]["stages"]["Row"]["stage_key"];
          status?: Database["public"]["Tables"]["stages"]["Row"]["status"];
          due_date: string;
          updated_at?: string;
          last_submission_at?: string | null;
          last_reviewed_at?: string | null;
        };
        Update: {
          status?: Database["public"]["Tables"]["stages"]["Row"]["status"];
          due_date?: string;
          updated_at?: string;
          last_submission_at?: string | null;
          last_reviewed_at?: string | null;
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          group_id: string;
          stage_key: Database["public"]["Tables"]["stages"]["Row"]["stage_key"];
          version: number;
          submission_type: "FILE" | "TEXT";
          file_name: string | null;
          file_path: string | null;
          content: string | null;
          uploaded_by_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          stage_key: Database["public"]["Tables"]["submissions"]["Row"]["stage_key"];
          version: number;
          submission_type: "FILE" | "TEXT";
          file_name?: string | null;
          file_path?: string | null;
          content?: string | null;
          uploaded_by_user_id: string;
          created_at?: string;
        };
        Update: {
          content?: string | null;
          file_name?: string | null;
          file_path?: string | null;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          group_id: string;
          stage_key: Database["public"]["Tables"]["stages"]["Row"]["stage_key"];
          section: string;
          category: "MAJOR_REVISION" | "MINOR_REVISION" | "APPROVED";
          text: string;
          created_by_user_id: string;
          created_at: string;
          addressed_at: string | null;
          addressed_by_user_id: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          stage_key: Database["public"]["Tables"]["comments"]["Row"]["stage_key"];
          section: string;
          category: Database["public"]["Tables"]["comments"]["Row"]["category"];
          text: string;
          created_by_user_id: string;
          created_at?: string;
          addressed_at?: string | null;
          addressed_by_user_id?: string | null;
        };
        Update: {
          section?: string;
          category?: Database["public"]["Tables"]["comments"]["Row"]["category"];
          text?: string;
          addressed_at?: string | null;
          addressed_by_user_id?: string | null;
        };
        Relationships: [];
      };
      comment_replies: {
        Row: {
          id: string;
          comment_id: string;
          user_id: string;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          comment_id: string;
          user_id: string;
          text: string;
          created_at?: string;
        };
        Update: {
          text?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          group_id: string;
          stage_key: Database["public"]["Tables"]["stages"]["Row"]["stage_key"];
          comment_id: string;
          description: string;
          status: "PENDING" | "COMPLETED";
          student_response: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          stage_key: Database["public"]["Tables"]["tasks"]["Row"]["stage_key"];
          comment_id: string;
          description: string;
          status?: "PENDING" | "COMPLETED";
          student_response?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          description?: string;
          status?: "PENDING" | "COMPLETED";
          student_response?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      resources: {
        Row: {
          id: string;
          category: "TEMPLATE" | "RUBRIC" | "SAMPLE_PAPER" | "VIDEO_GUIDE";
          audience: "ALL" | "ADMIN_ONLY";
          title: string;
          description: string;
          file_name: string | null;
          file_path: string | null;
          external_url: string | null;
          uploaded_by_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          category: Database["public"]["Tables"]["resources"]["Row"]["category"];
          audience?: Database["public"]["Tables"]["resources"]["Row"]["audience"];
          title: string;
          description: string;
          file_name?: string | null;
          file_path?: string | null;
          external_url?: string | null;
          uploaded_by_user_id: string;
          created_at?: string;
        };
        Update: {
          category?: Database["public"]["Tables"]["resources"]["Row"]["category"];
          audience?: Database["public"]["Tables"]["resources"]["Row"]["audience"];
          title?: string;
          description?: string;
          file_name?: string | null;
          file_path?: string | null;
          external_url?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          type: "FEEDBACK" | "REVISION_TASK" | "RESOURCE" | "STATUS" | "SUBMISSION";
          title: string;
          message: string;
          group_id: string | null;
          stage_key: Database["public"]["Tables"]["stages"]["Row"]["stage_key"] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: Database["public"]["Tables"]["notifications"]["Row"]["type"];
          title: string;
          message: string;
          group_id?: string | null;
          stage_key?: Database["public"]["Tables"]["notifications"]["Row"]["stage_key"];
          created_at?: string;
        };
        Update: {
          title?: string;
          message?: string;
        };
        Relationships: [];
      };
      notification_recipients: {
        Row: {
          notification_id: string;
          user_id: string;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          notification_id: string;
          user_id: string;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          read_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      role_type: "ADMIN" | "STUDENT";
      stage_key_type:
        | "title-proposal"
        | "chapter-1"
        | "chapter-2"
        | "chapter-3"
        | "data-gathering"
        | "data-analysis"
        | "chapter-4-5"
        | "final-defense";
      stage_status_type:
        | "NOT_STARTED"
        | "SUBMITTED"
        | "UNDER_REVIEW"
        | "REVISED"
        | "APPROVED";
      submission_type: "FILE" | "TEXT";
      comment_category_type: "MAJOR_REVISION" | "MINOR_REVISION" | "APPROVED";
      task_status_type: "PENDING" | "COMPLETED";
      resource_category_type:
        | "TEMPLATE"
        | "RUBRIC"
        | "SAMPLE_PAPER"
        | "VIDEO_GUIDE";
      resource_audience_type: "ALL" | "ADMIN_ONLY";
      notification_type:
        | "FEEDBACK"
        | "REVISION_TASK"
        | "RESOURCE"
        | "STATUS"
        | "SUBMISSION";
    };
    CompositeTypes: Record<string, never>;
  };
}
