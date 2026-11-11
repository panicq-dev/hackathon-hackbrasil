import { pool } from "./index";

async function testar() {
  const { rows } = await pool.query("SELECT * FROM alunos");
  console.log(rows);

  await pool.end();
}

testar().catch(console.error);
