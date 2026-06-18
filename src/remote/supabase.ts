import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zbgtbhiqdhjuqyfqlnmm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZ3RiaGlxZGhqdXF5ZnFsbm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MjY1NTIsImV4cCI6MjA5MjUwMjU1Mn0.e44u_lqPIHskSP7aPZoP0gQtv-IJ7TzrRrLzFxjopNQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
