import { createClient } from '@supabase/supabase-js';
import { ContentSet, Paragraph, WisdomSection } from './contentService';

// Replace with your Supabase URL and anon key
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Content fetching functions
export async function fetchContentSet(): Promise<ContentSet | null> {
  // Get active content set
  const { data: contentSetData, error: contentSetError } = await supabase
    .from('content_sets')
    .select('*')
    .eq('status', 'active')
    .single();
  
  if (contentSetError || !contentSetData) {
    console.error('Error fetching content set:', contentSetError);
    return null;
  }
  
  // Get paragraphs for this content set
  const { data: paragraphsData, error: paragraphsError } = await supabase
    .from('content_paragraphs')
    .select('*')
    .eq('content_set_id', contentSetData.id)
    .order('order', { ascending: true });
  
  if (paragraphsError) {
    console.error('Error fetching paragraphs:', paragraphsError);
    return null;
  }
  
  // Get wisdom sections for this content set
  const { data: wisdomData, error: wisdomError } = await supabase
    .from('content_wisdom_sections')
    .select('*')
    .eq('content_set_id', contentSetData.id);
  
  if (wisdomError) {
    console.error('Error fetching wisdom sections:', wisdomError);
    return null;
  }
  
  // Get user progress for this content set
  const user = supabase.auth.getUser();
  let paragraphProgress: Record<string, boolean> = {};
  let wisdomProgress: Record<string, boolean> = {};
  
  if (user) {
    const { data: progressData } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', (await user).data.user?.id);
    
    if (progressData) {
      progressData.forEach((item: {
        content_id: string;
        content_type: string;
        completed: boolean;
      }) => {
        if (item.content_type === 'paragraph') {
          paragraphProgress[item.content_id] = item.completed;
        } else if (item.content_type === 'wisdom') {
          wisdomProgress[item.content_id] = item.completed;
        }
      });
    }
  }
  
  // Format paragraphs with completion status
  const paragraphs: Paragraph[] = paragraphsData.map((p: {
    id: string;
    content: string;
    order: number;
  }) => ({
    id: p.id,
    content: p.content,
    order: p.order,
    completed: paragraphProgress[p.id] || false
  }));
  
  // Format wisdom sections with completion status
  const wisdomSections: WisdomSection[] = wisdomData.map((w: {
    id: string;
    type: "quote" | "didYouKnow" | "recommendations" | "question";
    title: string;
    content: string;
  }) => ({
    id: w.id,
    type: w.type,
    title: w.title,
    content: w.content,
    completed: wisdomProgress[w.id] || false
  }));
  
  return {
    id: contentSetData.id,
    title: contentSetData.title,
    subtitle: contentSetData.subtitle,
    paragraphs,
    wisdomSections
  };
}

// Update completion status
export async function updateContentProgress(
  contentId: string, 
  contentType: 'paragraph' | 'wisdom',
  completed: boolean
): Promise<boolean> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) {
    console.error('User not authenticated');
    return false;
  }
  
  // Check if progress record exists
  const { data: existingProgress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.data.user.id)
    .eq('content_id', contentId)
    .eq('content_type', contentType)
    .single();
  
  if (existingProgress) {
    // Update existing record
    const { error } = await supabase
      .from('user_progress')
      .update({ 
        completed,
        completed_at: completed ? new Date().toISOString() : null
      })
      .eq('id', existingProgress.id);
      
    return !error;
  } else {
    // Create new record
    const { error } = await supabase
      .from('user_progress')
      .insert({
        user_id: user.data.user.id,
        content_id: contentId,
        content_type: contentType,
        completed,
        completed_at: completed ? new Date().toISOString() : null
      });
      
    return !error;
  }
}

// Update user stats
export async function updateUserStats(
  statsUpdate: {
    words?: number;
    texts?: number;
    timeSpentSeconds?: number;
    speed?: number;
  }
): Promise<boolean> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) {
    console.error('User not authenticated');
    return false;
  }
  
  const today = new Date().toISOString().split('T')[0];
  
  // Update daily stats
  const { data: existingDailyStats } = await supabase
    .from('user_daily_stats')
    .select('*')
    .eq('user_id', user.data.user.id)
    .eq('date', today)
    .single();
  
  if (existingDailyStats) {
    // Update existing record
    const { error } = await supabase
      .from('user_daily_stats')
      .update({
        words: existingDailyStats.words + (statsUpdate.words || 0),
        texts: existingDailyStats.texts + (statsUpdate.texts || 0),
        time_spent_seconds: existingDailyStats.time_spent_seconds + (statsUpdate.timeSpentSeconds || 0),
        speed: statsUpdate.speed || existingDailyStats.speed
      })
      .eq('id', existingDailyStats.id);
    
    if (error) {
      console.error('Error updating daily stats:', error);
      return false;
    }
  } else {
    // Create new record
    const { error } = await supabase
      .from('user_daily_stats')
      .insert({
        user_id: user.data.user.id,
        date: today,
        words: statsUpdate.words || 0,
        texts: statsUpdate.texts || 0,
        time_spent_seconds: statsUpdate.timeSpentSeconds || 0,
        speed: statsUpdate.speed || 0
      });
    
    if (error) {
      console.error('Error creating daily stats:', error);
      return false;
    }
  }
  
  // Update total user stats
  const { data: existingUserStats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', user.data.user.id)
    .single();
  
  if (existingUserStats) {
    // Update existing record
    const { error } = await supabase
      .from('user_stats')
      .update({
        words: existingUserStats.words + (statsUpdate.words || 0),
        texts: existingUserStats.texts + (statsUpdate.texts || 0),
        time_spent_seconds: existingUserStats.time_spent_seconds + (statsUpdate.timeSpentSeconds || 0),
        speed: statsUpdate.speed || existingUserStats.speed
      })
      .eq('user_id', user.data.user.id);
    
    if (error) {
      console.error('Error updating user stats:', error);
      return false;
    }
  } else {
    // Create new record
    const { error } = await supabase
      .from('user_stats')
      .insert({
        user_id: user.data.user.id,
        words: statsUpdate.words || 0,
        texts: statsUpdate.texts || 0,
        time_spent_seconds: statsUpdate.timeSpentSeconds || 0,
        speed: statsUpdate.speed || 0
      });
    
    if (error) {
      console.error('Error creating user stats:', error);
      return false;
    }
  }
  
  return true;
}

// Fetch user weekly stats
export async function fetchWeeklyStats(startDate: Date, endDate: Date) {
  const user = await supabase.auth.getUser();
  if (!user.data.user) {
    console.error('User not authenticated');
    return null;
  }
  
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('user_daily_stats')
    .select('*')
    .eq('user_id', user.data.user.id)
    .gte('date', startStr)
    .lte('date', endStr)
    .order('date', { ascending: true });
  
  if (error) {
    console.error('Error fetching weekly stats:', error);
    return null;
  }
  
  return data;
} 