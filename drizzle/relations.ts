import { relations } from "drizzle-orm/relations";
import { professores, turmas, alunos, questoes, materiasTag, avaliacoes } from "./schema";

export const turmasRelations = relations(turmas, ({one, many}) => ({
	professore: one(professores, {
		fields: [turmas.professorId],
		references: [professores.id]
	}),
	alunos: many(alunos),
	avaliacoes: many(avaliacoes),
}));

export const professoresRelations = relations(professores, ({many}) => ({
	turmas: many(turmas),
	questoes: many(questoes),
	avaliacoes: many(avaliacoes),
}));

export const alunosRelations = relations(alunos, ({one}) => ({
	turma: one(turmas, {
		fields: [alunos.turmaId],
		references: [turmas.id]
	}),
}));

export const questoesRelations = relations(questoes, ({one}) => ({
	professore: one(professores, {
		fields: [questoes.professorId],
		references: [professores.id]
	}),
	materiasTag: one(materiasTag, {
		fields: [questoes.materiaTagId],
		references: [materiasTag.id]
	}),
}));

export const materiasTagRelations = relations(materiasTag, ({many}) => ({
	questoes: many(questoes),
}));

export const avaliacoesRelations = relations(avaliacoes, ({one}) => ({
	professore: one(professores, {
		fields: [avaliacoes.professorId],
		references: [professores.id]
	}),
	turma: one(turmas, {
		fields: [avaliacoes.turmaId],
		references: [turmas.id]
	}),
}));