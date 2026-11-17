/**
 * @file supabaseClient.ts
 * @title Supabase 연결 클라이언트
 * @description 환경 변수와 데이터 타입을 사용해 Supabase 클라이언트를 생성합니다.
 */
/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
