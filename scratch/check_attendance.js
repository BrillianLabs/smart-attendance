
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8')
  .split('\n')
  .reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {});

async function deleteDuplicates() {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  const duplicateIds = [
    'ebeeb99f-9bb1-4298-930a-365983d21d01', // SITI MARIYAM (06:20 WIB)
    '83e769bf-b27c-4bc7-8ba4-2e8d08d43c83', // SUHARTATIK (06:42 WIB)
    'b4c5bb0f-5adf-4caf-b1f3-c7f88a4e4689'  // SISWANTO (06:46 WIB)
  ];

  console.log('Deleting duplicate misdated records...');
  const { error } = await supabase
    .from('attendance')
    .delete()
    .in('id', duplicateIds);

  if (error) {
    console.error('Error deleting:', error);
  } else {
    console.log('Successfully deleted duplicates.');
  }
}

deleteDuplicates();
