# Documento de Design do Sistema (design.md)
> **Especificação Canônica do Design System & Diretrizes de UI/UX para Análise e Geração por IA**  
> **Aplicação:** Plataforma de Avaliações Inteligentes (HackBrasil 2026 - APM)  
> **Público-alvo da documentação:** Agentes de IA, LLMs e Engenheiros de Software Frontend.  
> **Versão:** 1.0.0 — Atualizado para Next.js 16 (App Router), React 19 e Tailwind CSS v4.

---

## 1. Estética

### 1.1 Paradigma: Playful Neo-Brutalism (Pop EdTech Brutalist)
A aplicação adota o estilo **Neo-Brutalismo Lúdico** (*Playful Neo-Brutalism*), combinando:
1. **Contornos grossos e expressivos** (`border-[3px]` ou `border-2` na cor tinta `#0A2E4A`).
2. **Sombras duras projetadas sem desfoque** (*hard drop shadows*, ex: `shadow-[0_5px_0_0_#0A2E4A]`).
3. **Formas orgânicas e assimétricas** (raios de borda combinados que simulam recortes lúdicos, ex: `rounded-[30px_38px_28px_40px]`).
4. **Paleta vibrante e acolhedora** com amarelo caloroso, menta, azul elétrico, rosa suave e canvas azul-gelo.
5. **Microinterações mecânicas/táteis**: botões e cards que afundam (`active:translate-y-0.5` ou escala elástica) simulando botões físicos de brinquedo ou carimbos de papelaria moderna.

### 1.2 Princípios de Design 
Ao gerar qualquer interface neste sistema, a IA deve cumprir obrigatoriamente:
- **Tato Físico (Affordance Mecânica):** Elementos interativos devem parecer objetos físicos prensáveis.
- **Clareza Pedagógica:** Divisão nítida entre perfis (**Professor** = tons amarelos/segurança; **Aluno** = tons menta/formatura).
- **Consistência de Contorno e Sombra:** Qualquer card flutuante, botão principal ou input PRECISA do contorno escuro e da respectiva sombra dura.
- **Sem Degrades e Sem Sombras Difusas:** NUNCA usar `shadow-md`, `shadow-lg` ou `backdrop-filter` com sombras esfumaçadas. Apenas sombras duras com deslocamento em Y e zero blur.

---

## 2. Design Tokens 

### 2.1 Paleta de Cores

| Nome do Token | Hex Code | Tailwind Arbitrary Class | Papel Semântico & Aplicação |
|---|---|---|---|
| **Ink (Tinta Principal)** | `#0A2E4A` | `bg-[#0A2E4A]`, `text-[#0A2E4A]`, `border-[#0A2E4A]` | Cor de todas as bordas estruturais, sombras duras e textos principais. |
| **Canvas (Fundo Geral)** | `#F6FBFF` | `bg-[#F6FBFF]` | Fundo padrão de todas as páginas e telas da aplicação. |
| **Surface (Superfície)** | `#FFFFFF` | `bg-white` | Fundo de cartões, formulários, modais e barra superior. |
| **Yellow Sunflower** | `#FFC53D` | `bg-[#FFC53D]`, `text-[#FFC53D]` | Cor primária de destaque, perfil Professor, botão de ação e ícone ativo. |
| **Mint Cyan** | `#4ECDC4` | `bg-[#4ECDC4]` | Cor de destaque secundário, perfil Aluno, bolhas de ícones (`iconBubble`). |
| **Electric Blue** | `#2496ED` | `bg-[#2496ED]`, `text-[#2496ED]` | Ações primárias alternativas, links, loaders e anel de foco. |
| **Deep Blue Focus** | `#1D63ED` | `ring-[#1D63ED]/40` | Cor de anéis de acessibilidade e foco visível de teclado. |
| **Soft Blue Sky** | `#BFE3F7` | `bg-[#BFE3F7]` | Mancha ambiental de fundo (blob) e fundos de badges frios. |
| **Soft Cyan** | `#C6EFE9` | `bg-[#C6EFE9]` | Mancha ambiental de fundo (blob) e hover de itens de menu. |
| **Soft Butter Cream** | `#FFEFC2` | `bg-[#FFEFC2]` | Badge de perfil de professor e iluminação ambiental suave. |
| **Input Sky Tint** | `#EBF5FF` | `bg-[#EBF5FF]` | Fundo padrão de campos de entrada (inputs e textareas) e banners informativos. |
| **Alert Red Soft** | `#FFE3E3` | `bg-[#FFE3E3]`, `text-[#8A1F1F]` | Mensagens de erro, botão de logout e badges de alerta crítico. |
| **Success Green Soft** | `#D1F2D9` | `bg-[#D1F2D9]`, `text-[#0F5132]` | Confirmações de envio, status de acerto e perfil Aluno badge. |
| **Muted Slate Text** | `#4A6B85` | `text-[#4A6B85]` | Textos secundários, legendas de metadados e contadores. |
| **Placeholder Slate** | `#5A7C99` | `placeholder:text-[#5A7C99]` | Cor do texto reservado de formulários. |

