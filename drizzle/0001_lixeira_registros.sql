ALTER TABLE turmas
  ADD COLUMN IF NOT EXISTS arquivada_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lixeira_id UUID;

ALTER TABLE alunos
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS arquivada_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lixeira_id UUID;

ALTER TABLE avaliacoes
  ADD COLUMN IF NOT EXISTS arquivada_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lixeira_id UUID;

CREATE INDEX IF NOT EXISTS turmas_professor_arquivada_idx
  ON turmas (professor_id, arquivada_em);

CREATE UNIQUE INDEX IF NOT EXISTS turmas_professor_nome_unico_idx
  ON turmas (professor_id, lower(btrim(nome)));

CREATE INDEX IF NOT EXISTS alunos_turma_ativo_idx
  ON alunos (turma_id, ativo);

CREATE INDEX IF NOT EXISTS avaliacoes_turma_ativo_idx
  ON avaliacoes (turma_id, ativo);
