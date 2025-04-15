// This service manages content fetching and tracking for paragraphs and wisdom sections

// Types for content structure
export interface Paragraph {
  id: string;
  content: string;
  order: number;
  completed: boolean;
}

export interface WisdomSection {
  id: string;
  type: 'quote';
  title: string;
  content: string;
  completed: boolean;
}

export interface ContentSet {
  id: string;
  title: string;
  subtitle: string;
  paragraphs: Paragraph[];
  wisdomSections: WisdomSection[];
}

// Stats types
export interface UserStats {
  words: number;
  texts: number;
  timeSpentSeconds: number;
  speed: number;
}

export interface DailyStats extends UserStats {
  date: string;
}

// Progress state
export enum ProgressState {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

// Helper functions for calculating progress
export function calculateProgressState(
  completedItems: number,
  totalItems: number
): ProgressState {
  if (completedItems === 0) return ProgressState.NOT_STARTED;
  if (completedItems === totalItems) return ProgressState.COMPLETED;
  return ProgressState.IN_PROGRESS;
}

export function calculateProgressPercentage(
  completedItems: number,
  totalItems: number
): number {
  if (totalItems === 0) return 0;
  return Math.round((completedItems / totalItems) * 100);
}

// Keep track of the current content set in memory for better performance
let currentContentSet: ContentSet | null = null;

// Get the current content set
export async function getCurrentContent(): Promise<ContentSet> {
  // Import Supabase client to avoid circular dependencies
  const { fetchContentSet, getCurrentUserId } = await import('./supabaseClient');
  
  try {
    // Get the current user ID for better logging
    const userId = getCurrentUserId();
    console.log('Fetching content for user ID:', userId);
    
    // Try to fetch from Supabase
    const content = await fetchContentSet();
    
    if (content) {
      // Update local cache for quick access
      currentContentSet = content;
      
      // Log progress status for debugging
      if (content.paragraphs && content.paragraphs.length > 0) {
        const completedCount = content.paragraphs.filter(p => p.completed).length;
        console.log(`User progress: ${completedCount}/${content.paragraphs.length} paragraphs completed`);
      }
      
      return content;
    } else {
      console.error('Failed to fetch content from Supabase');
      // Use the fallback content if Supabase fetch fails
      if (!currentContentSet) {
        currentContentSet = getDefaultContent();
        console.log('Using default content as fallback');
      }
      return currentContentSet;
    }
  } catch (error) {
    console.error('Error fetching content:', error);
    
    // If we have cached content, return it as fallback
    if (currentContentSet) {
      console.warn('Using cached content as fallback');
      return currentContentSet;
    }
    
    // Use default content if no cached content exists
    currentContentSet = getDefaultContent();
    console.log('Using default content as fallback');
    return currentContentSet;
  }
}

// Default content as fallback if Supabase connection fails
function getDefaultContent(): ContentSet {
  return {
    id: 'default-content',
    title: 'Laisvės vėjas:',
    subtitle: 'politinė ir socialinė oro reikšmė',
    paragraphs: [
      {
        id: 'p1',
        content: 'Kai žmonės iškovoja laisvę, dažnai sakoma: "tarsi galėčiau pagaliau įkvėpti". Kvėpavimas tampa ne tik fiziologiniu veiksmu, bet simboline būsena – gyventi be baimės.',
        order: 1,
        completed: false
      },
      {
        id: 'p2',
        content: 'Tačiau ne visi gali laisvai kvėpuoti – pažodžiui ir perkeltine prasme. Miestai pilni taršos. Šalys – be žodžio laisvės. Kvėpavimas ir teisė laisvai reikšti mintis – abu gali būti atimti.',
        order: 2,
        completed: false
      },
      {
        id: 'p3',
        content: 'Laisvė yra kaip oras – jos nepastebi, kol jos netenki. Todėl tik brandi visuomenė saugo ne tik fizinę oro švarą, bet ir idėjų erdvę, kurioje gali laisvai kvėpuoti kiekvienas.',
        order: 3,
        completed: false
      },
      {
        id: 'p4',
        content: 'Per pasaulį nuvilnijusios revoliucijos nešė plakatais žodžius, bet jų esmė slypėjo ore – ore, kuris alsavo pasipriešinimu. Kvėpavimas buvo lyg sinchronizuota malda – viena tauta, vienas ritmas.',
        order: 4,
        completed: false
      },
      {
        id: 'p5',
        content: 'Tačiau laisvė dažnai painiojama su chaosu. Kai kas, gavęs oro, pasirenka jį naudoti kitiems atimti. Kvėpuoti laisvai reiškia ne daryti bet ką, o leisti kitiems kvėpuoti šalia tavęs.',
        order: 5,
        completed: false
      },
      {
        id: 'p6',
        content: 'Tik tada, kai suvoki, jog tavo kvėpavimas susijęs su šalia esančio žmogaus oru – tiek tiesiogiai, tiek simboliškai – tampi tikru laisvės kūrėju.',
        order: 6,
        completed: false
      },
      {
        id: 'p7',
        content: 'Oras – nematomas, bet gyvybiškai svarbus. Kaip ir laisvė. Abu reikia saugoti. Abu reikia gerbti. Ir abu galima prarasti, jei nustosime jais rūpintis.',
        order: 7,
        completed: false
      }
    ],
    wisdomSections: [
      {
        id: 'w1',
        type: 'quote' as 'quote',
        title: 'Išmintis',
        content: 'Pirmas politinis šūkis, kuriame buvo paminėtas kvėpavimas, gimė Prancūzijos revoliucijos metu: "La liberté ou l\'asphyxie" ("Laisvė arba uždusimas").',
        completed: false
      }
    ]
  };
}

// Mark paragraph as completed
export async function completeParagraph(paragraphId: string): Promise<ContentSet> {
  // Import Supabase client to avoid circular dependencies
  const { getCurrentUserId, updateContentProgress, logWordCount } = await import('./supabaseClient');
  
  // Get the current user ID
  const userId = getCurrentUserId();
  if (!userId) {
    console.error('User not authenticated, cannot update progress');
    throw new Error('User not authenticated');
  }
  
  // Save to localStorage immediately for better reliability
  try {
    const localKey = `paragraph_${paragraphId}_completed`;
    localStorage.setItem(localKey, 'true');
    console.log(`Saved paragraph completion to localStorage: ${localKey}`);
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
  
  try {
    // Update progress in Supabase
    const success = await updateContentProgress(paragraphId, 'paragraph', true);
    
    if (!success) {
      console.error('Failed to update paragraph completion in database');
    } else {
      console.log('Successfully marked paragraph as completed in Supabase');
      
      // Use a fixed word count per paragraph to ensure consistency
      // Instead of calculating based on actual text which can lead to double-counting
      const FIXED_WORDS_PER_PARAGRAPH = 8;
      await logWordCount(FIXED_WORDS_PER_PARAGRAPH);
      console.log(`Logged fixed word count of ${FIXED_WORDS_PER_PARAGRAPH} words for completed paragraph`);
    }
  } catch (error) {
    console.error('Error updating paragraph completion:', error);
  }
  
  // Always update local data for immediate feedback if we have it
  if (currentContentSet) {
    currentContentSet = {
      ...currentContentSet,
      paragraphs: currentContentSet.paragraphs.map(p => 
        p.id === paragraphId ? { ...p, completed: true } : p
      )
    };
  }
  
  // Return the current content set (will be updated with completion)
  return currentContentSet || getDefaultContent();
}

// Mark wisdom section as completed
export async function completeWisdomSection(sectionId: string): Promise<ContentSet> {
  // Import Supabase client to avoid circular dependencies
  const { getCurrentUserId, updateContentProgress, logWordCount } = await import('./supabaseClient');
  
  // Get the current user ID
  const userId = getCurrentUserId();
  if (!userId) {
    console.error('User not authenticated, cannot update progress');
    throw new Error('User not authenticated');
  }
  
  // Save to localStorage immediately for better reliability
  try {
    const localKey = `wisdom_${sectionId}_completed`;
    localStorage.setItem(localKey, 'true');
    console.log(`Saved wisdom section completion to localStorage: ${localKey}`);
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
  
  try {
    // Update progress in Supabase
    const success = await updateContentProgress(sectionId, 'wisdom', true);
    
    if (!success) {
      console.error('Failed to update wisdom section completion in database');
    } else {
      console.log('Successfully marked wisdom section as completed in Supabase');
      
      // Use a fixed word count per wisdom section
      const FIXED_WORDS_PER_WISDOM = 10;
      await logWordCount(FIXED_WORDS_PER_WISDOM);
      console.log(`Logged fixed word count of ${FIXED_WORDS_PER_WISDOM} words for completed wisdom section`);
    }
  } catch (error) {
    console.error('Error updating wisdom section completion:', error);
  }
  
  // Always update local data for immediate feedback if we have it
  if (currentContentSet) {
    currentContentSet = {
      ...currentContentSet,
      wisdomSections: currentContentSet.wisdomSections.map(w => 
        w.id === sectionId ? { ...w, completed: true } : w
      )
    };
  }
  
  // Return the current content set (will be updated with completion)
  return currentContentSet || getDefaultContent();
}

// Check if content set is completed (all paragraphs and the wisdom section)
export function isContentSetCompleted(): boolean {
  if (!currentContentSet) return false;
  
  const allParagraphsCompleted = currentContentSet.paragraphs.every(p => p.completed);
  const wisdomSectionCompleted = currentContentSet.wisdomSections.length > 0 && 
                                currentContentSet.wisdomSections[0].completed;
  
  return allParagraphsCompleted && wisdomSectionCompleted;
} 