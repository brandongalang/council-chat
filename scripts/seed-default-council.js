const Database = require('better-sqlite3');
const crypto = require('crypto');

const db = new Database('sqlite.db');

// 1. Ensure local-user exists
try {
  db.prepare(`
    INSERT OR IGNORE INTO profiles (id, email, full_name)
    VALUES (?, ?, ?)
  `).run('local-user', 'local@example.com', 'Local User');
  console.log('Ensured local-user profile exists.');
} catch (err) {
  console.error('Error ensuring local-user:', err);
}

// 2. Create Balanced Council
const councilId = crypto.randomUUID();
const userId = 'local-user';
const name = 'Balanced Council';
const description = 'A balanced mix of leading models for general-purpose queries. The synthesizer analyzes each response for strengths and weaknesses before producing a final answer.';
const judgeModel = 'openai/gpt-4o';
const judgePrompt = `You are a synthesis expert. You will receive responses from multiple AI models to the same user query. Your task is to:

1. **Analyze each response** for its unique strengths and weaknesses
2. **Compare responses** to identify what each model does better or worse than others
3. **Synthesize** the best elements into a comprehensive final response

Format your response as:

## Analysis
[For each model, provide 2-3 bullet points on strengths and weaknesses]

## Synthesis Approach
[Explain which elements you re taking from which model and why]

## Final Response
[Your synthesized answer that incorporates the best of all responses]`;

const members = [
  { modelId: 'anthropic/claude-3.5-sonnet' },
  { modelId: 'openai/gpt-4o' },
  { modelId: 'google/gemini-2.0-flash-001' }
];

try {
  // Check if it already exists
  const existing = db.prepare('SELECT id FROM councils WHERE name = ? AND user_id = ?').get(name, userId);
  
  if (existing) {
    console.log('Balanced Council exists. Deleting to ensure fresh state...');
    db.prepare('DELETE FROM councils WHERE id = ?').run(existing.id);
  }

  const createCouncil = db.transaction(() => {
      db.prepare(`
        INSERT INTO councils (id, user_id, name, description, judge_model, judge_settings)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        councilId, 
        userId, 
        name, 
        description, 
        judgeModel, 
        JSON.stringify({ systemPrompt: judgePrompt })
      );

      const insertMember = db.prepare(`
        INSERT INTO council_models (id, council_id, model_id)
        VALUES (?, ?, ?)
      `);

      for (const member of members) {
        insertMember.run(crypto.randomUUID(), councilId, member.modelId);
      }
    });

    createCouncil();
    console.log('Created "Balanced Council" successfully.');
} catch (err) {
  console.error('Error creating council:', err);
}
