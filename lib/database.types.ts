// Типы для базы данных Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          login: string;
          role: 'parent' | 'child';
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          login: string;
          role: 'parent' | 'child';
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          login?: string;
          role?: 'parent' | 'child';
          created_at?: string;
        };
      };
      task_templates: {
        Row: {
          id: string;
          title: string;
          condition: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          title: string;
          condition?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          condition?: string | null;
          active?: boolean;
          created_at?: string;
        };
      };
      task_template_assignments: {
        Row: {
          id: string;
          task_template_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_template_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_template_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      daily_quotas: {
        Row: {
          id: string;
          user_id: string;
          weekday: number;
          tasks_required: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          weekday: number;
          tasks_required: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          weekday?: number;
          tasks_required?: number;
          created_at?: string;
        };
      };
      task_instances: {
        Row: {
          id: string;
          user_id: string;
          template_id: string;
          date: string;
          status: 'pending' | 'done' | 'moved';
          move_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          template_id: string;
          date: string;
          status?: 'pending' | 'done' | 'moved';
          move_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          template_id?: string;
          date?: string;
          status?: 'pending' | 'done' | 'moved';
          move_count?: number;
          created_at?: string;
        };
      };
      app_state: {
        Row: {
          id: string;
          current_user_id: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          current_user_id?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          current_user_id?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}

