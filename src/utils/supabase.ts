import { createClient } from '@supabase/supabase-js';
import { FullClassDataStore } from '../types';

// Default Supabase project configuration
export const DEFAULT_SUPABASE_URL = 
  import.meta.env.VITE_SUPABASE_URL || 'https://gdoxbonoiumnpiswqris.supabase.co';

export const DEFAULT_SUPABASE_ANON_KEY = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eYFPXHwHldj4nqSombGNaA_ZWDOZRON';

// Local storage override keys in case user wants to test custom credentials in UI
const CUSTOM_URL_KEY = 'classpro_custom_supabase_url';
const CUSTOM_KEY_KEY = 'classpro_custom_supabase_key';
const AUTO_SYNC_KEY = 'classpro_supabase_auto_sync';

export function getSupabaseCredentials() {
  const customUrl = localStorage.getItem(CUSTOM_URL_KEY);
  const customKey = localStorage.getItem(CUSTOM_KEY_KEY);
  return {
    url: customUrl?.trim() || DEFAULT_SUPABASE_URL,
    anonKey: customKey?.trim() || DEFAULT_SUPABASE_ANON_KEY,
    isCustom: !!(customUrl || customKey)
  };
}

export function saveSupabaseCredentials(url: string, key: string) {
  if (url) localStorage.setItem(CUSTOM_URL_KEY, url.trim());
  else localStorage.removeItem(CUSTOM_URL_KEY);

  if (key) localStorage.setItem(CUSTOM_KEY_KEY, key.trim());
  else localStorage.removeItem(CUSTOM_KEY_KEY);

  reinitClient();
}

export function clearCustomSupabaseCredentials() {
  localStorage.removeItem(CUSTOM_URL_KEY);
  localStorage.removeItem(CUSTOM_KEY_KEY);
  reinitClient();
}

export function getAutoSyncEnabled(): boolean {
  const val = localStorage.getItem(AUTO_SYNC_KEY);
  return val === null ? true : val === 'true'; // Default true
}

export function setAutoSyncEnabled(enabled: boolean) {
  localStorage.setItem(AUTO_SYNC_KEY, enabled ? 'true' : 'false');
}

// Global Supabase client instance
let supabaseClientInstance = createClient(
  getSupabaseCredentials().url, 
  getSupabaseCredentials().anonKey
);

export function getSupabaseClient() {
  return supabaseClientInstance;
}

function reinitClient() {
  const creds = getSupabaseCredentials();
  supabaseClientInstance = createClient(creds.url, creds.anonKey);
}

export const STORE_ROW_ID = 'master_store';
export const SUPABASE_TABLE_NAME = 'class_master_store';

export interface SupabaseConnectionStatus {
  connected: boolean;
  tableExists: boolean;
  message: string;
  error?: string;
  lastChecked?: string;
}

/**
 * Checks connection to Supabase and verifies if the storage table exists
 */
export async function testSupabaseConnection(): Promise<SupabaseConnectionStatus> {
  const creds = getSupabaseCredentials();
  if (!creds.url || !creds.anonKey) {
    return {
      connected: false,
      tableExists: false,
      message: 'Chưa có thông tin cấu hình URL hoặc Anon Key'
    };
  }

  try {
    const client = getSupabaseClient();
    
    // Test query to the table
    const { data, error } = await client
      .from(SUPABASE_TABLE_NAME)
      .select('id, updated_at')
      .limit(1);

    if (error) {
      // Check if table does not exist
      if (error.code === '42P01' || error.message.includes('does not exist') || error.code === 'PGRST204') {
        return {
          connected: true,
          tableExists: false,
          message: `Đã kết nối tới Supabase thành công! Tuy nhiên bảng "${SUPABASE_TABLE_NAME}" chưa được tạo trong CSDL.`,
          error: error.message,
          lastChecked: new Date().toLocaleTimeString('vi-VN')
        };
      }
      return {
        connected: false,
        tableExists: false,
        message: `Lỗi kết nối Supabase: ${error.message} (Mã lỗi: ${error.code})`,
        error: error.message,
        lastChecked: new Date().toLocaleTimeString('vi-VN')
      };
    }

    return {
      connected: true,
      tableExists: true,
      message: 'Kết nối Supabase hoàn hảo! Bảng dữ liệu đã sẵn sàng hoạt động.',
      lastChecked: new Date().toLocaleTimeString('vi-VN')
    };
  } catch (err: any) {
    return {
      connected: false,
      tableExists: false,
      message: `Không thể kết nối đến máy chủ Supabase: ${err.message || 'Lỗi mạng'}`,
      error: String(err),
      lastChecked: new Date().toLocaleTimeString('vi-VN')
    };
  }
}

