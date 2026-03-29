// Database types generated from SQL schema
export type UserRole = 'student' | 'lecturer' | 'admin' | 'vendor' | 'delivery' | 'super_admin';
export type ShopStatus = 'open' | 'closed';

export interface University {
  id: number;
  name: string;
  city: string | null;
  is_active: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  uni_id: number | null;
  google_id: string | null;
  photo_url: string | null;
  auth_provider: string | null;
  auth_id: string | null;
  vendor_type: string | null;
  created_at: string;
}

export interface Course {
  id: number;
  course_code: string | null;
  course_name: string | null;
  lecturer: string | null;
  colour: string | null;
}

export interface Timetable {
  id: number;
  student_id: number | null;
  course_id: number | null;
  academic_year: string | null;
  day_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
}

export interface Shop {
  id: number;
  name: string | null;
  owner_id: number | null;
  shop_type: string | null;
  status: ShopStatus | null;
  created_at: string;
}

export interface ShopOrder {
  id: number;
  shop_id: number | null;
  student_id: number | null;
  total_amount: number | null;
  status: string | null;
  created_at: string;
}

export interface ShopEarning {
  id: number;
  shop_id: number | null;
  order_id: number | null;
  amount: number | null;
  created_at: string;
}

export interface DeliveryAgent {
  id: number;
  name: string | null;
  phone: string | null;
  is_available: boolean;
}

export interface Delivery {
  id: number;
  order_id: number | null;
  delivery_agent_id: number | null;
  status: string | null;
  updated_at: string;
}

export interface FoodStall {
  id: number;
  shop_name: string;
  owner_name: string;
  owner_email: string;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  area: string | null;
  description: string | null;
  opening_time: string | null;
  closing_time: string | null;
  category: string | null;
  logo: string | null;
  banner: string | null;
  is_open: boolean;
  created_at: string;
}

export type Vendor = FoodStall; // Maintain compatibility

export interface FoodCategory {
  id: number;
  vendor_id: number | null;
  name: string | null;
}

export interface FoodItem {
  id: number;
  vendor_id: number | null;
  category_id: number | null;
  name: string | null;
  price: number | null;
  image_url: string | null;
  is_available: boolean;
}

export interface FoodOrder {
  id: number;
  food_stall_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  total: number | null;
  notes: string | null;
  items: string | null;
  delivery_address: string | null;
  order_ref: string | null;
  status: string | null;
  created_at: string;
}

export interface FoodOrderItem {
  id: number;
  order_id: number | null;
  food_id: number | null;
  qty: number | null;
  price: number | null;
}

export interface LaundryService {
  id: number;
  name: string | null;
  location: string | null;
  price_per_kg: number | null;
  price_per_item: number | null;
  pickup_available: boolean;
}

export interface LaundryShop {
  id: string;
  shop_name: string | null;
  owner_email: string | null;
  owner_name: string | null;
  whatsapp: string | null;
  phone: string | null;
  banner: string | null;
  vendor_type: string | null;
  gallery: string | null;
  logo: string | null;
  is_open: boolean;
  created_at: string;
  opening_time: string | null;
  closing_time: string | null;
  address: string | null;
  city: string | null;
  area: string | null;
  delivery_radius: number | null;
  pickup_delivery: boolean;
  services: string | null;
  price_list: string | null;
  lng: number | null;
  lat: number | null;
}

export interface LaundryOrder {
  id: number;
  laundry_shop_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  pickup_address: string | null;
  delivery_address: string | null;
  total: number | null;
  status: string | null;
  notes: string | null;
  items_description: string | null;
  order_ref: string | null;
  created_at: string;
}

