export const AVATARES_PERFIL = [
  { id: "avatar-01", nome: "Aurora", pele: "#F2C6A0", cabelo: "#513B32", roupa: "#F08A5D", fundo: "#FFE5D9", penteado: 0, oculos: false },
  { id: "avatar-02", nome: "Caio", pele: "#DDA77E", cabelo: "#26242A", roupa: "#3D8B8B", fundo: "#D9F1EC", penteado: 1, oculos: true },
  { id: "avatar-03", nome: "Luna", pele: "#8C533C", cabelo: "#211A19", roupa: "#8264B5", fundo: "#EAE0F7", penteado: 2, oculos: false },
  { id: "avatar-04", nome: "Davi", pele: "#F5D0B2", cabelo: "#9B5B32", roupa: "#4283C4", fundo: "#DDEBFA", penteado: 3, oculos: false },
  { id: "avatar-05", nome: "Maya", pele: "#C9855D", cabelo: "#3C2925", roupa: "#E2A72E", fundo: "#FFF1C9", penteado: 4, oculos: true },
  { id: "avatar-06", nome: "Theo", pele: "#EFC3A1", cabelo: "#69442F", roupa: "#D96579", fundo: "#FBE0E6", penteado: 2, oculos: false },
  { id: "avatar-07", nome: "Nina", pele: "#A76648", cabelo: "#201B1C", roupa: "#4F9B6C", fundo: "#DDF2E3", penteado: 3, oculos: true },
  { id: "avatar-08", nome: "Ravi", pele: "#F3CDA7", cabelo: "#3A2925", roupa: "#5377C6", fundo: "#E3E9FC", penteado: 4, oculos: false },
  { id: "avatar-09", nome: "Bia", pele: "#D9A17C", cabelo: "#6A3F2B", roupa: "#E2763D", fundo: "#FCE6D8", penteado: 0, oculos: true },
  { id: "avatar-10", nome: "Noah", pele: "#75452F", cabelo: "#171719", roupa: "#37A5A0", fundo: "#D9F3F0", penteado: 1, oculos: false },
  { id: "avatar-11", nome: "Iris", pele: "#F4D6BB", cabelo: "#A06C45", roupa: "#A15E9B", fundo: "#F4E2F2", penteado: 2, oculos: true },
  { id: "avatar-12", nome: "Léo", pele: "#B87855", cabelo: "#33231E", roupa: "#78983D", fundo: "#E9F0D8", penteado: 3, oculos: false },
  { id: "avatar-13", nome: "Sofia", pele: "#E8B899", cabelo: "#382326", roupa: "#DB6470", fundo: "#FCE2E4", penteado: 4, oculos: false },
  { id: "avatar-14", nome: "Miguel", pele: "#D29A72", cabelo: "#29211F", roupa: "#428EBD", fundo: "#DDF0F9", penteado: 0, oculos: true },
  { id: "avatar-15", nome: "Yasmin", pele: "#965C43", cabelo: "#21191B", roupa: "#C88D25", fundo: "#FFF0CE", penteado: 1, oculos: false },
  { id: "avatar-16", nome: "Alex", pele: "#F7E0C8", cabelo: "#B89362", roupa: "#345B86", fundo: "#E4F0FB", penteado: 5, oculos: false },
  { id: "avatar-17", nome: "Samira", pele: "#603D32", cabelo: "#171416", roupa: "#D65F79", fundo: "#F9E1E8", penteado: 6, oculos: true },
  { id: "avatar-18", nome: "Enzo", pele: "#D89A70", cabelo: "#A94D32", roupa: "#46876A", fundo: "#E0F2E6", penteado: 7, oculos: false },
  { id: "avatar-19", nome: "Aisha", pele: "#C58B68", cabelo: "#46312B", roupa: "#7A68B2", fundo: "#EEE8FA", penteado: 8, oculos: false },
  { id: "avatar-20", nome: "Gael", pele: "#F1C7A5", cabelo: "#4A332B", roupa: "#D19B2A", fundo: "#FFF2D0", penteado: 9, oculos: false },
  { id: "avatar-21", nome: "Joana", pele: "#8C5945", cabelo: "#211A19", roupa: "#398A91", fundo: "#DDF3F1", penteado: 5, oculos: true },
  { id: "avatar-22", nome: "Omar", pele: "#B87A59", cabelo: "#262020", roupa: "#3D73A8", fundo: "#E2EDFA", penteado: 6, oculos: false },
  { id: "avatar-23", nome: "Helena", pele: "#F4D6BF", cabelo: "#C06B47", roupa: "#A55C9D", fundo: "#F5E5F4", penteado: 7, oculos: false },
  { id: "avatar-24", nome: "Yasmin", pele: "#754A39", cabelo: "#21191B", roupa: "#CB7A36", fundo: "#FBE7D8", penteado: 8, oculos: true },
  { id: "avatar-25", nome: "Noemi", pele: "#D8AC8B", cabelo: "#3A2925", roupa: "#C95768", fundo: "#FCE5E8", penteado: 9, oculos: false },
] as const;

export type AvatarPerfilId = (typeof AVATARES_PERFIL)[number]["id"];

export function obterAvatarPerfil(id?: string | null) {
  return AVATARES_PERFIL.find((avatar) => avatar.id === id) ?? AVATARES_PERFIL[0];
}
