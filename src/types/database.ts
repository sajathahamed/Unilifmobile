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

export interface Vendor {
  id: number;
  name: string | null;
  type: string | null;
  location: string | null;
  is_open: boolean;
  rating: number | null;
  created_at: string;
}

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
  student_id: number | null;
  vendor_id: number | null;
  total: number | null;
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

export interface LaundryOrder {
  id: number;
  student_id: number | null;
  laundry_service_id: number | null;
  order_type: string | null;
  total_price: number | null;
  status: string | null;
  created_at: string;
}

export interface Trip {
  id: number;
  destination: string | null;
  days: number | null;
  estimated_budget: number | null;
  created_by: number | null;
  status: string | null;
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
      vendors: {
        Row: Vendor;
        Insert: Omit<Vendor, 'id' | 'created_at'>;
        Update: Partial<Omit<Vendor, 'id'>>;
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
