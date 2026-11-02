# Correnteza Abissal

Jogo **original** do gênero *marble shooter* (atirador de esferas), o mesmo gênero de *Sparkle Unleashed* (PS4). Roda no navegador do Android e pode ser instalado na tela inicial como app (PWA), com funcionamento offline.

> Tema, arte, nomes, trajetos e fases são próprios. Nada foi copiado do jogo de referência: só as regras gerais do gênero, que são comuns a vários títulos.

---

## 1. Análise do jogo de referência (Sparkle Unleashed, gênero *marble shooter*)

### Loop principal
1. Uma **corrente de esferas coloridas** rola por um trilho fixo em direção a um **buraco/vórtice**.
2. O jogador controla um **lançador fixo** que só gira (mira 360°) e dispara a esfera da vez.
3. A esfera disparada **se encaixa na corrente** no ponto de impacto (antes ou depois da esfera atingida).
4. **3 ou mais esferas iguais** encostadas são destruídas.
5. Se uma esfera chegar ao buraco, a fase é perdida (perde-se uma vida).
6. A fase termina quando **todas as esferas** (inclusive as que ainda iam entrar) são destruídas.

### Regras e processos importantes
| Mecânica | Como funciona no gênero |
|---|---|
| Empurrão | Só o final da fila é empurrado; os segmentos da frente que se separaram **param**. |
| Atração magnética | Se as duas pontas de um vão têm a **mesma cor**, o segmento da frente **recua** até encostar. |
| Combo / reação em cadeia | Cada reencaixe que forma 3+ conta como combo e multiplica os pontos. |
| Sequência (*streak*) | Vários tiros seguidos que formam trio dão bônus; errar zera. |
| Munição inteligente | O lançador só oferece cores que **ainda existem** na mesa. |
| Troca | Dá para trocar a esfera atual pela próxima. |
| Entrada rápida | No início a corrente entra acelerada até ocupar parte do trilho. |
| Zona de perigo | Perto do buraco a corrente desacelera e há alerta sonoro/visual. |
| Power-ups | Esferas especiais: câmera lenta, ré, explosão, mira de precisão e similares. |
| Bônus flutuantes | Itens que aparecem fora do trilho e valem pontos se atingidos. |
| Progressão | Mundos/capítulos com trilhos novos, mais cores e mais velocidade. Na tela do PS4: troféus e modo "jogo completo". |

> A contagem de fases, os modos extras e a árvore de habilidades do *Sparkle Unleashed* variam por versão. Se precisar desses números exatos, confira na loja ou na página oficial.

### Curva de dificuldade (alavancas do gênero)
- **Número de cores** (4 → 6): é a alavanca mais forte.
- **Velocidade** da corrente e **tamanho total** da fila.
- **Geometria do trilho**: espirais escondem o fim; trilhos paralelos bloqueiam a mira; trilhos duplos dividem a atenção.

---

## 2. Como cada mecânica virou o Correnteza Abissal

| Gênero | Correnteza Abissal |
|---|---|
| Lançador | **Náutilo** no centro; a próxima pérola fica no centro da concha |
| Esferas | **Pérolas bioluminescentes** com símbolo próprio por cor (acessível para daltonismo) |
| Buraco | **Abismo**: vórtice que pulsa em vermelho no perigo |
| Mundos | **Zonas oceânicas reais**: Mesopelágica → Batipelágica → Abissopelágica → Hadal |
| Fases | **Infinitas**, em capítulos de 15. Profundidade de −150 m até −10.935 m (Fossa das Marianas) na fase 60, depois "Expedições" |
| Power-ups | Âncora (lento 6 s), Contracorrente (ré 3 s), Pulso (explosão), Sonar (mira completa + tiro rápido 10 s) |
| Bônus | Pérola dourada flutuante (+300) |
| Vidas | 3 vidas, vida extra a cada 15.000 pontos |

### Trajetos
`serpentina` (fileiras, lançador embaixo) · `espiral` / `espiralInv` (lançador no centro) · `canion` (espiral retangular) · `gemeas` (**duas filas ao mesmo tempo**) · `abismo` (espiral fechada) · `laco` e `retorno` (**trilhos que se cruzam, com túnel**).

Os túneis são detectados automaticamente: quando o trilho passa por baixo de um trecho anterior, aquele pedaço vira túnel. Ali as esferas ficam escondidas e não podem ser atingidas, e a pista de cima continua jogável.

### Pontuação
`pontos = esferas × 10 × combo + (combo − 1) × 50 + bônus de sequência`, mais um bônus de nível ao concluir.

