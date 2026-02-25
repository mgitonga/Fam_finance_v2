/**
 * Database type definitions for Supabase.
 *
 * This is a placeholder file. After deploying the database schema,
 * regenerate this file with:
 *
 *   pnpm exec supabase gen types typescript --project-id <project-id> > src/types/database.ts
 *
 * For local development:
 *   pnpm exec supabase gen types typescript --local > src/types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'contributor';
          household_id: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: 'admin' | 'contributor';
          household_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'contributor';
          household_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      households: {
        Row: {
          id: string;
          name: string;
          primary_currency: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          primary_currency?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          primary_currency?: string;
          created_at?: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          type: 'bank' | 'mobile_money' | 'cash' | 'credit_card' | 'other';
          balance: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          type: 'bank' | 'mobile_money' | 'cash' | 'credit_card' | 'other';
          balance?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          type?: 'bank' | 'mobile_money' | 'cash' | 'credit_card' | 'other';
          balance?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          parent_id: string | null;
          icon: string | null;
          color: string | null;
          type: 'expense' | 'income' | 'both';
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          parent_id?: string | null;
          icon?: string | null;
          color?: string | null;
          type?: 'expense' | 'income' | 'both';
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          parent_id?: string | null;
          icon?: string | null;
          color?: string | null;
          type?: 'expense' | 'income' | 'both';
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          household_id: string;
          account_id: string;
          category_id: string;
          user_id: string;
          type: 'income' | 'expense';
          amount: number;
          date: string;
          description: string | null;
          merchant: string | null;
          payment_method: 'cash' | 'card' | 'mobile_money' | 'bank_transfer' | 'other' | null;
          tags: string[] | null;
          receipt_url: string | null;
          is_recurring: boolean;
          recurring_id: string | null;
          split_with: string | null;
          split_ratio: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          account_id: string;
          category_id: string;
          user_id: string;
          type: 'income' | 'expense';
          amount: number;
          date: string;
          description?: string | null;
          merchant?: string | null;
          payment_method?: 'cash' | 'card' | 'mobile_money' | 'bank_transfer' | 'other' | null;
          tags?: string[] | null;
          receipt_url?: string | null;
          is_recurring?: boolean;
          recurring_id?: string | null;
          split_with?: string | null;
          split_ratio?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          account_id?: string;
          category_id?: string;
          user_id?: string;
          type?: 'income' | 'expense';
          amount?: number;
          date?: string;
          description?: string | null;
          merchant?: string | null;
          payment_method?: 'cash' | 'card' | 'mobile_money' | 'bank_transfer' | 'other' | null;
          tags?: string[] | null;
          receipt_url?: string | null;
          is_recurring?: boolean;
          recurring_id?: string | null;
          split_with?: string | null;
          split_ratio?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          household_id: string;
          category_id: string;
          amount: number;
          month: number;
          year: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          category_id: string;
          amount: number;
          month: number;
          year: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          category_id?: string;
          amount?: number;
          month?: number;
          year?: number;
          created_at?: string;
        };
      };
      overall_budgets: {
        Row: {
          id: string;
          household_id: string;
          amount: number;
          month: number;
          year: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          amount: number;
          month: number;
          year: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          amount?: number;
          month?: number;
          year?: number;
          created_at?: string;
        };
      };
      recurring_transactions: {
        Row: {
          id: string;
          household_id: string;
          category_id: string;
          account_id: string;
          type: 'income' | 'expense';
          amount: number;
          frequency: 'monthly';
          day_of_month: number;
          next_due_date: string;
          description: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          category_id: string;
          account_id: string;
          type: 'income' | 'expense';
          amount: number;
          frequency?: 'monthly';
          day_of_month: number;
          next_due_date: string;
          description: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          category_id?: string;
          account_id?: string;
          type?: 'income' | 'expense';
          amount?: number;
          frequency?: 'monthly';
          day_of_month?: number;
          next_due_date?: string;
          description?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      savings_goals: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          target_amount: number;
          current_amount: number;
          target_date: string;
          icon: string | null;
          color: string | null;
          is_completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          target_amount: number;
          current_amount?: number;
          target_date: string;
          icon?: string | null;
          color?: string | null;
          is_completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          target_amount?: number;
          current_amount?: number;
          target_date?: string;
          icon?: string | null;
          color?: string | null;
          is_completed?: boolean;
          created_at?: string;
        };
      };
      goal_contributions: {
        Row: {
          id: string;
          goal_id: string;
          user_id: string;
          amount: number;
          date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          user_id: string;
          amount: number;
          date: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          goal_id?: string;
          user_id?: string;
          amount?: number;
          date?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      debts: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          type:
            | 'mortgage'
            | 'car_loan'
            | 'personal_loan'
            | 'credit_card'
            | 'student_loan'
            | 'other';
          original_amount: number;
          outstanding_balance: number;
          interest_rate: number | null;
          minimum_payment: number | null;
          payment_day: number | null;
          start_date: string;
          projected_payoff_date: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          type:
            | 'mortgage'
            | 'car_loan'
            | 'personal_loan'
            | 'credit_card'
            | 'student_loan'
            | 'other';
          original_amount: number;
          outstanding_balance: number;
          interest_rate?: number | null;
          minimum_payment?: number | null;
          payment_day?: number | null;
          start_date: string;
          projected_payoff_date?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          type?:
            | 'mortgage'
            | 'car_loan'
            | 'personal_loan'
            | 'credit_card'
            | 'student_loan'
            | 'other';
          original_amount?: number;
          outstanding_balance?: number;
          interest_rate?: number | null;
          minimum_payment?: number | null;
          payment_day?: number | null;
          start_date?: string;
          projected_payoff_date?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      bill_reminders: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          amount: number | null;
          due_day: number;
          category_id: string | null;
          reminder_days_before: number;
          notification_method: 'in_app' | 'email' | 'both';
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          amount?: number | null;
          due_day: number;
          category_id?: string | null;
          reminder_days_before?: number;
          notification_method?: 'in_app' | 'email' | 'both';
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          amount?: number | null;
          due_day?: number;
          category_id?: string | null;
          reminder_days_before?: number;
          notification_method?: 'in_app' | 'email' | 'both';
          is_active?: boolean;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          type:
            | 'bill_reminder'
            | 'budget_warning'
            | 'budget_exceeded'
            | 'goal_milestone'
            | 'recurring_due'
            | 'system';
          title: string;
          message: string;
          is_read: boolean;
          action_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          type:
            | 'bill_reminder'
            | 'budget_warning'
            | 'budget_exceeded'
            | 'goal_milestone'
            | 'recurring_due'
            | 'system';
          title: string;
          message: string;
          is_read?: boolean;
          action_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          user_id?: string;
          type?:
            | 'bill_reminder'
            | 'budget_warning'
            | 'budget_exceeded'
            | 'goal_milestone'
            | 'recurring_due'
            | 'system';
          title?: string;
          message?: string;
          is_read?: boolean;
          action_url?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
