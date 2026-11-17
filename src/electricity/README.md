# Revisão gamificada — Eletricidade Aplicada, prova 2

Rota: `#/eletricidade/prova-2`. O conteúdo e as figuras são autorais, em português, com matemática renderizada localmente por KaTeX. Não são publicados os PDFs da disciplina.

## Recorte documental

Plano fornecido: `/workdir/eletricidade/04608_EMB5121_20262.pdf`, seção IX. Intervalo: depois da Avaliação 01, de 23/09, até a Avaliação 02 prevista em 18/11/2026. O cronograma admite alterações.

| Bloco | Calendário | Material disponível / tratamento |
| --- | --- | --- |
| Métodos de análise em CA | 25/09–23/10 | Aula 08, 23 páginas, inspecionadas visualmente inclusive os circuitos e as soluções inseridas como imagens. Malhas, supermalhas, nós, supernó e fonte dependente. |
| Regime senoidal, teoremas em CA e potência | Itens 3.1–3.3 do programa | Pré-requisitos e complementos autorais. Pico/RMS e seno/cosseno sempre explicitados. |
| Geração, transmissão e distribuição | 30/10 | Sem slides específicos na pasta; complemento identificado, apoiado em ONS e EIA. |
| Trifásicos equilibrados | 04–06/11, itens 5.1–5.8 | Sem slides específicos; complemento identificado. Y, Δ, fontes, equivalente monofásico e potência. |
| Instrumentos e medidas | 11–13/11, itens 6.1–6.4 | Sem slides específicos; complemento identificado, com referências de fabricante. |

Não foram inspecionadas como matéria da prova 2 as Aulas 01–04, a Lista 1 ou as aulas/listas autônomas de transitórios RC/RL/RLC. Os elementos R/L/C entram apenas na análise senoidal. Segurança elétrica não é adicionada como capítulo de prova: aparecem apenas cuidados inerentes à medição discutida.

A Aula 08, p. 23, termina com amplitude temporal de 7,50 A, incompatível com o próprio resultado fasorial. Recalcular o sistema dá Ix = −2,4 + j7,2 A, módulo 7,589466 A. A missão registra a discrepância. Os exemplos nodais autorais explicitam referência em cosseno; o seno empregado em parte dos slides não é misturado silenciosamente.

As fontes externas usadas para complementar lacunas estão também acessíveis no painel “Escopo da prova e fontes”. Não há promessa de reproduzir questões ou a distribuição de pesos da avaliação real.

## Mecânica e estrutura

- 13 missões, 69 desafios; todos os setores disponíveis desde o início.
- Explicações graduais, exemplos resolvidos, diagramas de circuito e laboratórios interativos.
- 15 XP por primeiro acerto sem ajuda, 10 com dica/resolução; repetir não gera XP adicional.
- Erros não retiram pontos. Questões com ajuda permanecem em “Pontos frágeis” até acerto independente.
- Cada missão completa energiza um setor do campus.
- Simulado autoral sorteia uma questão por missão, sem limite de tempo e sem soluções antes da entrega.
- Progresso opcional em localStorage, chave `nicolle-eletricidade-prova2-v1`; navegar não o apaga.
- Inputs numéricos aceitam ponto/vírgula, têm envio visível e botão ± para teclados móveis sem sinal negativo.
- O fundo e o vidro continuam sendo os componentes oficiais do Nicrainha, L* 87.

`content.ts`: material e banco de perguntas. `math.ts`: cálculos e avaliação numérica. `labs.ts`: diagramas e experiências. `progress.ts`: progresso. `view.ts`: interface. `review.css`: apresentação.

`npm test` verifica o banco, todas as fórmulas TeX, exemplos complexos da aula recalculados independentemente, relações Y/Δ, entrada numérica e persistência/XP. Os fluxos completos de aprendizado e simulado foram também exercitados em Chromium e WebKit, incluindo input decimal em português, repetição sem XP extra, dificuldades, recarga e layout móvel.