#### Manchas de Fundo Ambientais (Blobs Decorativos)
Toda tela imersiva deve incluir na camada de fundo (`pointer-events-none absolute inset-0`):
```tsx
<div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
  <div className="absolute -left-24 top-10 h-72 w-72 rounded-[60%_40%_55%_45%] bg-[#BFE3F7]/70 blur-2xl" />
  <div className="absolute right-[-60px] top-1/3 h-80 w-80 rounded-[45%_55%_40%_60%] bg-[#C6EFE9]/70 blur-2xl" />
  <div className="absolute bottom-[-40px] left-1/3 h-64 w-64 rounded-[55%_45%_60%_40%] bg-[#FFEFC2]/80 blur-2xl" />
</div>
```

---

### 2.2 Tipografia

Três famílias de fontes Google Fonts com papéis estritos:

| Família | Importação / Font-Family | Pesos | Uso Mandatório |
|---|---|---|---|
| **Bricolage Grotesque** | `font-['Bricolage_Grotesque']` | `font-extrabold` (800), `font-bold` (700) | Títulos principais (H1, H2), logomarcas, números de destaque, tooltips de dock e carimbos. |
| **Baloo 2** | `font-['Baloo_2']` | `font-extrabold` (800), `font-bold` (700) | Subtítulos, rótulos de botões de ação, tabs, nomes de usuários e badges de status. |
| **Nunito** | `font-['Nunito']` | `font-semibold` (600), `font-bold` (700), `font-extrabold` (800) | Texto de corpo, enunciados de questões, inputs, descrições longas e listas. |

**Import Global nos componentes raiz:**
```html
<style>{`@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Baloo+2:wght@600;700;800&family=Nunito:wght@600;700;800&display=swap');`}</style>
```

---

### 2.3 Sistema de Sombras Duras (Hard Shadows)

> **Regra Suprema:** Sem blur (`0px` no terceiro parâmetro de box-shadow). A cor da sombra é sempre `#0A2E4A`.

| Token / Classe | Deslocamento Y | Aplicação |
|---|---|---|
| `shadow-[0_8px_0_0_#0A2E4A]` | 8px | Cartões Hero, Painel do Gerador IA, Modais de Tela Cheia. |
| `shadow-[0_5px_0_0_#0A2E4A]` | 5px | Barra Superior de Sessão, Dock Flutuante, Cards de Turma / Avaliação. |
| `shadow-[0_4px_0_0_#0A2E4A]` | 4px | Botões Primários Grandes, Bolinha de Dock Ativa. |
| `shadow-[0_3px_0_0_#0A2E4A]` | 3px | Inputs, Selects, Tabs Ativas, Botões Secundários. |
| `shadow-[0_2px_0_0_#0A2E4A]` | 2px | Badges clicáveis, Botão de Sair, Ações Rápidas. |
| `active:translate-y-0.5` ou `active:shadow-[0_1px_0_0_#0A2E4A]` | Compressão | Estado de clique mecânico em qualquer botão ou card interativo. |

---

### 2.4 Sistema de Bordas e Raios (Border & Radius)

1. **Espessura de Linhas:**
   - Contorno Mestre: `border-[3px] border-[#0A2E4A]` (Containers, cards, inputs mestres, dock).
   - Contorno Secundário: `border-2 border-[#0A2E4A]` (Badges, bolhas de ícones, botões pequenos).
   - Linha Delicada: `border border-[#0A2E4A]` (Tags internas muito pequenas).

