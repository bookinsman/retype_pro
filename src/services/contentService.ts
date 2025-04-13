// This service manages content fetching and tracking for paragraphs and wisdom sections
// Will be replaced with Supabase integration in the future

// Types for content structure
export interface Paragraph {
  id: string;
  content: string;
  order: number;
  completed: boolean;
}

export interface WisdomSection {
  id: string;
  type: 'quote' | 'didYouKnow' | 'recommendations' | 'question';
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

// Mock data for current content set
let currentContentSet: ContentSet = {
  id: 'Laisvės vėjas',
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
      type: 'quote',
      title: 'Išmintis',
      content: 'Pirmas politinis šūkis, kuriame buvo paminėtas kvėpavimas, gimė Prancūzijos revoliucijos metu: „La liberté ou l’asphyxie“ („Laisvė arba uždusimas“).',
      completed: false
    }
  ]
};

// Get the current content set
export async function getCurrentContent(): Promise<ContentSet> {
  // In the future, this will fetch from Supabase
  // Example Supabase implementation:
  // const { data, error } = await supabase
  //   .from('content_sets')
  //   .select(`
  //     *,
  //     paragraphs:content_paragraphs(*),
  //     wisdomSections:content_wisdom_sections(*)
  //   `)
  //   .eq('status', 'active')
  //   .single();
  // 
  // if (error) throw new Error('Failed to fetch content: ' + error.message);
  // return data;
  
  // For now, return mock data
  return { ...currentContentSet };
}

// Mark paragraph as completed
export async function completeParagraph(paragraphId: string): Promise<ContentSet> {
  // In the future, this will update Supabase
  // Example Supabase implementation:
  // await supabase
  //   .from('user_progress')
  //   .upsert({
  //     user_id: currentUserId,
  //     content_id: paragraphId,
  //     content_type: 'paragraph',
  //     completed: true,
  //     completed_at: new Date().toISOString()
  //   });
  
  // Update local mock data
  currentContentSet = {
    ...currentContentSet,
    paragraphs: currentContentSet.paragraphs.map(p => 
      p.id === paragraphId ? { ...p, completed: true } : p
    )
  };
  
  return currentContentSet;
}

// Mark wisdom section as completed
export async function completeWisdomSection(sectionId: string): Promise<ContentSet> {
  // In the future, this will update Supabase
  // Example Supabase implementation:
  // await supabase
  //   .from('user_progress')
  //   .upsert({
  //     user_id: currentUserId,
  //     content_id: sectionId,
  //     content_type: 'wisdom',
  //     completed: true,
  //     completed_at: new Date().toISOString()
  //   });
  
  // Update local mock data
  currentContentSet = {
    ...currentContentSet,
    wisdomSections: currentContentSet.wisdomSections.map(w => 
      w.id === sectionId ? { ...w, completed: true } : w
    )
  };
  
  return currentContentSet;
}

// Check if content set is completed (all paragraphs and the wisdom section)
export function isContentSetCompleted(): boolean {
  const allParagraphsCompleted = currentContentSet.paragraphs.every(p => p.completed);
  const wisdomSectionCompleted = currentContentSet.wisdomSections.length > 0 && 
                                currentContentSet.wisdomSections[0].completed;
  
  return allParagraphsCompleted && wisdomSectionCompleted;
} 