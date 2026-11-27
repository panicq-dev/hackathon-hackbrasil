INSERT INTO avatares_perfil (id, nome, ordem) VALUES
  ('avatar-16', 'Alex', 16),
  ('avatar-17', 'Samira', 17),
  ('avatar-18', 'Enzo', 18),
  ('avatar-19', 'Aisha', 19),
  ('avatar-20', 'Gael', 20),
  ('avatar-21', 'Joana', 21),
  ('avatar-22', 'Omar', 22),
  ('avatar-23', 'Helena', 23),
  ('avatar-24', 'Yasmin', 24),
  ('avatar-25', 'Noemi', 25)
ON CONFLICT (id) DO UPDATE
SET nome = EXCLUDED.nome, ordem = EXCLUDED.ordem;