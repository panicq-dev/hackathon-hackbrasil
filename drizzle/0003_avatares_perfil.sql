CREATE TABLE IF NOT EXISTS avatares_perfil (
  id VARCHAR(32) PRIMARY KEY,
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS avatares_perfil_ordem_uidx
  ON avatares_perfil (ordem);

INSERT INTO avatares_perfil (id, nome, ordem) VALUES
  ('avatar-01', 'Aurora', 1),
  ('avatar-02', 'Caio', 2),
  ('avatar-03', 'Luna', 3),
  ('avatar-04', 'Davi', 4),
  ('avatar-05', 'Maya', 5),
  ('avatar-06', 'Theo', 6),
  ('avatar-07', 'Nina', 7),
  ('avatar-08', 'Ravi', 8),
  ('avatar-09', 'Bia', 9),
  ('avatar-10', 'Noah', 10),
  ('avatar-11', 'Iris', 11),
  ('avatar-12', 'Léo', 12),
  ('avatar-13', 'Sofia', 13),
  ('avatar-14', 'Miguel', 14),
  ('avatar-15', 'Yasmin', 15)
ON CONFLICT (id) DO UPDATE
SET nome = EXCLUDED.nome, ordem = EXCLUDED.ordem;

ALTER TABLE professores
  ADD COLUMN IF NOT EXISTS avatar_id VARCHAR(32);

ALTER TABLE alunos
  ADD COLUMN IF NOT EXISTS avatar_id VARCHAR(32);

UPDATE professores SET avatar_id = 'avatar-01' WHERE avatar_id IS NULL;
UPDATE alunos SET avatar_id = 'avatar-01' WHERE avatar_id IS NULL;

ALTER TABLE professores
  ALTER COLUMN avatar_id SET DEFAULT 'avatar-01',
  ALTER COLUMN avatar_id SET NOT NULL;

ALTER TABLE alunos
  ALTER COLUMN avatar_id SET DEFAULT 'avatar-01',
  ALTER COLUMN avatar_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'professores_avatar_id_fkey'
      AND conrelid = to_regclass('professores')
  ) THEN
    ALTER TABLE professores
      ADD CONSTRAINT professores_avatar_id_fkey
      FOREIGN KEY (avatar_id) REFERENCES avatares_perfil (id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'alunos_avatar_id_fkey'
      AND conrelid = to_regclass('alunos')
  ) THEN
    ALTER TABLE alunos
      ADD CONSTRAINT alunos_avatar_id_fkey
      FOREIGN KEY (avatar_id) REFERENCES avatares_perfil (id);
  END IF;
END $$;
