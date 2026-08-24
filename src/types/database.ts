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
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          phone: string | null
          role: 'user' | 'admin' | null
          avatar_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          role?: 'user' | 'admin' | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          role?: 'user' | 'admin' | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      addresses: {
        Row: {
          id: string
          user_id: string | null
          title: string | null
          full_name: string | null
          phone: string | null
          city: string | null
          district: string | null
          neighborhood: string | null
          address_line: string | null
          postal_code: string | null
          is_default: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          title?: string | null
          full_name?: string | null
          phone?: string | null
          city?: string | null
          district?: string | null
          neighborhood?: string | null
          address_line?: string | null
          postal_code?: string | null
          is_default?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string | null
          full_name?: string | null
          phone?: string | null
          city?: string | null
          district?: string | null
          neighborhood?: string | null
          address_line?: string | null
          postal_code?: string | null
          is_default?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          parent_id: string | null
          sort_order: number | null
          is_active: boolean | null
          seo_title: string | null
          seo_description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          sort_order?: number | null
          is_active?: boolean | null
          seo_title?: string | null
          seo_description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          sort_order?: number | null
          is_active?: boolean | null
          seo_title?: string | null
          seo_description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          short_description: string | null
          fabric_info: string | null
          care_instructions: string | null
          base_price: number | null
          sale_price: number | null
          category_id: string | null
          is_featured: boolean | null
          is_new: boolean | null
          is_active: boolean | null
          tags: string[] | null
          seo_title: string | null
          seo_description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          short_description?: string | null
          fabric_info?: string | null
          care_instructions?: string | null
          base_price?: number | null
          sale_price?: number | null
          category_id?: string | null
          is_featured?: boolean | null
          is_new?: boolean | null
          is_active?: boolean | null
          tags?: string[] | null
          seo_title?: string | null
          seo_description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          fabric_info?: string | null
          care_instructions?: string | null
          base_price?: number | null
          sale_price?: number | null
          category_id?: string | null
          is_featured?: boolean | null
          is_new?: boolean | null
          is_active?: boolean | null
          tags?: string[] | null
          seo_title?: string | null
          seo_description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      product_images: {
        Row: {
          id: string
          product_id: string | null
          image_url: string | null
          alt_text: string | null
          sort_order: number | null
          is_primary: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          product_id?: string | null
          image_url?: string | null
          alt_text?: string | null
          sort_order?: number | null
          is_primary?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string | null
          image_url?: string | null
          alt_text?: string | null
          sort_order?: number | null
          is_primary?: boolean | null
          created_at?: string | null
        }
      }
      product_variants: {
        Row: {
          id: string
          product_id: string | null
          color_name: string | null
          color_hex: string | null
          color_image_url: string | null
          size: string | null
          sku: string | null
          stock_quantity: number | null
          price_override: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          product_id?: string | null
          color_name?: string | null
          color_hex?: string | null
          color_image_url?: string | null
          size?: string | null
          sku?: string | null
          stock_quantity?: number | null
          price_override?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string | null
          color_name?: string | null
          color_hex?: string | null
          color_image_url?: string | null
          size?: string | null
          sku?: string | null
          stock_quantity?: number | null
          price_override?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string | null
          user_id: string | null
          status: string | null
          subtotal: number | null
          shipping_cost: number | null
          total: number | null
          shipping_address: Json | null
          billing_address: Json | null
          cargo_tracking_number: string | null
          cargo_company: string | null
          shopier_payment_id: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          order_number?: string | null
          user_id?: string | null
          status?: string | null
          subtotal?: number | null
          shipping_cost?: number | null
          total?: number | null
          shipping_address?: Json | null
          billing_address?: Json | null
          cargo_tracking_number?: string | null
          cargo_company?: string | null
          shopier_payment_id?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          order_number?: string | null
          user_id?: string | null
          status?: string | null
          subtotal?: number | null
          shipping_cost?: number | null
          total?: number | null
          shipping_address?: Json | null
          billing_address?: Json | null
          cargo_tracking_number?: string | null
          cargo_company?: string | null
          shopier_payment_id?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          product_id: string | null
          variant_id: string | null
          product_name: string | null
          variant_info: string | null
          quantity: number | null
          unit_price: number | null
          total_price: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          variant_id?: string | null
          product_name?: string | null
          variant_info?: string | null
          quantity?: number | null
          unit_price?: number | null
          total_price?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          variant_id?: string | null
          product_name?: string | null
          variant_info?: string | null
          quantity?: number | null
          unit_price?: number | null
          total_price?: number | null
          created_at?: string | null
        }
      }
      reviews: {
        Row: {
          id: string
          product_id: string | null
          user_id: string | null
          rating: number | null
          comment: string | null
          is_approved: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          product_id?: string | null
          user_id?: string | null
          rating?: number | null
          comment?: string | null
          is_approved?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string | null
          user_id?: string | null
          rating?: number | null
          comment?: string | null
          is_approved?: boolean | null
          created_at?: string | null
        }
      }
      wishlist: {
        Row: {
          id: string
          user_id: string | null
          product_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          product_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          product_id?: string | null
          created_at?: string | null
        }
      }
      site_content: {
        Row: {
          id: string
          content_key: string | null
          content_type: string | null
          title: string | null
          subtitle: string | null
          content: Json | null
          media_url: string | null
          link_url: string | null
          link_text: string | null
          sort_order: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          content_key?: string | null
          content_type?: string | null
          title?: string | null
          subtitle?: string | null
          content?: Json | null
          media_url?: string | null
          link_url?: string | null
          link_text?: string | null
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          content_key?: string | null
          content_type?: string | null
          title?: string | null
          subtitle?: string | null
          content?: Json | null
          media_url?: string | null
          link_url?: string | null
          link_text?: string | null
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      navigation_menus: {
        Row: {
          id: string
          name: string | null
          slug: string | null
          items: Json | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          slug?: string | null
          items?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          slug?: string | null
          items?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      email_templates: {
        Row: {
          id: string
          name: string | null
          subject: string | null
          body_html: string | null
          template_type: string | null
          variables: string[] | null
          is_default: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          subject?: string | null
          body_html?: string | null
          template_type?: string | null
          variables?: string[] | null
          is_default?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          subject?: string | null
          body_html?: string | null
          template_type?: string | null
          variables?: string[] | null
          is_default?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      email_logs: {
        Row: {
          id: string
          template_id: string | null
          recipient_email: string | null
          recipient_name: string | null
          subject: string | null
          status: string | null
          sent_at: string | null
          error_message: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          template_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          subject?: string | null
          status?: string | null
          sent_at?: string | null
          error_message?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          template_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          subject?: string | null
          status?: string | null
          sent_at?: string | null
          error_message?: string | null
          created_at?: string | null
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
