import { pgTable, uniqueIndex, integer, text, timestamp, index, foreignKey, varchar, unique, jsonb, boolean, pgSequence } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const avaliacaoCodigoSeq = pgSequence("avaliacao_codigo_seq", { startWith: "246", increment: "1", minValue: "1", maxValue: "9223372036854775807", cache: "1", cycle: false })

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
	id: varchar({ length: 8 }).default(sql`gerar_codigo_turma()`).primaryKey().notNull(),
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
	turmaId: varchar("turma_id", { length: 8 }).notNull(),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("alunos_email_uidx").using("btree", sql`lower(email)`),
	index("alunos_turma_id_idx").using("btree", table.turmaId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.turmaId],
			foreignColumns: [turmas.id],
			name: "alunos_turma_id_fkey"
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

export const avaliacoes = pgTable("avaliacoes", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "avaliacoes_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	professorId: integer("professor_id").notNull(),
	turmaId: varchar("turma_id", { length: 8 }).notNull(),
	codigo: text().default(sql`('APM-'::text || nextval('avaliacao_codigo_seq'::regclass))`).notNull(),
	questoesIds: text("questoes_ids").default('').notNull(),
	ativo: boolean().default(true).notNull(),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("avaliacoes_professor_idx").using("btree", table.professorId.asc().nullsLast().op("int4_ops")),
	index("avaliacoes_turma_idx").using("btree", table.turmaId.asc().nullsLast().op("text_ops")),
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