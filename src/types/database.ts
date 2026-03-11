export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number;
          created_at: string;
          household_id: string;
          id: string;
          is_active: boolean;
          name: string;
          type: string;
        };
        Insert: {
          balance?: number;
          created_at?: string;
          household_id: string;
          id?: string;
          is_active?: boolean;
          name: string;
          type: string;
        };
        Update: {
          balance?: number;
          created_at?: string;
          household_id?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'accounts_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
        ];
      };
      dashboard_preferences: {
        Row: {
          user_id: string;
          preferences: Json;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          preferences: Json;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          preferences?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      bill_reminders: {
        Row: {
          amount: number | null;
          category_id: string | null;
          created_at: string;
          due_day: number;
          household_id: string;
          id: string;
          is_active: boolean;
          name: string;
          notification_method: string;
          reminder_days_before: number;
        };
        Insert: {
          amount?: number | null;
          category_id?: string | null;
          created_at?: string;
          due_day: number;
          household_id: string;
          id?: string;
          is_active?: boolean;
          name: string;
          notification_method?: string;
          reminder_days_before?: number;
        };
        Update: {
          amount?: number | null;
          category_id?: string | null;
          created_at?: string;
          due_day?: number;
          household_id?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          notification_method?: string;
          reminder_days_before?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'bill_reminders_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bill_reminders_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
        ];
      };
      budgets: {
        Row: {
          amount: number;
          category_id: string;
          created_at: string;
          household_id: string;
          id: string;
          month: number;
          year: number;
        };
        Insert: {
          amount: number;
          category_id: string;
          created_at?: string;
          household_id: string;
          id?: string;
          month: number;
          year: number;
        };
        Update: {
          amount?: number;
          category_id?: string;
          created_at?: string;
          household_id?: string;
          id?: string;
          month?: number;
          year?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'budgets_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budgets_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
        ];
      };
      categories: {
        Row: {
          color: string | null;
          created_at: string;
          household_id: string;
          icon: string | null;
          id: string;
          is_active: boolean;
          name: string;
          parent_id: string | null;
          sort_order: number;
          type: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          household_id: string;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          parent_id?: string | null;
          sort_order?: number;
          type?: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          household_id?: string;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          parent_id?: string | null;
          sort_order?: number;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'categories_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      debts: {
        Row: {
          created_at: string;
          household_id: string;
          id: string;
          interest_rate: number | null;
          is_active: boolean;
          minimum_payment: number | null;
          name: string;
          original_amount: number;
          outstanding_balance: number;
          payment_day: number | null;
          projected_payoff_date: string | null;
          reminder_days_before: number;
          start_date: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          household_id: string;
          id?: string;
          interest_rate?: number | null;
          is_active?: boolean;
          minimum_payment?: number | null;
          name: string;
          original_amount: number;
          outstanding_balance: number;
          payment_day?: number | null;
          projected_payoff_date?: string | null;
          reminder_days_before?: number;
          start_date: string;
          type: string;
        };
        Update: {
          created_at?: string;
          household_id?: string;
          id?: string;
          interest_rate?: number | null;
          is_active?: boolean;
          minimum_payment?: number | null;
          name?: string;
          original_amount?: number;
          outstanding_balance?: number;
          payment_day?: number | null;
          projected_payoff_date?: string | null;
          reminder_days_before?: number;
          start_date?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'debts_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
        ];
      };
      goal_contributions: {
        Row: {
          amount: number;
          created_at: string;
          date: string;
          goal_id: string;
          id: string;
          notes: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          date: string;
          goal_id: string;
          id?: string;
          notes?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          date?: string;
          goal_id?: string;
          id?: string;
          notes?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'goal_contributions_goal_id_fkey';
            columns: ['goal_id'];
            isOneToOne: false;
            referencedRelation: 'savings_goals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'goal_contributions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      household_invites: {
        Row: {
          accepted_at: string | null;
          cancelled_at: string | null;
          email: string;
          expires_at: string;
          household_id: string;
          id: string;
          invited_at: string;
          invited_by: string;
          name: string;
          role: string;
          status: string;
        };
        Insert: {
          accepted_at?: string | null;
          cancelled_at?: string | null;
          email: string;
          expires_at?: string;
          household_id: string;
          id?: string;
          invited_at?: string;
          invited_by: string;
          name: string;
          role?: string;
          status?: string;
        };
        Update: {
          accepted_at?: string | null;
          cancelled_at?: string | null;
          email?: string;
          expires_at?: string;
          household_id?: string;
          id?: string;
          invited_at?: string;
          invited_by?: string;
          name?: string;
          role?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'household_invites_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'household_invites_invited_by_fkey';
            columns: ['invited_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      households: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          primary_currency: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          primary_currency?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          primary_currency?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          action_url: string | null;
          created_at: string;
          household_id: string;
          id: string;
          is_read: boolean;
          message: string;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          action_url?: string | null;
          created_at?: string;
          household_id: string;
          id?: string;
          is_read?: boolean;
          message: string;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          action_url?: string | null;
          created_at?: string;
          household_id?: string;
          id?: string;
          is_read?: boolean;
          message?: string;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      overall_budgets: {
        Row: {
          amount: number;
          created_at: string;
          household_id: string;
          id: string;
          month: number;
          year: number;
        };
        Insert: {
          amount: number;
          created_at?: string;
          household_id: string;
          id?: string;
          month: number;
          year: number;
        };
        Update: {
          amount?: number;
          created_at?: string;
          household_id?: string;
          id?: string;
          month?: number;
          year?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'overall_budgets_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
        ];
      };
      recurring_transactions: {
        Row: {
          account_id: string;
          amount: number;
          category_id: string;
          created_at: string;
          day_of_month: number;
          description: string;
          frequency: string;
          household_id: string;
          id: string;
          is_active: boolean;
          next_due_date: string;
          type: string;
        };
        Insert: {
          account_id: string;
          amount: number;
          category_id: string;
          created_at?: string;
          day_of_month: number;
          description: string;
          frequency?: string;
          household_id: string;
          id?: string;
          is_active?: boolean;
          next_due_date: string;
          type: string;
        };
        Update: {
          account_id?: string;
          amount?: number;
          category_id?: string;
          created_at?: string;
          day_of_month?: number;
          description?: string;
          frequency?: string;
          household_id?: string;
          id?: string;
          is_active?: boolean;
          next_due_date?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recurring_transactions_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recurring_transactions_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recurring_transactions_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
        ];
      };
      savings_goals: {
        Row: {
          color: string | null;
          created_at: string;
          current_amount: number;
          household_id: string;
          icon: string | null;
          id: string;
          is_completed: boolean;
          name: string;
          target_amount: number;
          target_date: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          current_amount?: number;
          household_id: string;
          icon?: string | null;
          id?: string;
          is_completed?: boolean;
          name: string;
          target_amount: number;
          target_date: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          current_amount?: number;
          household_id?: string;
          icon?: string | null;
          id?: string;
          is_completed?: boolean;
          name?: string;
          target_amount?: number;
          target_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'savings_goals_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
        ];
      };
      transactions: {
        Row: {
          account_id: string;
          amount: number;
          category_id: string | null;
          created_at: string;
          date: string;
          debt_id: string | null;
          description: string | null;
          household_id: string;
          id: string;
          is_recurring: boolean;
          merchant: string | null;
          notes: string | null;
          payment_method: string | null;
          receipt_url: string | null;
          recurring_id: string | null;
          split_ratio: number | null;
          split_with: string | null;
          tags: string[] | null;
          to_account_id: string | null;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id: string;
          amount: number;
          category_id?: string | null;
          created_at?: string;
          date: string;
          debt_id?: string | null;
          description?: string | null;
          household_id: string;
          id?: string;
          is_recurring?: boolean;
          merchant?: string | null;
          notes?: string | null;
          payment_method?: string | null;
          receipt_url?: string | null;
          recurring_id?: string | null;
          split_ratio?: number | null;
          split_with?: string | null;
          tags?: string[] | null;
          to_account_id?: string | null;
          type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_id?: string;
          amount?: number;
          category_id?: string | null;
          created_at?: string;
          date?: string;
          debt_id?: string | null;
          description?: string | null;
          household_id?: string;
          id?: string;
          is_recurring?: boolean;
          merchant?: string | null;
          notes?: string | null;
          payment_method?: string | null;
          receipt_url?: string | null;
          recurring_id?: string | null;
          split_ratio?: number | null;
          split_with?: string | null;
          tags?: string[] | null;
          to_account_id?: string | null;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_transactions_recurring';
            columns: ['recurring_id'];
            isOneToOne: false;
            referencedRelation: 'recurring_transactions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_to_account_id_fkey';
            columns: ['to_account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_debt_id_fkey';
            columns: ['debt_id'];
            isOneToOne: false;
            referencedRelation: 'debts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_split_with_fkey';
            columns: ['split_with'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          dashboard_preferences: Json | null;
          email: string;
          household_id: string | null;
          id: string;
          name: string;
          role: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          dashboard_preferences?: Json | null;
          email: string;
          household_id?: string | null;
          id: string;
          name: string;
          role?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          dashboard_preferences?: Json | null;
          email?: string;
          household_id?: string | null;
          id?: string;
          name?: string;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'users_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_household_id: { Args: never; Returns: string };
      get_user_role: { Args: never; Returns: string };
      seed_default_categories: {
        Args: { p_household_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
