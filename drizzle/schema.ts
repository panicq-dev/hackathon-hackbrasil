import { pgTable, uniqueIndex, integer, text, timestamp, index, foreignKey, unique, varchar, jsonb, boolean, pgSequence } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"


export const avaliacaoCodigoSeq = pgSequence("avaliacao_codigo_seq", {  startWith: "246", increment: "1", minValue: "1", maxValue: "9223372036854775807", cache: "1", cycle: false })

export const professores = pgTable("professores", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "professores_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	nome: text().notNull(),
	email: text().notNull(),
	senhaHash: text("senha_hash").notNull(),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("professores_email_uidx").using("btree", sql`lower(email)`),
]);

export const turmas = pgTable("turmas", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "turmas_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	professorId: integer("professor_id").notNull(),
	nome: text().notNull(),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("turmas_professor_idx").using("btree", table.professorId.asc().nullsLast().op("int4_ops")),
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
	turmaId: integer("turma_id").notNull(),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("alunos_email_uidx").using("btree", sql`lower(email)`),
	index("alunos_turma_idx").using("btree", table.turmaId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.turmaId],
			foreignColumns: [turmas.id],
			name: "alunos_turma_id_fkey"
		}),
	unique("alunos_matricula_key").on(table.matricula),
]);

export const questoes = pgTable("questoes", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "questoes_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	professorId: integer("professor_id").notNull(),
	questao: jsonb().notNull(),
	tags: text().default(').notNull(),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	publica: boolean().default(false).notNull(),
}, (table) => [
	index("questoes_professor_idx").using("btree", table.professorId.asc().nullsLast().op("int4_ops")),
	index("questoes_publicas_idx").using("btree", table.criadoEm.desc().nullsFirst().op("timestamptz_ops")).where(sql`publica`),
	foreignKey({
			columns: [table.professorId],
			foreignColumns: [professores.id],
			name: "questoes_professor_id_fkey"
		}).onDelete("cascade"),
]);

export const avaliacoes = pgTable("avaliacoes", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "avaliacoes_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	professorId: integer("professor_id").notNull(),
	codigo: text().default(sql`(\'APM-\'::text || nextval(\'avaliacao_codigo_seq\'::regclass))`).notNull(),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("avaliacoes_professor_idx").using("btree", table.professorId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.professorId],
			foreignColumns: [professores.id],
			name: "avaliacoes_professor_id_fkey"
		}).onDelete("cascade"),
	unique("avaliacoes_codigo_key").on(table.codigo),
]);

export const avaliacaoTags = pgTable("avaliacao_tags", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "avaliacao_tags_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	avaliacaoId: integer("avaliacao_id").notNull(),
	tag: text().notNull(),
}, (table) => [
	index("avaliacao_tags_tag_idx").using("btree", sql`lower(tag)`),
	foreignKey({
			columns: [table.avaliacaoId],
			foreignColumns: [avaliacoes.id],
			name: "avaliacao_tags_avaliacao_id_fkey"
		}).onDelete("cascade"),
	unique("avaliacao_tags_avaliacao_id_tag_key").on(table.avaliacaoId, table.tag),
]);
