import { relations } from "drizzle-orm/relations";
import { professores, turmas, alunos, questoes, avaliacoes, avaliacaoTags } from "./schema";

export const turmasRelations = relations(turmas, ({one, many}) => ({
	professore: one(professores, {
		fields: [turmas.professorId],
		references: [professores.id]
	}),
	alunos: many(alunos),
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
}));

export const avaliacoesRelations = relations(avaliacoes, ({one, many}) => ({
	professore: one(professores, {
		fields: [avaliacoes.professorId],
		references: [professores.id]
	}),
	avaliacaoTags: many(avaliacaoTags),
}));

export const avaliacaoTagsRelations = relations(avaliacaoTags, ({one}) => ({
	avaliacoe: one(avaliacoes, {
		fields: [avaliacaoTags.avaliacaoId],
		references: [avaliacoes.id]
	}),
}));