2. **Formas Orgânicas Assimétricas (Classes de Borda Alternada):**
   ```css
   rounded-[30px_38px_28px_40px] /* Variante Orgânica A */
   rounded-[38px_28px_40px_30px] /* Variante Orgânica B */
   rounded-[34px_42px_30px_36px] /* Variante Orgânica C */
   rounded-[32px]                 /* Cards Padrão Grandes */
   rounded-[26px]                 /* Barra Superior de Usuário */
   rounded-[18px]                 /* Campos de Formulário */
   rounded-full                   /* Botões de Ação, Pílulas, Docks e Bolhas */
   ```

---

## 3. Especificação Canônica de Componentes

### 3.1 Dock de Navegação Flutuante ("Dock de Bolinhas")
Menu fixo acessível que se posiciona na **lateral esquerda em desktop** e na **parte inferior em mobile**.

```tsx
// Constantes base do Dock
const BOLINHA =
  'flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-[#0A2E4A] transition motion-safe:duration-200 group-hover:scale-110 group-active:scale-95';

const ROTULO = [
  'pointer-events-none absolute whitespace-nowrap rounded-full border-2 border-[#0A2E4A] bg-[#0A2E4A] px-3 py-1',
  "font-['Bricolage_Grotesque'] text-xs font-extrabold text-white",
  'opacity-0 transition motion-safe:duration-150 group-hover:opacity-100 group-focus-visible:opacity-100',
  'bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 group-hover:-translate-y-1',
  'md:bottom-auto md:left-[calc(100%+14px)] md:top-1/2 md:-translate-y-1/2 md:translate-x-0 md:group-hover:translate-x-1 md:group-hover:-translate-y-1/2',
].join(' ');

const FOCO =
  'group relative cursor-pointer rounded-full outline-none focus-visible:ring-4 focus-visible:ring-[#1D63ED]/40';

// Estrutura JSX
<nav
  aria-label="Navegação principal"
  className={[
    'fixed z-40 flex gap-4',
    'bottom-5 left-1/2 -translate-x-1/2 flex-row rounded-full border-[3px] border-[#0A2E4A] bg-white/90 px-4 py-3 shadow-[0_5px_0_0_#0A2E4A] backdrop-blur',
    'md:bottom-auto md:left-6 md:top-1/2 md:-translate-y-1/2 md:translate-x-0 md:flex-col md:px-3 md:py-4',
  ].join(' ')}
>
  {/* Item Ativo */}
  <button type="button" aria-current="page" className={FOCO}>
    <span className={`${BOLINHA} -translate-y-0.5 bg-[#FFC53D] shadow-[0_4px_0_0_#0A2E4A]`}>
      <ClipboardCheck className="h-6 w-6 text-[#0A2E4A]" strokeWidth={2.4} />
    </span>
    <span className={ROTULO}>Avaliações</span>
  </button>

  {/* Item Inativo */}
  <Link href="/dashboard" className={FOCO}>
    <span className={`${BOLINHA} bg-white group-hover:bg-[#C6EFE9]`}>
      <LayoutDashboard className="h-6 w-6 text-[#0A2E4A]" strokeWidth={2.4} />
    </span>
    <span className={ROTULO}>Dashboard</span>
  </Link>
</nav>
```

---

### 3.2 Barra Superior de Sessão (User Header Bar)
Fica fixada no topo da área útil com perfil diferenciado para Professor e Aluno:

```tsx
<div className="relative z-30 mx-auto mb-8 max-w-5xl">
  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[26px] border-[3px] border-[#0A2E4A] bg-white px-5 py-3 shadow-[0_5px_0_0_#0A2E4A]">
    <div className="flex items-center gap-3">
      {/* Avatar Pílula */}
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#0A2E4A] ${
          isProfessor ? 'bg-[#FFC53D]' : 'bg-[#4ECDC4]'
        }`}
      >
        {isProfessor ? <ShieldCheck className="h-5 w-5 text-[#0A2E4A]" /> : <GraduationCap className="h-5 w-5 text-[#0A2E4A]" />}
      </span>

      <div>
        <div className="flex items-center gap-2">
          <span className="font-['Baloo_2'] text-base font-extrabold leading-none text-[#0A2E4A]">
            {usuario.nome}
          </span>
          <span
            className={`rounded-full border border-[#0A2E4A] px-2.5 py-0.5 font-['Baloo_2'] text-[11px] font-extrabold ${
              isProfessor ? 'bg-[#FFEFC2] text-[#0A2E4A]' : 'bg-[#D1F2D9] text-[#0F5132]'
            }`}
          >
            {isProfessor ? 'Professor' : 'Aluno'}
          </span>
        </div>
        <p className="text-xs font-bold text-[#4A6B85]">
          {isProfessor ? usuario.email : `Turma: ${usuario.turmaId} • Matrícula: ${usuario.matricula}`}
        </p>
      </div>
    </div>

    {/* Ação de Logout */}
    <button
      onClick={handleLogout}
      className="flex cursor-pointer items-center gap-1 rounded-full border-2 border-[#0A2E4A] bg-[#FFE3E3] px-3.5 py-1.5 font-['Baloo_2'] text-xs font-extrabold text-[#8A1F1F] shadow-[0_2px_0_0_#0A2E4A] transition hover:brightness-105 active:translate-y-0.5"
    >
      <LogOut className="h-3.5 w-3.5" />
      <span>Sair da conta</span>
    </button>
  </div>
</div>
```

---

### 3.3 Campos de Formulário com "Icon Bubble"
Padrão exclusivo onde o ícone descansa dentro de uma bolha colorida com borda própria:

```tsx
<div className="relative">
  <label className="block font-['Baloo_2'] text-base font-bold text-[#14507F] mb-1.5">
    Nome do Campo
  </label>
  <div className="relative">
    {/* Bolha de Ícone */}
    <span className="pointer-events-none absolute left-[0.7rem] top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-[#4ECDC4]">
      <Mail className="h-3.5 w-3.5 text-[#0A2E4A]" />
    </span>

    {/* Input Base */}
    <input
      type="text"
      placeholder="Digite o valor..."
      className="w-full rounded-[18px] border-[3px] border-[#0A2E4A] bg-[#EBF5FF] py-3 pl-[3.1rem] pr-4 font-['Nunito'] text-xs font-semibold text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A] transition-shadow placeholder:font-normal placeholder:text-[#5A7C99] focus:outline-none focus:shadow-[0_3px_0_0_#0A2E4A,0_0_0_4px_rgba(36,150,237,0.3)]"
    />
  </div>
</div>
```

---

### 3.4 Cards Neo-Brutalistas Assimétricos (Bento Cards)
Utilizados para listar avaliações, turmas e métricas:

```tsx
<div className="group relative rounded-[32px] border-[3px] border-[#0A2E4A] bg-white p-6 shadow-[0_8px_0_0_#0A2E4A] transition-all hover:-translate-y-1 hover:shadow-[0_12px_0_0_#0A2E4A]">
  {/* Carimbo / Selo de Canto */}
  <div className="mb-4 flex items-center justify-between">
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#0A2E4A] bg-[#FFEFC2] px-3 py-1 font-['Baloo_2'] text-xs font-extrabold text-[#0A2E4A]">
      <Sparkles className="h-3.5 w-3.5 text-[#0A2E4A]" />
      APM-246
    </span>
    <span className="rounded-full border border-[#0A2E4A] bg-[#D1F2D9] px-2.5 py-0.5 font-['Baloo_2'] text-[11px] font-extrabold text-[#0F5132]">
      Ativa
    </span>
  </div>

  <h3 className="font-['Bricolage_Grotesque'] text-xl font-extrabold text-[#0A2E4A]">
    Avaliação de Matemática Aplicada
  </h3>
  <p className="mt-2 font-['Nunito'] text-sm font-semibold text-[#4A6B85]">
    10 Questões • Turma 3A • 28 Respostas
  </p>

  <div className="mt-6 flex items-center gap-3">
    <button className="flex-1 cursor-pointer rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D] py-2.5 font-['Baloo_2'] text-sm font-extrabold text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A] transition hover:brightness-105 active:translate-y-0.5">
      Ver Detalhes
    </button>
  </div>
</div>
```

---

### 3.5 Gerador de Avaliação com IA (`GeradorAvaliativo`)
Interface de comando onde o professor insere temas e solicita a geração via Gemini:

```tsx
<form className="relative w-full rounded-[32px] border-[3px] border-[#0A2E4A] bg-white p-6 shadow-[0_8px_0_0_#0A2E4A]">
  {/* Selo no topo */}
  <div className="mb-6 flex items-center gap-2">
    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0A2E4A] bg-[#FFC53D]">
      <Sparkles className="h-4 w-4 text-[#0A2E4A]" />
    </span>
    <h2 className="font-['Bricolage_Grotesque'] text-2xl font-extrabold text-[#0A2E4A]">
      Gerador de Avaliação Inteligente
    </h2>
  </div>

  {/* Textareas no estilo Neo-Brutalist */}
  <div className="space-y-4">
    <div>
      <label className="font-['Baloo_2'] text-sm font-bold text-[#0A2E4A]">Conteúdo Principal</label>
      <input
        type="text"
        placeholder="Ex: Funções Trigonométricas e Gráficos"
        className="mt-1 w-full rounded-[18px] border-[3px] border-[#0A2E4A] bg-[#EBF5FF] p-3 text-sm font-bold text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A] focus:outline-none"
      />
    </div>
    
    <div>
      <label className="font-['Baloo_2'] text-sm font-bold text-[#0A2E4A]">Orientações Detalhadas para a IA</label>
      <textarea
        rows={3}
        placeholder="Ex: Foque em aplicações práticas na física, nível médio..."
        className="mt-1 w-full rounded-[18px] border-[3px] border-[#0A2E4A] bg-[#EBF5FF] p-3 text-sm font-semibold text-[#0A2E4A] shadow-[0_3px_0_0_#0A2E4A] focus:outline-none"
      />
    </div>
  </div>

  {/* Botão de Disparo */}
  <button
    type="submit"
    className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-[3px] border-[#0A2E4A] bg-[#FFC53D] py-3.5 font-['Baloo_2'] text-base font-extrabold text-[#0A2E4A] shadow-[0_4px_0_0_#0A2E4A] transition hover:brightness-105 active:translate-y-0.5"
  >
    <Sparkles className="h-5 w-5 text-[#0A2E4A]" />
    <span>Gerar Avaliação com Gemini IA</span>
  </button>
</form>
```

---

### 3.6 Motor de Resolução de Questões (`Questão` e `Avaliação`)
Renderização de cada item de prova para os alunos:
- **Enunciado:** Em caixa com fundo branco, borda `border-[3px] border-[#0A2E4A]`, tipografia `Nunito` font-bold.
- **Campos de Validação (`camposValidacao`):**
  - **Texto/Número:** Inputs com `bg-[#EBF5FF]` e sombra dura `shadow-[0_3px_0_0_#0A2E4A]`.
  - **Alternativas:** Botões estilo cápsula redonda (`rounded-full`) que alternam entre branco (inativo) e `#FFC53D` (selecionado).
- **Mapeamento de Erros:** Utilizado pelo backend para correção inteligente sem expor o gabarito cru diretamente.

---

### 3.7 Alertas e Banners de Notificação (Feedbacks)

```tsx
// Sucesso
<div className="flex items-center gap-2 rounded-[20px] border-2 border-[#0A2E4A] bg-[#D1F2D9] px-4 py-3 font-['Nunito'] text-sm font-bold text-[#0F5132] shadow-[0_3px_0_0_#0A2E4A]">
  <CheckCircle2 className="h-5 w-5 text-[#0F5132]" />
  <span>Suas respostas foram gravadas com sucesso!</span>
</div>

// Erro / Validação
<div className="flex items-center gap-2 rounded-[20px] border-2 border-[#0A2E4A] bg-[#FFE3E3] px-4 py-3 font-['Nunito'] text-sm font-bold text-[#8A1F1F] shadow-[0_3px_0_0_#0A2E4A]">
  <AlertCircle className="h-5 w-5 text-[#8A1F1F]" />
  <span>Preencha todos os campos obrigatórios antes de prosseguir.</span>
</div>
```

---

## 4. Estrutura de Telas e Grid System

### 4.1 Layout Base Global
- **Padding do Container:**  
  Mobile: `px-5 pb-32 pt-6`  
  Desktop: `md:pl-32 md:pr-10 md:pb-16` (reserva espaço para o Dock na lateral esquerda).
- **Largura Máxima:** `max-w-5xl` ou `max-w-6xl` centralizado (`mx-auto`).
- **Camada Z-Index:**
  - `z-0`: Blobs de iluminação de fundo (`blur-2xl`).
  - `z-10`: Conteúdo e cards da página.
  - `z-30`: Barra superior de usuário.
  - `z-40`: Dock de navegação flutuante.
  - `z-50`: Modais e gavetas suspensas.

---

## 5. Regras Rígidas para IAs Analisarem e Gerarem Código (Guia de Compliance)

### 5.1 O que a IA SEMPRE deve fazer (DOs)
1. **SEMPRE usar `#0A2E4A`** em todas as bordas (`border-[#0A2E4A]`) e sombras (`shadow-[0_Xpx_0_0_#0A2E4A]`).
2. **SEMPRE incluir o Dock de Navegação** (`nav` com classes `fixed` e bolinhas) nas páginas logadas.
3. **SEMPRE aplicar transição tátil em botões:** `transition motion-safe:duration-150 hover:brightness-105 active:translate-y-0.5`.
4. **SEMPRE usar a trinca tipográfica correta:**
   - `font-['Bricolage_Grotesque']` para títulos de peso.
   - `font-['Baloo_2']` para botões, subtítulos e badges.
   - `font-['Nunito']` para texto regular de leitura e formulários.
5. **SEMPRE cercar inputs de formulário** com o componente `iconBubble` e fundo `bg-[#EBF5FF]`.
6. **SEMPRE diferenciar perfis:** Professor utiliza matizes de amarelo (`#FFC53D` e `#FFEFC2`); Aluno utiliza matizes de menta/verde (`#4ECDC4` e `#D1F2D9`).

### 5.2 O que a IA NUNCA deve fazer (DON'Ts)
1. **NUNCA usar classes padrão de sombra suave do Tailwind** como `shadow-sm`, `shadow-md`, `shadow-lg` ou `shadow-xl`. Toda sombra DEVE ser dura e opaca: `shadow-[0_Xpx_0_0_#0A2E4A]`.
2. **NUNCA usar cinzas convencionais desbotados** (ex: `bg-gray-100`, `border-gray-300`, `text-gray-500`) em componentes estilizados. Usar a paleta de azuis e slate (`#F6FBFF`, `#EBF5FF`, `#4A6B85`, `#0A2E4A`).
3. **NUNCA deixar botões com cantos vivos ou retangulares comuns.** Devem ser arredondados (`rounded-full`, `rounded-[18px]` ou `rounded-[24px]`).
4. **NUNCA omitir o contorno escuro.** Se houver um card ou elemento em destaque sobre o canvas, ele obrigatoriamente tem `border-[3px] border-[#0A2E4A]` ou `border-2 border-[#0A2E4A]`.
5. **NUNCA inventar cores neon ou gradientes genéricos.** Atenha-se estritamente à paleta declarada no item 2.1 deste manual.

---

## 6. Dicionário Rápido de Classes Tailwind

```ts
export const THEME_CLASSES = {
  // Bordas
  borderMaster: "border-[3px] border-[#0A2E4A]",
  borderBadge: "border-2 border-[#0A2E4A]",
  
  // Sombras
  shadowHero: "shadow-[0_8px_0_0_#0A2E4A]",
  shadowCard: "shadow-[0_5px_0_0_#0A2E4A]",
  shadowButton: "shadow-[0_4px_0_0_#0A2E4A]",
  shadowInput: "shadow-[0_3px_0_0_#0A2E4A]",
  shadowSmall: "shadow-[0_2px_0_0_#0A2E4A]",
  
  // Fontes
  fontTitle: "font-['Bricolage_Grotesque']",
  fontAction: "font-['Baloo_2']",
  fontBody: "font-['Nunito']",
  
  // Interações
  tactileButton: "cursor-pointer transition hover:brightness-105 active:translate-y-0.5",
  tactileCard: "transition-all hover:-translate-y-1 hover:shadow-[0_12px_0_0_#0A2E4A]",
  
  // Paleta de Fundos
  bgCanvas: "bg-[#F6FBFF]",
  bgInput: "bg-[#EBF5FF]",
  bgYellow: "bg-[#FFC53D]",
  bgMint: "bg-[#4ECDC4]",
  bgBlue: "bg-[#2496ED]",
  bgCream: "bg-[#FFEFC2]",
  bgError: "bg-[#FFE3E3]",
  bgSuccess: "bg-[#D1F2D9]",
};
```
