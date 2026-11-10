import { pgTable, uniqueIndex, uuid, text, timestamp, index, foreignKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const professores = pgTable("professores", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	nome: text().notNull(),
	email: text().notNull(),
	senhaHash: text("senha_hash").notNull(),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("professores_email_uidx").using("btree", sql`lower(email)`),
]);

export const turmas = pgTable("turmas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	professorId: uuid("professor_id").notNull(),
	nome: text().notNull(),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("turmas_professor_idx").using("btree", table.professorId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.professorId],
			foreignColumns: [professores.id],
			name: "turmas_professor_id_fkey"
		}),
]);

export const alunos = pgTable("alunos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	nome: text().notNull(),
	email: text().notNull(),
	senhaHash: text("senha_hash").notNull(),
	turmaId: uuid("turma_id").notNull(),
	criadoEm: timestamp("criado_em", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("alunos_email_uidx").using("btree", sql`lower(email)`),
	index("alunos_turma_idx").using("btree", table.turmaId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.turmaId],
			foreignColumns: [turmas.id],
			name: "alunos_turma_id_fkey"
		}),
]);
