const DEFAULT_CATEGORY_SEEDS = ["prompt", "skill", "rule", "template", "other"];

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
    lastEditor: row.last_editor,
    sourceMachine: row.source_machine,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeCategoryName(value) {
  return String(value || "").trim().toLowerCase();
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
        last_editor TEXT,
        source_machine TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      ALTER TABLE prompts
      ADD COLUMN IF NOT EXISTS last_editor TEXT;
    `);

    await pool.query(`
      ALTER TABLE prompts
      ADD COLUMN IF NOT EXISTS source_machine TEXT;
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_prompts_owner_id ON prompts(owner_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS prompt_categories (
        id BIGSERIAL PRIMARY KEY,
        owner_id TEXT NOT NULL,
        name TEXT NOT NULL,
        is_seed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_categories_owner_name_unique
      ON prompt_categories(owner_id, LOWER(name));
    `);
  }

  async function ensureCategory(ownerId, name, options = {}) {
    const normalized = normalizeCategoryName(name);
    if (!normalized) {
      return null;
    }

    const isSeed = Boolean(options.isSeed);
    await pool.query(
      `INSERT INTO prompt_categories (owner_id, name, is_seed)
       VALUES ($1, $2, $3)
       ON CONFLICT (owner_id, LOWER(name))
       DO NOTHING`,
      [ownerId, normalized, isSeed]
    );

    if (isSeed) {
      await pool.query(
        `UPDATE prompt_categories
         SET is_seed = TRUE,
             updated_at = NOW()
         WHERE owner_id = $1 AND LOWER(name) = LOWER($2) AND is_seed = FALSE`,
        [ownerId, normalized]
      );
    }

    const result = await pool.query(
      `SELECT id, owner_id, name, is_seed, created_at, updated_at
       FROM prompt_categories
       WHERE owner_id = $1 AND LOWER(name) = LOWER($2)
       LIMIT 1`,
      [ownerId, normalized]
    );
    return result.rows[0] || null;
  }

  async function ensureSeedCategories(ownerId) {
    for (const name of DEFAULT_CATEGORY_SEEDS) {
      await ensureCategory(ownerId, name, { isSeed: true });
    }
  }

  async function syncCategoriesFromPrompts(ownerId) {
    await pool.query(
      `INSERT INTO prompt_categories (owner_id, name, is_seed)
       SELECT $1, p.category, FALSE
       FROM (
         SELECT DISTINCT category
         FROM prompts
         WHERE owner_id = $1
           AND COALESCE(TRIM(category), '') <> ''
       ) p
       ON CONFLICT (owner_id, LOWER(name))
       DO NOTHING`,
      [ownerId]
    );
  }

  async function listCategories(ownerId) {
    await ensureSeedCategories(ownerId);
    await syncCategoriesFromPrompts(ownerId);

    const result = await pool.query(
      `SELECT
         pc.id,
         pc.name,
         pc.is_seed AS "isSeed",
         COALESCE(usage.usage_count, 0)::int AS "usageCount"
       FROM prompt_categories pc
       LEFT JOIN (
         SELECT category, COUNT(*)::int AS usage_count
         FROM prompts
         WHERE owner_id = $1
         GROUP BY category
       ) usage
         ON usage.category = pc.name
       WHERE pc.owner_id = $1
       ORDER BY pc.is_seed DESC, pc.name ASC`,
      [ownerId]
    );
    return result.rows;
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

    const limit = Math.min(Math.max(Number.parseInt(String(filters.limit || 10), 10) || 10, 1), 50);
    const offset = Math.max(Number.parseInt(String(filters.offset || 0), 10) || 0, 0);
    const whereClause = where.join(" AND ");
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM prompts WHERE ${whereClause}`,
      values
    );
    const queryValues = [...values, limit, offset];
    const query = `
      SELECT * FROM prompts
      WHERE ${whereClause}
      ORDER BY updated_at DESC, id DESC
      LIMIT $${queryValues.length - 1}
      OFFSET $${queryValues.length}
    `;
    const result = await pool.query(query, queryValues);
    return {
      items: result.rows.map(normalizeRow),
      total: Number(countResult.rows[0]?.total || 0)
    };
  }

  async function listAllByOwner(ownerId) {
    const result = await pool.query(
      `SELECT * FROM prompts
       WHERE owner_id = $1
       ORDER BY updated_at DESC, id DESC`,
      [ownerId]
    );
    return result.rows.map(normalizeRow);
  }

  async function findById(id, ownerId) {
    const result = await pool.query(
      "SELECT * FROM prompts WHERE id = $1 AND owner_id = $2",
      [id, ownerId]
    );
    return normalizeRow(result.rows[0]);
  }

  async function create(ownerId, payload, audit = {}) {
    await ensureCategory(ownerId, payload.category);
    const result = await pool.query(
      `INSERT INTO prompts (owner_id, title, content, category, tags, last_editor, source_machine)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        ownerId,
        payload.title,
        payload.content,
        payload.category,
        payload.tags,
        audit.lastEditor || ownerId,
        audit.sourceMachine || "unknown"
      ]
    );
    return normalizeRow(result.rows[0]);
  }

  async function importMany(ownerId, prompts, audit = {}) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const seenCategories = new Set();
      for (const prompt of prompts) {
        const normalizedCategory = normalizeCategoryName(prompt.category) || "prompt";
        seenCategories.add(normalizedCategory);
        await client.query(
          `INSERT INTO prompts (owner_id, title, content, category, tags, last_editor, source_machine)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            ownerId,
            prompt.title,
            prompt.content,
            normalizedCategory,
            prompt.tags,
            audit.lastEditor || ownerId,
            audit.sourceMachine || "unknown"
          ]
        );
      }
      await client.query("COMMIT");
      for (const category of seenCategories) {
        await ensureCategory(ownerId, category);
      }
      return prompts.length;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async function update(id, ownerId, payload, audit = {}) {
    await ensureCategory(ownerId, payload.category);
    const result = await pool.query(
      `UPDATE prompts
       SET title = $1,
           content = $2,
           category = $3,
           tags = $4,
           last_editor = $5,
           source_machine = $6,
           updated_at = NOW()
       WHERE id = $7 AND owner_id = $8
       RETURNING *`,
      [
        payload.title,
        payload.content,
        payload.category,
        payload.tags,
        audit.lastEditor || ownerId,
        audit.sourceMachine || "unknown",
        id,
        ownerId
      ]
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

  async function createCategory(ownerId, name) {
    return ensureCategory(ownerId, name);
  }

  async function removeCategory(id, ownerId) {
    const result = await pool.query(
      `DELETE FROM prompt_categories pc
       WHERE pc.id = $1
         AND pc.owner_id = $2
         AND pc.is_seed = FALSE
         AND NOT EXISTS (
           SELECT 1
           FROM prompts p
           WHERE p.owner_id = pc.owner_id
             AND p.category = pc.name
         )
       RETURNING pc.id`,
      [id, ownerId]
    );
    return result.rowCount > 0;
  }

  return {
    ensureSchema,
    listByOwner,
    listAllByOwner,
    listCategories,
    findById,
    create,
    createCategory,
    importMany,
    update,
    remove,
    removeCategory
  };
}

module.exports = { createPromptRepository };
