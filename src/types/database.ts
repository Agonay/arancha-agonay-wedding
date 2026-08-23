export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      weddings: {
        Row: {
          id: string
          couple_names: string
          wedding_date: string
          venue_name: string | null
          venue_address: string | null
          lifecycle_state: string
          settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          couple_names: string
          wedding_date: string
          venue_name?: string | null
          venue_address?: string | null
          lifecycle_state?: string
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          couple_names?: string
          wedding_date?: string
          venue_name?: string | null
          venue_address?: string | null
          lifecycle_state?: string
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      invitations: {
        Row: {
          id: string
          wedding_id: string
          token: string
          status: string
          delivered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          token: string
          status?: string
          delivered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wedding_id?: string
          token?: string
          status?: string
          delivered_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      guests: {
        Row: {
          id: string
          wedding_id: string
          first_name: string
          last_name: string
          display_name: string | null
          group_id: string | null
          phone: string | null
          email: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          first_name: string
          last_name: string
          display_name?: string | null
          group_id?: string | null
          phone?: string | null
          email?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wedding_id?: string
          first_name?: string
          last_name?: string
          display_name?: string | null
          group_id?: string | null
          phone?: string | null
          email?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invitation_guests: {
        Row: {
          invitation_id: string
          guest_id: string
          is_primary: boolean
          created_at: string
        }
        Insert: {
          invitation_id: string
          guest_id: string
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          invitation_id?: string
          guest_id?: string
          is_primary?: boolean
          created_at?: string
        }
      }
      guest_groups: {
        Row: {
          id: string
          wedding_id: string
          name: string
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          name: string
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          wedding_id?: string
          name?: string
          color?: string | null
          created_at?: string
        }
      }
      rsvps: {
        Row: {
          id: string
          guest_id: string
          attendance: string | null
          plus_one_name: string | null
          dietary_requirements: Json | null
          dietary_notes: string | null
          transport_required: boolean | null
          transport_notes: string | null
          accommodation_notes: string | null
          notes: string | null
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          guest_id: string
          attendance?: string | null
          plus_one_name?: string | null
          dietary_requirements?: Json | null
          dietary_notes?: string | null
          transport_required?: boolean | null
          transport_notes?: string | null
          accommodation_notes?: string | null
          notes?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          guest_id?: string
          attendance?: string | null
          plus_one_name?: string | null
          dietary_requirements?: Json | null
          dietary_notes?: string | null
          transport_required?: boolean | null
          transport_notes?: string | null
          accommodation_notes?: string | null
          notes?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
