import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const { Pool } = pg;
const scriptDir = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(scriptDir, '..', '.env') });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não está configurada no arquivo .env.');
  process.exitCode = 1;
} else {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  async function aplicarMigracao() {
    let client;

    try {
      client = await pool.connect();
      await client.query('BEGIN');
      for (const migration of [
        '0001_lixeira_registros.sql',
        '0002_corrigir_alunos_de_turmas_arquivadas.sql',
        '0003_avatares_perfil.sql',
      ]) {
        const sql = fs.readFileSync(path.join(scriptDir, '..', 'drizzle', migration), 'utf8');
        await client.query(sql);
      }
      await client.query('COMMIT');
      console.log('Migrações aplicadas com sucesso.');
    } catch (error) {
      if (client) {
        await client.query('ROLLBACK');
      }
      throw error;
    } finally {
      if (client) client.release();
      await pool.end();
    }
  }

  aplicarMigracao().catch((error) => {
    console.error('Falha ao aplicar a migração da lixeira:', error.message);
    process.exitCode = 1;
  });
}
