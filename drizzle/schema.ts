import { pgTable, uniqueIndex, integer, text, timestamp, index, foreignKey, varchar, unique, jsonb, boolean, pgSequence, uuid } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const avaliacaoCodigoSeq = pgSequence("avaliacao_codigo_seq", { startWith: "246", increment: "1", minValue: "1", maxValue: "9223372036854775807", cache: "1", cycle: false })

export const avataresPerfil = pgTable("avatares_perfil", {
	id: varchar({ length: 32 }).primaryKey().notNull(),
	nome: text().notNull(),
	ordem: integer().notNull(),
}, (table) => [
	uniqueIndex("avatares_perfil_ordem_uidx").on(table.ordem),
]);

export const professores = pgTable("professores", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "professores_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	nome: text().notNull(),
	email: text().notNull(),
	senhaHash: text("senha_hash").notNull(),
	avatarId: varchar("avatar_id", { length: 32 }).default("avatar-01").notNull(),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("professores_email_uidx").using("btree", sql`lower(email)`),
	foreignKey({
		columns: [table.avatarId],
		foreignColumns: [avataresPerfil.id],
		name: "professores_avatar_id_fkey"
	}),
]);

export const turmas = pgTable("turmas", {
	id: varchar({ length: 8 }).default(sql`gerar_codigo_turma()`).primaryKey().notNull(),
	professorId: integer("professor_id").notNull(),
	nome: text().notNull(),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	arquivadaEm: timestamp("arquivada_em", { withTimezone: true, mode: 'string' }),
	lixeiraId: uuid("lixeira_id"),
}, (table) => [
	index("turmas_professor_idx").using("btree", table.professorId.asc().nullsLast().op("int4_ops")),
	index("turmas_professor_arquivada_idx").on(table.professorId, table.arquivadaEm),
	uniqueIndex("turmas_professor_nome_unico_idx").on(table.professorId, sql`lower(btrim(${table.nome}))`),
	foreignKey({
			columns: [table.professorId],
			foreignColumns: [professores.id],
			name: "turmas_professor_id_fkey"
		}),
]);

export const alunos = pgTable("alunos", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "alunos_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	matricula: varchar({ length: 20 }).notNull(),
	nome: text().notNull(),
	email: text().notNull(),
	senhaHash: text("senha_hash").notNull(),
	avatarId: varchar("avatar_id", { length: 32 }).default("avatar-01").notNull(),
	turmaId: varchar("turma_id", { length: 8 }).notNull(),
	ativo: boolean().default(true).notNull(),
	arquivadaEm: timestamp("arquivada_em", { withTimezone: true, mode: 'string' }),
	lixeiraId: uuid("lixeira_id"),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("alunos_email_uidx").using("btree", sql`lower(email)`),
	index("alunos_turma_id_idx").using("btree", table.turmaId.asc().nullsLast().op("text_ops")),
	index("alunos_turma_ativo_idx").on(table.turmaId, table.ativo),
	foreignKey({
			columns: [table.turmaId],
			foreignColumns: [turmas.id],
			name: "alunos_turma_id_fkey"
		}),
		foreignKey({
			columns: [table.avatarId],
			foreignColumns: [avataresPerfil.id],
			name: "alunos_avatar_id_fkey"
		}),
	unique("alunos_matricula_key").on(table.matricula),
]);

export const materiasTag = pgTable("materias_tag", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "materias_tag_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	tag: text().notNull(),
}, (table) => [
	index("materias_tag_tag_idx").using("btree", sql`lower(tag)`),
	unique("materias_tag_tag_key").on(table.tag),
]);

export const questoes = pgTable("questoes", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "questoes_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	professorId: integer("professor_id").notNull(),
	materiaTagId: integer("materia_tag_id").notNull(),
	questao: jsonb().notNull(),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	publica: boolean().default(false).notNull(),
}, (table) => [
	index("questoes_materia_tag_idx").using("btree", table.materiaTagId.asc().nullsLast().op("int4_ops")),
	index("questoes_professor_idx").using("btree", table.professorId.asc().nullsLast().op("int4_ops")),
	index("questoes_publicas_idx").using("btree", table.criadoEm.desc().nullsFirst().op("timestamptz_ops")).where(sql`publica`),
	foreignKey({
			columns: [table.professorId],
			foreignColumns: [professores.id],
			name: "questoes_professor_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.materiaTagId],
			foreignColumns: [materiasTag.id],
			name: "questoes_materia_tag_id_fkey"
		}),
]);

export const questoesReacoes = pgTable("questoes_reacoes", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "questoes_reacoes_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	questaoId: integer("questao_id").notNull(),
	professorId: integer("professor_id").notNull(),
	tipo: varchar({ length: 10 }).notNull(),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("questoes_reacoes_questao_idx").using("btree", table.questaoId.asc().nullsLast().op("int4_ops")),
	index("questoes_reacoes_professor_idx").using("btree", table.professorId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.questaoId],
		foreignColumns: [questoes.id],
		name: "questoes_reacoes_questao_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.professorId],
		foreignColumns: [professores.id],
		name: "questoes_reacoes_professor_id_fkey"
	}).onDelete("cascade"),
	unique("questoes_reacoes_unique").on(table.questaoId, table.professorId),
]);

export const avaliacoes = pgTable("avaliacoes", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "avaliacoes_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	professorId: integer("professor_id").notNull(),
	turmaId: varchar("turma_id", { length: 8 }).notNull(),
	codigo: text().default(sql`('APM-'::text || nextval('avaliacao_codigo_seq'::regclass))`).notNull(),
	questoesIds: text("questoes_ids").default('').notNull(),
	ativo: boolean().default(true).notNull(),
	arquivadaEm: timestamp("arquivada_em", { withTimezone: true, mode: 'string' }),
	lixeiraId: uuid("lixeira_id"),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("avaliacoes_professor_idx").using("btree", table.professorId.asc().nullsLast().op("int4_ops")),
	index("avaliacoes_turma_idx").using("btree", table.turmaId.asc().nullsLast().op("text_ops")),
	index("avaliacoes_turma_ativo_idx").on(table.turmaId, table.ativo),
	foreignKey({
			columns: [table.professorId],
			foreignColumns: [professores.id],
			name: "avaliacoes_professor_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.turmaId],
			foreignColumns: [turmas.id],
			name: "avaliacoes_turma_id_fkey"
		}),
	unique("avaliacoes_codigo_key").on(table.codigo),
]);