### Modos de jogo
| Modo | Regra | Recorde salvo |
|---|---|---|
| Campanha | **Fases infinitas** em capítulos de 15; cada capítulo concluído dá uma medalha (conquista) | Pontos por fase |
| Sobrevivência | Fila infinita; velocidade sobe com o tempo; 5ª cor aos 60 s e 6ª aos 150 s; 1 vida | Tempo |
| Contra o relógio | 2 minutos; combos dão +N s; bônus dourado dá +5 s; deixar a fila cair custa −15 s | Pontos |

### Melhorias (loja)
A moeda (conchas no tema Oceano, créditos no tema Logística) vem das fases concluídas (1 a cada 100 pontos + 5 por fase) e do fim das partidas nos modos.

| Melhoria | Níveis | Efeito |
|---|---|---|
| Mira longa | 3 | Guia de 7 → 11 → 16 pontos → linha completa |
| Especiais duradouros | 3 | +25% de duração por nível |
| Explosão ampliada | 3 | Raio 100 → 160 px |
| Recarga rápida | 3 | Intervalo entre tiros 0,17 → 0,11 s |
| Sorte grande | 3 | +0,8 p.p. de chance de especial |
| Vida reserva | 1 | +1 vida inicial |

### Jogadores (vários perfis no mesmo aparelho)
- Até 8 jogadores por aparelho, cada um com apelido e cor.
- Cada jogador tem **progresso, pontuação, recordes, moedas, melhorias, conquistas, tema e som separados**.
- **Placar da casa** compara todos: recorde geral, fase da campanha, tempo na Sobrevivência e pontos no Contra o relógio.
- Aviso de **"Recorde da casa"** quando alguém passa a maior pontuação dos outros.
- Troca pelo botão "Trocar" no topo do menu. Excluir pede dois toques e apaga só o progresso daquele jogador.
- Quem já jogava na versão anterior vira automaticamente o "Jogador 1", sem perder nada (pode renomear em Trocar → Editar).
- Os perfis ficam **só no aparelho**: o placar compara quem joga no mesmo celular, não entre celulares diferentes.

### Conquistas
15 conquistas de desafio (combos, sequências, fases, túnel, modos, bônus, loja, Lume Dourado) **mais uma medalha a cada capítulo de 15 fases**: Bronze, Prata, Ouro, Platina, Diamante, Rubi, Safira, Esmeralda, Obsidiana e depois Lendário 1, 2, 3… Aviso na tela ao desbloquear.

### Temas
Troque em **Tema** no rodapé do menu (Oceano → Logística → Magia). Cada jogador guarda o seu.

| | Oceano | Logística | Magia (Academia Arcana) |
|---|---|---|---|
| Lançador | Náutilo | Empilhadeira | **Varinha** de madeira entalhada sobre um círculo de runas giratório; o orbe da vez brilha na ponta |
| Mira | Pontos | Pontos | Faíscas douradas em forma de estrela |
| Esferas | Pérolas | Volumes (caixas) | Orbes de vidro com um objeto mágico dentro, um por cor: **orbe estelar** (azul), **chama de fênix** (vermelho), **folha de mandrágora** (verde), **sol dourado** (amarelo), **lua mística** (roxo), **pena de coruja** (branco). Forma diferente por cor (acessível para daltonismo) |
| Fim do trilho | Abismo | Doca (luz verde/vermelha) | Caldeirão borbulhando (verde; vermelho no perigo) |
| Cenário | Fundo do mar, neve marinha | Pátio de cargas | **Um cenário por capítulo** (8, depois recomeçam como "Ano 9, 10…"): Castelo ao Luar (velas flutuantes), Floresta Encantada (vaga-lumes, cogumelos que brilham), Masmorra das Poções (tochas, prateleiras de frascos), Biblioteca Flutuante (livros voando), Lago Congelado (aurora, neve caindo), Observatório Astral (constelações, planeta com anel, cometas), Picos do Dragão (lava, brasas subindo) e Ilhas nas Nuvens (ilhas flutuantes, arco-íris). Cada um com cor de trilho, arco de túnel e líquido do caldeirão próprios |
| Túnel | Rocha | Viaduto | Arco de pedra |
| Fases | Profundidades (−150 m → −10.935 m → Expedições) | Rotas de 15 entregas: ímpares Taubaté → Brasília, pares na volta | 5 locais por cenário × I, II, III (ex.: "Trilha dos Vaga-lumes II") |
| Especiais | Âncora, Contracorrente, Pulso, Sonar | Freio motor, Marcha a ré, Expedição em lote, Rastreio GPS | Ampulheta, Feitiço reverso, Explosão arcana, Olho de coruja |
| Bônus | Pérola dourada | Moeda de frete | Grimório voador (+300) e, raro, o **Lume Dourado**: vaga-lume dourado que cruza a tela voando rápido (+1.500; +8 s no Contra o relógio) |
| Moeda da loja | Conchas | Créditos | Cristais |
| Fonte de títulos | Unbounded | Unbounded | Cinzel (serifa clássica) |

