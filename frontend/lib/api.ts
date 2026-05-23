import axios from "axios";
import { supabase } from "./supabaseClient";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    console.error("Error retrieving Supabase session for API header:", error);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});