// Extended Trip interface for new Trip Planner
export interface Trip {
  id: number;
  destination: string | null;
  days: number | null;
  budget: number | null;
  user_id: number | null;
  status: string | null;
  place_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;
  travel_type?: string | null;
  accommodation_type?: string | null;
  transport_mode?: string | null;
  transport_type?: string | null;
  food_preference?: string | null;
  total_estimated_cost?: number | null;
  ai_summary?: string | null;
  ai_travel_tips?: string | null;
  trip_type?: string | null;
  organizer_email?: string | null;
  organizer_name?: string | null;
  area?: string | null;
  inclusions?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  city?: string | null;
  whatsapp?: string | null;
  phone?: string | null;
  address?: string | null;
  description?: string | null;
  void_reason?: string | null;
  voided_at?: string | null;
  max_participants?: number | null;
  departure_date?: string | null;
  return_date?: string | null;
  budget_sufficient?: boolean | null;
  budget_lkr?: number | null;
  total_cost_lkr?: number | null;
  travelers?: number | null;
  gallery_urls?: string | null;
  cost_breakdown_json?: any;
  transport_details_json?: any;
  hotel_details_json?: any;
  itinerary_json?: any;
  currency?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

// Trip Day Plan
export interface TripDay {
  id: number;
  trip_id: number;
  day_number: number;
  activities: TripActivity[];
  estimated_cost: number;
  created_at?: string;
}

// Trip Activity
export interface TripActivity {
  time: string;
  activity: string;
  description?: string;
  estimated_cost: number;
  duration?: string;
}

// Trip Recommendation
export interface TripRecommendation {
  id: number;
  trip_id: number;
  type: 'hotel' | 'food' | 'place';
  name: string;
  rating?: number;
  address?: string;
  photo_url?: string;
  place_id?: string;
  price_level?: number;
  created_at?: string;
}

// AI Generated Trip Plan
export interface AITripPlan {
  summary: string;
  daily_plan: {
    day: number;
    theme?: string;
    activities: TripActivity[];
    estimated_cost: number;
  }[];
  total_estimated_cost: number;
  recommended_hotels: {
    name: string;
    reason?: string;
    estimated_cost_per_night?: number;
  }[];
  recommended_food_places: {
    name: string;
    cuisine?: string;
    meal_type?: string;
    estimated_cost?: number;
  }[];
  travel_tips: string[];
  budget_breakdown?: {
    accommodation?: number;
    food?: number;
    attractions?: number;
    transport?: number;
    miscellaneous?: number;
  };
}

export interface TripItinerary {
  id: number;
  trip_id: number | null;
  day_number: number | null;
  activity: string | null;
}

export interface TripMember {
  id: number;
  trip_id: number | null;
  student_id: number | null;
  joined_at: string;
}

export interface Notification {
  id: number;
  user_id: number | null;
  title: string | null;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

export interface PlatformStats {
  id: number;
  total_users: number | null;
  total_orders: number | null;
  total_revenue: number | null;
  generated_at: string;
}

// Database schema type for Supabase client
export interface Database {
  public: {
    Tables: {
      universities: {
        Row: University;
        Insert: Omit<University, 'id'>;
        Update: Partial<Omit<University, 'id'>>;
      };
      users: {
        Row: User;
        Insert: {
          name: string;
          email: string;
          role: UserRole;
          uni_id?: number | null;
          google_id?: string | null;
          photo_url?: string | null;
          auth_provider?: string | null;
          auth_id?: string | null;
          vendor_type?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<User, 'id'>>;
      };
      courses: {
        Row: Course;
        Insert: Omit<Course, 'id'>;
        Update: Partial<Omit<Course, 'id'>>;
      };
      timetable: {
        Row: Timetable;
        Insert: Omit<Timetable, 'id'>;
        Update: Partial<Omit<Timetable, 'id'>>;
      };
      shops: {
        Row: Shop;
        Insert: Omit<Shop, 'id' | 'created_at'>;
        Update: Partial<Omit<Shop, 'id'>>;
      };
      shop_orders: {
        Row: ShopOrder;
        Insert: Omit<ShopOrder, 'id' | 'created_at'>;
        Update: Partial<Omit<ShopOrder, 'id'>>;
      };
      shop_earnings: {
        Row: ShopEarning;
        Insert: Omit<ShopEarning, 'id' | 'created_at'>;
        Update: Partial<Omit<ShopEarning, 'id'>>;
      };
      delivery_agents: {
        Row: DeliveryAgent;
        Insert: Omit<DeliveryAgent, 'id'>;
        Update: Partial<Omit<DeliveryAgent, 'id'>>;
      };
      deliveries: {
        Row: Delivery;
        Insert: Omit<Delivery, 'id' | 'updated_at'>;
        Update: Partial<Omit<Delivery, 'id'>>;
      };
      food_stalls: {
        Row: FoodStall;
        Insert: Omit<FoodStall, 'id' | 'created_at'>;
        Update: Partial<Omit<FoodStall, 'id'>>;
      };
      food_categories: {
        Row: FoodCategory;
        Insert: Omit<FoodCategory, 'id'>;
        Update: Partial<Omit<FoodCategory, 'id'>>;
      };
      food_items: {
        Row: FoodItem;
        Insert: Omit<FoodItem, 'id'>;
        Update: Partial<Omit<FoodItem, 'id'>>;
      };
      food_orders: {
        Row: FoodOrder;
        Insert: Omit<FoodOrder, 'id' | 'created_at'>;
        Update: Partial<Omit<FoodOrder, 'id'>>;
      };
      food_order_items: {
        Row: FoodOrderItem;
        Insert: Omit<FoodOrderItem, 'id'>;
        Update: Partial<Omit<FoodOrderItem, 'id'>>;
      };
      laundry_services: {
        Row: LaundryService;
        Insert: Omit<LaundryService, 'id'>;
        Update: Partial<Omit<LaundryService, 'id'>>;
      };
      laundry_orders: {
        Row: LaundryOrder;
        Insert: Omit<LaundryOrder, 'id' | 'created_at'>;
        Update: Partial<Omit<LaundryOrder, 'id'>>;
      };
      trips: {
        Row: Trip;
        Insert: Omit<Trip, 'id'>;
        Update: Partial<Omit<Trip, 'id'>>;
      };
      trip_itinerary: {
        Row: TripItinerary;
        Insert: Omit<TripItinerary, 'id'>;
        Update: Partial<Omit<TripItinerary, 'id'>>;
      };
      trip_members: {
        Row: TripMember;
        Insert: Omit<TripMember, 'id' | 'joined_at'>;
        Update: Partial<Omit<TripMember, 'id'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id'>>;
      };
      platform_stats: {
        Row: PlatformStats;
        Insert: Omit<PlatformStats, 'id' | 'generated_at'>;
        Update: Partial<Omit<PlatformStats, 'id'>>;
      };
    };
    Enums: {
      user_role: UserRole;
      shop_status: ShopStatus;
    };
  };
}
