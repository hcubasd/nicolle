# Nicolle

[Site de estudos de Nicolle](https://hcubasd.github.io/nicolle/), com disciplinas, atividades e materiais adicionados progressivamente ao longo da graduação. A página inicial organiza o acesso por disciplina; cada disciplina reúne suas próprias atividades.

Atualmente, o site contém **Grafos → Prim**, um jogo de resgate de bichinhos. Novas disciplinas, exercícios, jogos e materiais podem ser incorporados à mesma estrutura.

## Desenvolvimento

Use Node.js 23–26 e npm. Os testes também usam Python 3 (apenas a biblioteca padrão).

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
- `src/python/`: script de terminal e acompanhamento interativo da execução em Python.
- `public/`: recursos estáticos publicados com o site.
- `scripts/`: verificações e ferramentas de preparação de recursos.
- `.github/workflows/pages.yml`: testes, build e publicação no GitHub Pages.

A interface usa o motor visual dos exemplos do Nicrainha, com luminosidade fixa em L* 87, fundo Perlin e vidro refrativo. O canvas e a interface compartilham a mesma área visível; transições respeitam a preferência por movimento reduzido.

## Atividade atual: Prim

O jogador escolhe o número de ilhas e acompanha Prim para resgatar todos os animais com o menor custo. A interface aceita de 2 a 128 ilhas, ajustando valores fora desse intervalo. O modelo de grafos não impõe esse limite de interface.

Cada aventura começa em uma ilha aleatória, com um animal ao lado do personagem e um saldo igual ao custo de uma árvore geradora mínima. Prim indica a ponte mais barata que conecta a região resgatada a uma nova ilha. Para comprá-la, o jogador precisa caminhar até sua origem e selecionar a ilha vizinha. Caminhar pelas pontes já compradas é gratuito.

Resgatar todos os bichinhos encerra a partida com vitória. Se nenhuma ponte para um novo resgate couber no saldo, a partida termina explicando o impedimento, mesmo que ainda sobrem pontos. Os resultados aparecem no menu, com a opção de começar outra aventura.

O menu inicial apresenta as instruções; menus de retomada e resultados não as repetem. O progresso é salvo localmente enquanto o jogador permanece na atividade. Voltar a Grafos limpa a aventura e restaura o menu inicial. A música continua entre o menu e a partida. Um botão circular de música aparece no topo do menu, do jogo e da versão Python. Ele silencia somente a música; os efeitos de clique continuam ativos. Ao sair do navegador ou colocar a página em segundo plano, a música é silenciada. Voltar não a religa: o jogador usa o botão para ativá-la, com a interação exigida pelos navegadores móveis. A escolha de silêncio é salva localmente, e a posição da faixa é preservada ao silenciar. Na primeira interação após uma interrupção, o contexto de áudio pode ser recriado, reutilizando os sons decodificados, sem sobrepor faixas. Sair de Prim para Grafos interrompe a faixa.

O mapa pode ser arrastado no computador ou no celular. Começa centralizado no jogador e permanece sob controle manual. Os grafos usam amostragem de Poisson e triangulação de Delaunay, com custos derivados das distâncias entre ilhas.

Os animais mantêm seus tamanhos nativos. O jogador mantém o tamanho de exibição de 40 × 60; seus limites medidos nos quadros de 32 × 48 são escalados para posicionar o centro dos pés sobre o centro da ilha, sem alterar os animais. Um retângulo comum, medido nos pixels visíveis dos 16 quadros de cada personagem, define seu alinhamento sem alterar a animação. Para atualizar essas medidas após trocar imagens, instale Pillow e execute `python3 scripts/measure-sprites.py`. O animal inicial fica ao lado do jogador e passa a seguir a fila quando o jogador começa a caminhar; depois, os animais seguem o trajeto pelas pontes.

`npm test` compara Prim com uma implementação independente de árvore geradora mínima e verifica conectividade, custos, separação das ilhas, ausência de cruzamentos, compras, deslocamento gratuito, orçamento e rotas de voo de Prim.

## Python e execução acompanhada

O botão **Python** no menu de Prim abre `#/grafos/prim/python`. A página mostra o script completo, com opções para copiar ou baixar e executar no Python/Colab. O jogo de terminal usa números para identificar ilhas, uma rede aleatória conectada e os mesmos princípios de orçamento mínimo, compras, resgates e travessias gratuitas. O script não define um limite máximo de ilhas; tempo e memória disponíveis continuam limitando execuções grandes.

**Executar** inicia no pedido de quantidade de ilhas. **Próximo passo** avança entre pontos de acompanhamento; **Até entrada** continua até a próxima pergunta. Há dois painéis de vidro: um com o código inteiro e o terminal logo abaixo; outro com a narrativa da execução. A página rola verticalmente; o código mantém suas linhas originais e permite apenas rolagem horizontal quando necessário. Um guia no topo explica as pausas, a faixa cinza e o terminal. Executar não muda a posição de rolagem. O terminal recebe números com Enter, sem botões de envio ou cabeçalhos. Destinos gratuitos aparecem sem preço e `(Prim)` marca a próxima ilha recomendada, inclusive em uma travessia gratuita.

A faixa cinza marca a próxima linha, ainda não executada. A narrativa explica as linhas executadas desde a pausa anterior: definições e chamadas de funções, atribuições, passagens dos laços, resultados dos testes e retornos. Os valores relevantes aparecem no próprio texto, sem tabela geral de variáveis. Repetições são reunidas por linha, com contagem e os últimos valores; avaliações True/False são contadas separadamente. Etapas anteriores ficam disponíveis para reabrir. O código e os textos desaparecem gradualmente no banner superior. A música continua durante essa atividade.

O exemplo espera inteiros válidos, usando `int(input(...))` diretamente. Entradas não numéricas produzem o erro normal do Python. A checagem de movimentos impede viajar para ilhas que não estão entre as opções; não há uma camada extra de validação de entradas.

O Python roda de verdade em um Web Worker com Pyodide 0.29.2, carregado apenas ao executar. O build copia o runtime da dependência npm para o próprio site (aproximadamente 12 MB), sem depender de um CDN durante a execução. `src/python/prim.py` é o script independente; `public/grafos/python/instrument.py` acrescenta pausas à árvore sintática somente na execução acompanhada. O arquivo baixado não contém código de depuração. Os testes verificam que a versão acompanhada produz a mesma saída que o script original com a mesma sequência aleatória e entradas.

Os blocos de código têm fundo preto. As 12 cores ANSI cromáticas são mapeadas pela API `mapColors` do Nicrainha na mesma luminosidade da interface. Saída, entradas e explicações permanecem sobre vidro com texto escuro.

## Publicação

Um push em `main` executa o workflow do GitHub Actions: instala dependências, roda os testes, gera `dist/` e publica no GitHub Pages. Mudanças locais e servidores temporários de prévia não alteram o site publicado.

## Recursos e créditos

A atribuição do Nicrainha está em `LICENSES/nicrainha.txt`. Os avisos de Delaunator e robust-predicates estão em `public/licenses/`. Personagens, ícones e efeitos sonoros foram preparados a partir dos recursos fornecidos para o projeto.

O efeito de clique usa `public/grafos/audio/system01.wav`. A música de Prim está em `public/grafos/audio/prim.m4a`, extraída do vídeo fornecido sem recodificar o áudio. Somente os recursos usados no site são incluídos na publicação. As licenças do runtime estão em `public/licenses/pyodide.txt` e `public/licenses/cpython.txt`; seu código-fonte está em https://github.com/pyodide/pyodide/tree/0.29.2.
