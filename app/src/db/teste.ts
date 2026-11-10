import { pool } from "./index";

async function testar() {
  // SELECT
  const { rows } = await pool.query("SELECT id, matricula, nome, email FROM alunos");
  console.log(rows);

  await pool.end();
}

testar().catch(console.error);