Os temas são genéricos. Logística não usa marca nem logotipo de nenhuma empresa.

**Sobre o tema Magia e propriedade intelectual:** ele foi pedido "ao estilo Harry Potter", mas usa só elementos comuns ao gênero escola de magia (varinha, castelo, caldeirão, velas, grimório, corujas, runas), compartilhados por muitas obras (Strixhaven, Witchbrook, Wizard101, Ikenfell). **Não usa** nomes, casas, brasões, personagens, feitiços, lugares, fontes ou itens característicos da franquia (pomo de ouro, cicatriz em raio, chapéu seletor, moedas próprias etc.). O pedido de "bola de ouro" virou o **Lume Dourado**: a mesma emoção de caçar um alvo dourado veloz, mas com desenho próprio (vaga-lume de quatro asas e cauda luminosa, não uma esfera alada). O cuidado vale porque o repositório e o APK são públicos, e a Warner Bros. já enviou notificações a eventos de fãs pelo uso de "nomes, lugares ou objetos" da série.

---

## 3. Como jogar no Android

**Opção 0: instalador APK (app nativo, offline)**
Baixe o `.apk` do Release mais recente (`correnteza-v1.0.N`) em github.com/RaphaelBarros24/pessoal/releases e instale. Detalhes, assinatura e como gerar novas versões em [`android/README.md`](android/README.md).

**Opção A: link do artifact (mais rápido)**
Abra o link no Chrome do celular e jogue. Para ficar como app: menu ⋮ → *Adicionar à tela inicial*.

**Opção B: hospedar como PWA (offline, tela cheia, ícone próprio)**
1. Publique a pasta `Jogos/correnteza-abissal/` em qualquer hospedagem estática HTTPS (GitHub Pages, Netlify, Cloudflare Pages).
2. No Chrome do Android, abra a URL → ⋮ → **Instalar app**.
3. Depois da primeira abertura, funciona sem internet (service worker em `sw.js`).

**Opção C: gerar APK / publicar na Play Store**
1. Com o PWA hospedado (opção B), use o **PWABuilder** (pwabuilder.com) → *Package for stores* → Android. Ele gera um APK/AAB no formato TWA.
2. Alternativa para desenvolvedores: `npx @bubblewrap/cli init --manifest https://SEU-DOMINIO/manifest.webmanifest`.
3. Para publicar na Play Store, é preciso conta de desenvolvedor Google e o arquivo `assetlinks.json` no domínio.

## 4. Controles
- **Toque**: arraste para mirar, solte para disparar. Toque no náutilo para trocar a pérola.
- **PC**: mova o mouse e clique. Espaço ou botão direito troca a pérola. `P`/`Esc` pausa.

## 5. Arquivos
| Arquivo | Função |
|---|---|
| `index.html` | O jogo inteiro (HTML + CSS + JS, sem dependências; fontes do Google com fallback) |
| `manifest.webmanifest` | Metadados de instalação (PWA) |
| `sw.js` | Cache offline |
| `icon.svg`, `icon-192.png`, `icon-512.png` | Ícones |
| `android/` | Projeto do app Android (WebView) que gera o instalador APK |

## 6. Privacidade (LGPD)
O jogo não coleta dados pessoais, não usa rede nem analytics. Só guarda no próprio aparelho (`localStorage`) os perfis de jogador (apelido e cor) e, de cada um, progresso, recordes, moedas, melhorias, conquistas, tema e preferência de som. A tela de criação orienta a usar **apelido** (minimização de dados, útil com crianças). Excluir um jogador apaga os dados dele; desinstalar o app ou limpar os dados do site apaga tudo.

## 7. Ideias para próximas versões
- Ranking compartilhado entre amigos/equipe (exige servidor; avaliar LGPD: só apelido, sem dado pessoal).
- Editor de trilhos.
- Desafio diário com semente fixa (todos jogam a mesma fila no dia).
