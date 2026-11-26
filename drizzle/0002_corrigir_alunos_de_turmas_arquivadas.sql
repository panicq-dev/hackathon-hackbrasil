UPDATE alunos a
   SET ativo = FALSE,
       arquivada_em = COALESCE(a.arquivada_em, t.arquivada_em),
       lixeira_id = t.lixeira_id
  FROM turmas t
 WHERE t.id = a.turma_id
   AND t.arquivada_em IS NOT NULL
   AND t.lixeira_id IS NOT NULL
   AND a.ativo = TRUE;
