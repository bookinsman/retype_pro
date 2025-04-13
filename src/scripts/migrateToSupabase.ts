// This script helps migrate data to Supabase
// Run with: ts-node migrateToSupabase.ts

import { createClient } from '@supabase/supabase-js';
import { ContentSet } from '../services/contentService';

// You'll need to set these environment variables or replace with your values
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_KEY || 'your-supabase-key';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Sample data - this would be replaced with your actual data
const contentSets: ContentSet[] = [
  {
    id: 'breathing-science',
    title: 'Kvėpavimo mokslas',
    subtitle: 'kaip oras keičia kūną ir protą',
    paragraphs: [
      {
        id: 'p1',
        content: 'Kvėpavimas yra labiausiai pirminis ir būtinas mūsų fiziologinių procesų. Kiekvieną minutę įkvepiame ir iškvepiame apie 12-16 kartų, dažnai to net nepastebėdami. Tačiau už šio automatinio veiksmo slypi sudėtinga sistema, kuri ne tik aprūpina organizmą deguonimi, bet ir stipriai veikia mūsų nervų sistemą, emocijas ir bendrą savijautą.',
        order: 1,
        completed: false
      },
      // ... more paragraphs
    ],
    wisdomSections: [
      {
        id: 'w1',
        type: 'quote',
        title: 'Išmintis',
        content: 'Kvėpavimas yra tiltas, jungiantis gyvenimą su sąmone, jungiantis kūną su mintimis. Kai kvėpavimas tampa netvarkingu, protas tampa sutrikęs, bet kai kvėpavimas ramus, protas irgi nurimsta. - Thich Nhat Hanh',
        completed: false
      },
      // ... more wisdom sections
    ]
  }
];

// Supabase table structure
/*
Tables to create:
1. content_sets
   - id (primary key)
   - title
   - subtitle
   - status (active/inactive)
   - created_at

2. content_paragraphs
   - id (primary key)
   - content_set_id (foreign key -> content_sets.id)
   - content
   - order
   - created_at

3. content_wisdom_sections
   - id (primary key)
   - content_set_id (foreign key -> content_sets.id)
   - type (enum: 'quote', 'didYouKnow', 'recommendations', 'question')
   - title
   - content
   - created_at

4. user_progress
   - id (primary key)
   - user_id (foreign key -> auth.users.id)
   - content_id (paragraph_id or wisdom_section_id)
   - content_type (enum: 'paragraph', 'wisdom')
   - completed (boolean)
   - completed_at (timestamp)
*/

// Migration function for content sets
async function migrateContentSets() {
  console.log('Starting migration of content sets...');
  
  for (const contentSet of contentSets) {
    // 1. Insert content set
    const { data: contentSetData, error: contentSetError } = await supabase
      .from('content_sets')
      .upsert({
        id: contentSet.id,
        title: contentSet.title,
        subtitle: contentSet.subtitle,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select();
    
    if (contentSetError) {
      console.error('Error inserting content set:', contentSetError);
      continue;
    }
    
    console.log(`Content set "${contentSet.title}" inserted/updated.`);
    
    // 2. Insert paragraphs
    for (const paragraph of contentSet.paragraphs) {
      const { error: paragraphError } = await supabase
        .from('content_paragraphs')
        .upsert({
          id: paragraph.id,
          content_set_id: contentSet.id,
          content: paragraph.content,
          order: paragraph.order,
          created_at: new Date().toISOString()
        });
      
      if (paragraphError) {
        console.error(`Error inserting paragraph ${paragraph.id}:`, paragraphError);
      }
    }
    
    console.log(`${contentSet.paragraphs.length} paragraphs inserted/updated.`);
    
    // 3. Insert wisdom sections
    for (const section of contentSet.wisdomSections) {
      const { error: sectionError } = await supabase
        .from('content_wisdom_sections')
        .upsert({
          id: section.id,
          content_set_id: contentSet.id,
          type: section.type,
          title: section.title,
          content: section.content,
          created_at: new Date().toISOString()
        });
      
      if (sectionError) {
        console.error(`Error inserting wisdom section ${section.id}:`, sectionError);
      }
    }
    
    console.log(`${contentSet.wisdomSections.length} wisdom sections inserted/updated.`);
  }
  
  console.log('Content migration completed.');
}

// Create the database schema
async function createSchema() {
  console.log('Setting up database schema...');
  
  // Create content_sets table
  const { error: contentSetsError } = await supabase.rpc('create_content_sets_table');
  if (contentSetsError) {
    console.error('Error creating content_sets table:', contentSetsError);
  } else {
    console.log('content_sets table created.');
  }
  
  // Create content_paragraphs table
  const { error: paragraphsError } = await supabase.rpc('create_content_paragraphs_table');
  if (paragraphsError) {
    console.error('Error creating content_paragraphs table:', paragraphsError);
  } else {
    console.log('content_paragraphs table created.');
  }
  
  // Create content_wisdom_sections table
  const { error: wisdomError } = await supabase.rpc('create_content_wisdom_sections_table');
  if (wisdomError) {
    console.error('Error creating content_wisdom_sections table:', wisdomError);
  } else {
    console.log('content_wisdom_sections table created.');
  }
  
  // Create user_progress table
  const { error: progressError } = await supabase.rpc('create_user_progress_table');
  if (progressError) {
    console.error('Error creating user_progress table:', progressError);
  } else {
    console.log('user_progress table created.');
  }
  
  console.log('Schema setup completed.');
}

// This would be called when ready to migrate
async function main() {
  try {
    await createSchema();
    await migrateContentSets();
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Uncomment to run the migration
// main();

// Export the migration functions for external use
export { createSchema, migrateContentSets }; 