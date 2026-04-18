function normalizeRow(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    content: row.content,
    category: row.category,
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function createPromptRepository(pool) {
  async function ensureSchema() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS prompts (
        id BIGSERIAL PRIMARY KEY,
        owner_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'prompt',
        tags TEXT[] NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_prompts_owner_id ON prompts(owner_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);
    `);
  }

  async function listByOwner(ownerId, filters = {}) {
    const values = [ownerId];
    const where = ["owner_id = $1"];

    if (filters.category) {
      values.push(String(filters.category).toLowerCase());
      where.push(`category = $${values.length}`);
    }

    if (filters.search) {
      values.push(`%${String(filters.search).trim()}%`);
      where.push(`(title ILIKE $${values.length} OR content ILIKE $${values.length})`);
    }

    const query = `
      SELECT * FROM prompts
      WHERE ${where.join(" AND ")}
      ORDER BY updated_at DESC
    `;
    const result = await pool.query(query, values);
    return result.rows.map(normalizeRow);
  }

  async function findById(id, ownerId) {
    const result = await pool.query(
      "SELECT * FROM prompts WHERE id = $1 AND owner_id = $2",
      [id, ownerId]
    );
    return normalizeRow(result.rows[0]);
  }

  async function create(ownerId, payload) {
    const result = await pool.query(
      `INSERT INTO prompts (owner_id, title, content, category, tags)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [ownerId, payload.title, payload.content, payload.category, payload.tags]
    );
    return normalizeRow(result.rows[0]);
  }

  async function update(id, ownerId, payload) {
    const result = await pool.query(
      `UPDATE prompts
       SET title = $1,
           content = $2,
           category = $3,
           tags = $4,
           updated_at = NOW()
       WHERE id = $5 AND owner_id = $6
       RETURNING *`,
      [payload.title, payload.content, payload.category, payload.tags, id, ownerId]
    );
    return normalizeRow(result.rows[0]);
  }

  async function remove(id, ownerId) {
    const result = await pool.query(
      "DELETE FROM prompts WHERE id = $1 AND owner_id = $2",
      [id, ownerId]
    );
    return result.rowCount > 0;
  }

  return {
    ensureSchema,
    listByOwner,
    findById,
    create,
    update,
    remove
  };
}

module.exports = { createPromptRepository };