/**
 * Upload entire store to Supabase
 */
export async function uploadStoreToSupabase(store: FullClassDataStore): Promise<{ success: boolean; message: string; error?: any }> {
  try {
    const client = getSupabaseClient();
    const payload = {
      id: STORE_ROW_ID,
      data: store,
      updated_at: new Date().toISOString()
    };

    const { error } = await client
      .from(SUPABASE_TABLE_NAME)
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return {
          success: false,
          message: `Bảng "${SUPABASE_TABLE_NAME}" chưa tồn tại. Vui lòng chạy lệnh SQL cài đặt trong Supabase SQL Editor.`,
          error
        };
      }
      return {
        success: false,
        message: `Lưu thất bại: ${error.message}`,
        error
      };
    }

    return {
      success: true,
      message: 'Đã sao lưu toàn bộ dữ liệu lên đám mây Supabase thành công!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Lỗi lưu trữ đám mây: ${err.message || 'Lỗi không xác định'}`,
      error: err
    };
  }
}

/**
 * Fetch entire store from Supabase
 */
export async function fetchStoreFromSupabase(): Promise<{ success: boolean; data?: FullClassDataStore; message: string; error?: any }> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from(SUPABASE_TABLE_NAME)
      .select('data, updated_at')
      .eq('id', STORE_ROW_ID)
      .maybeSingle();

    if (error) {
      return {
        success: false,
        message: `Không thể tải dữ liệu từ Supabase: ${error.message}`,
        error
      };
    }

    if (!data || !data.data) {
      return {
        success: false,
        message: 'Chưa có bản sao lưu nào trên đám mây Supabase. Bạn có thể nhấn nút "Đẩy dữ liệu lên Đám mây" để lưu trữ lần đầu.'
      };
    }

    return {
      success: true,
      data: data.data as FullClassDataStore,
      message: `Đã tải dữ liệu đám mây thành công (Cập nhật lần cuối: ${new Date(data.updated_at).toLocaleString('vi-VN')})`
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Lỗi mạng khi tải từ Supabase: ${err.message || 'Lỗi không xác định'}`,
      error: err
    };
  }
}

/**
 * SQL Script generator for the user to run in Supabase SQL Editor
 */
export const SUPABASE_SQL_SETUP_SCRIPT = `-- ========================================================
-- SCRIPT TẠO BẢNG DỮ LIỆU CLASS PRO TRÊN SUPABASE
-- Hãy sao chép toàn bộ đoạn mã này và dán vào:
-- Supabase Dashboard -> SQL Editor -> New query -> Nhấn "Run"
-- ========================================================

-- 1. Tạo bảng lưu trữ toàn bộ dữ liệu quản lý lớp học
CREATE TABLE IF NOT EXISTS public.${SUPABASE_TABLE_NAME} (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Kích hoạt tính năng Row Level Security (RLS)
ALTER TABLE public.${SUPABASE_TABLE_NAME} ENABLE ROW LEVEL SECURITY;

-- 3. Cho phép quyền ĐỌC dữ liệu (Public Select)
DROP POLICY IF EXISTS "Cho phép đọc dữ liệu lớp học" ON public.${SUPABASE_TABLE_NAME};
CREATE POLICY "Cho phép đọc dữ liệu lớp học" 
ON public.${SUPABASE_TABLE_NAME} 
FOR SELECT 
USING (true);

-- 4. Cho phép quyền GHI / CẬP NHẬT dữ liệu (Public Insert/Update)
DROP POLICY IF EXISTS "Cho phép ghi và cập nhật dữ liệu lớp học" ON public.${SUPABASE_TABLE_NAME};
CREATE POLICY "Cho phép ghi và cập nhật dữ liệu lớp học" 
ON public.${SUPABASE_TABLE_NAME} 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 5. Kích hoạt tính năng Realtime (Đồng bộ tức thì khi có thay đổi)
ALTER PUBLICATION supabase_realtime ADD TABLE public.${SUPABASE_TABLE_NAME};
`;
