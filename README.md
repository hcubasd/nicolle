# Nicolle

[Site de estudos de Nicolle](https://hcubasd.github.io/nicolle/), com disciplinas, atividades e materiais adicionados progressivamente ao longo da graduação. A página inicial organiza o acesso por disciplina; cada disciplina reúne suas próprias atividades.

Atualmente, o site contém **Grafos → Prim**, um jogo de resgate de bichinhos. Novas disciplinas, exercícios, jogos e materiais podem ser incorporados à mesma estrutura.

## Desenvolvimento

Use Node.js 23–26 e npm.

```sh
npm ci
npm run dev
```

O servidor de desenvolvimento escuta em todas as interfaces na porta 5173, permitindo acesso pelo endereço IP da máquina quando a rede permitir.

```sh
npm test       # verifica o modelo do jogo e os grafos gerados
npm run build # verifica TypeScript e gera o site em dist/
npm run preview
```

As rotas usam fragmentos de URL, funcionando diretamente no GitHub Pages. O título da aba é **Nicolle** em todas as páginas. A navegação mantém o fundo WebGL ativo entre as telas.

## Organização

- `src/main.ts`: navegação entre disciplinas e atividades.
- `src/scene.ts`, `src/engine/`: fundo animado e painéis de vidro, baseados no Nicrainha.
- `src/viewport.ts`: alinhamento da interface e do canvas à área visível, incluindo Safari no celular.
- `src/styles.css`: estilos compartilhados.
- `src/rescue/`: atividade de Prim, incluindo modelo, interface, personagens, áudio e estado da partida.
- `public/`: recursos estáticos publicados com o site.
- `scripts/`: verificações e ferramentas de preparação de recursos.
- `.github/workflows/pages.yml`: testes, build e publicação no GitHub Pages.

A interface usa o motor visual dos exemplos do Nicrainha, com luminosidade fixa em L* 87, fundo Perlin e vidro refrativo. O canvas e a interface compartilham a mesma área visível; transições respeitam a preferência por movimento reduzido.

## Atividade atual: Prim

O jogador escolhe o número de ilhas e acompanha Prim para resgatar todos os animais com o menor custo. A interface aceita de 2 a 128 ilhas, ajustando valores fora desse intervalo. O modelo de grafos não impõe esse limite de interface.

Cada aventura começa em uma ilha aleatória, com um animal ao lado do personagem e um saldo igual ao custo de uma árvore geradora mínima. Prim indica a ponte mais barata que conecta a região resgatada a uma nova ilha. Para comprá-la, o jogador precisa caminhar até sua origem e selecionar a ilha vizinha. Caminhar pelas pontes já compradas é gratuito.

Resgatar todos os bichinhos encerra a partida com vitória. Se nenhuma ponte para um novo resgate couber no saldo, a partida termina explicando o impedimento, mesmo que ainda sobrem pontos. Os resultados aparecem no menu, com a opção de começar outra aventura.

O menu inicial apresenta as instruções; menus de retomada e resultados não as repetem. O progresso é salvo localmente enquanto o jogador permanece na atividade. Voltar a Grafos limpa a aventura e restaura o menu inicial. A música continua entre o menu e a partida, parando ao sair de Prim. O navegador pode exigir uma interação para liberar o áudio após abrir uma página diretamente.

O mapa pode ser arrastado no computador ou no celular. Começa centralizado no jogador e permanece sob controle manual. Os grafos usam amostragem de Poisson e triangulação de Delaunay, com custos derivados das distâncias entre ilhas.

Os personagens mantêm seus tamanhos nativos. Um retângulo comum, medido nos pixels visíveis dos 16 quadros de cada personagem, define seu alinhamento sem alterar a animação. Para atualizar essas medidas após trocar imagens, instale Pillow e execute `python3 scripts/measure-sprites.py`. O animal inicial fica ao lado do jogador e passa a seguir a fila quando o jogador começa a caminhar; depois, os animais seguem o trajeto pelas pontes.

`npm test` compara Prim com uma implementação independente de árvore geradora mínima e verifica conectividade, custos, separação das ilhas, ausência de cruzamentos, compras, deslocamento gratuito, orçamento e rotas de voo de Prim.

## Publicação

Um push em `main` executa o workflow do GitHub Actions: instala dependências, roda os testes, gera `dist/` e publica no GitHub Pages. Mudanças locais e servidores temporários de prévia não alteram o site publicado.

## Recursos e créditos

A atribuição do Nicrainha está em `LICENSES/nicrainha.txt`. Os avisos de Delaunator e robust-predicates estão em `public/licenses/`. Personagens, ícones e efeitos sonoros foram preparados a partir dos recursos fornecidos para o projeto.

O efeito de clique usa `public/grafos/audio/system01.wav`. A música de Prim está em `public/grafos/audio/prim.m4a`, extraída do vídeo fornecido sem recodificar o áudio. Somente os recursos usados no site são incluídos na publicação.
