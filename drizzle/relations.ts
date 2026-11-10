import { relations } from "drizzle-orm/relations";
import { professores, turmas, alunos } from "./schema";

export const turmasRelations = relations(turmas, ({one, many}) => ({
	professore: one(professores, {
		fields: [turmas.professorId],
		references: [professores.id]
	}),
	alunos: many(alunos),
}));

export const professoresRelations = relations(professores, ({many}) => ({
	turmas: many(turmas),
}));

export const alunosRelations = relations(alunos, ({one}) => ({
	turma: one(turmas, {
		fields: [alunos.turmaId],
		references: [turmas.id]
	}),
}));