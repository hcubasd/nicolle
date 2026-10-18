export interface Execution {line:number;scope:string;kind:string;values:Record<string,unknown>;count:number;sizes?:Record<string,number>;tails?:Record<string,unknown>;result?:unknown;yes?:number;no?:number;}
export interface Pause {type:'pause'|'input'|'done'|'error';line?:number;scope?:string;values?:Record<string,unknown>;events?:Execution[];prompt?:string;text?:string;}
// Stops delimit meaningful stretches; the journal also covers unpaused lines.
export const stops=[
 'pontes = []','for a in range(quantidade - 2)','animais = [','saldo = prim(',
 'melhor = None','a, b, custo = pontes[numero]','return melhor',
 'grupo = [0]','numero = ponte_mais_barata(pontes, grupo)','return total',
 'fila = [[inicio]]','rota = fila.pop(0)','return rota',
 'print("\\nIlha"','opcoes = []','local, numero, preco = movimento',
 'if len(resgatadas) == quantidade',
];
export function breakpoints(source:string):number[] {return source.split('\n').flatMap((line,i)=>stops.some(prefix=>line.trim().startsWith(prefix))?[i+1]:[]);}
export function value(value:unknown):string {
 if(value===undefined)return 'ainda não definido';
 if(value===null)return 'None';
 if(typeof value==='boolean')return value?'True':'False';
 if(Array.isArray(value))return '['+value.map(v=>typeof v==='string'&&v.startsWith('... mais')?v:valueText(v)).join(', ')+']';
 return valueText(value);
}
function valueText(v:unknown):string {return typeof v==='string'?JSON.stringify(v):String(v);}
function named(v:Record<string,unknown>,name:string):string {return `${name} = ${value(v[name])}`;}

export function explain(entry:Execution,source:string):string {
 const line=source.trim(),v=entry.values;
 const n=(name:string)=>named(v,name);
 let text='';
 if(entry.kind==='call'){
  text=entry.scope==='ponte_mais_barata'?`O programa chamou ponte_mais_barata e entrou no seu corpo. Ela recebeu ${entry.sizes?.pontes??'?'} pontes e o grupo ${value(v.resgatadas)}. Dentro desta função, o grupo recebido se chama resgatadas, mesmo quando quem chamou passou a variável grupo de prim(). A busca não altera essa lista.`:entry.scope==='prim'?`A linha saldo = prim(pontes, quantidade) chamou prim() com quantidade = ${value(v.quantidade)}. A atribuição do saldo ficou esperando: primeiro precisamos executar o corpo desta função até seu return. Por isso a execução saltou para o início do código.`:`A chamada caminho() entrou na função com inicio = ${value(v.inicio)} e destino = ${value(v.destino)}. Esses parâmetros receberam a posição do jogador e a origem da ponte de Prim. A busca usa apenas as pontes compradas e vai devolver uma rota, sem mover o jogador.`;
 }else if(entry.kind==='definition'){
  const name=line.match(/def (\w+)/)?.[1];
  text=`def guardou a função ${name} para usar depois. ${name==='ponte_mais_barata'?'Ela vai procurar a ponte mais barata que saia de um grupo.':name==='prim'?'Ela vai calcular o custo mínimo para conectar todas as ilhas.':'Ela vai encontrar a direção até Prim usando pontes já compradas.'} As linhas recuadas dentro dela não foram executadas agora. Os nomes entre parênteses são os valores que ela receberá quando for chamada.`;
 }else if(line==='import random')text='import random disponibilizou os sorteios. Importar o módulo não cria o mapa nem chama as funções do jogo.';
 else if(entry.kind==='return')text=`return encerrou esta chamada de ${entry.scope}() e devolveu ${value(entry.result)} à linha que estava esperando o resultado. As variáveis desta chamada pertencem à função; não substituem automaticamente as variáveis do jogo.`;
 else if(entry.kind==='iteration'||entry.kind==='loop'){
  const target=line.match(/^for (\w+)/)?.[1]??'';
  const range=(line.includes('range(')?'range gera uma sequência de inteiros; o limite final fica de fora. Com um argumento, começa em 0. ':'')+(line.includes('len(')?'len conta os itens da lista para definir quantas posições percorrer. ':'');
  const purpose=line.includes('range(1, quantidade)')?'Cada ilha nova recebe uma ponte para uma anterior, garantindo que o mapa seja conectado.':line.includes('range(quantidade - 2)')?'Este laço tenta acrescentar uma ponte entre cada ilha a e a ilha a + 2.':line.includes('for ponte in pontes')?'Examinamos as pontes existentes para não criar uma repetida.':line.includes('for numero in compradas')?'Só as pontes compradas podem fazer parte do caminho gratuito.':line.includes('for opcao in opcoes')?'Cada opção é comparada com o número digitado.':'O corpo recuado examina um item por vez, na ordem da lista.';
  text=entry.kind==='loop'?`Este for terminou de percorrer sua sequência. ${range}${purpose}`:`O for começou uma passagem com ${n(target)}. ${range}${purpose}`;
 }else if(entry.kind==='condition'){
  const tests:[string,string][]=[
   ['if (a in resgatadas) != (b in resgatadas)',`in verifica presença na lista recebida. != exige que as duas respostas sejam diferentes: uma ponta dentro e outra fora. A ponte examinada liga ${value(v.a)} a ${value(v.b)} e custa ${value(v.custo)}. Isso evita comprar uma ligação interna e formar um ciclo.`],
   ['if melhor is None or custo < pontes[melhor][2]',`None representa a ausência de candidata. or aceita a primeira ponte válida ou uma mais barata que a candidata atual. Python só avalia o segundo lado quando precisa, evitando consultar pontes[None]. O índice [2] é o terceiro item da ponte: seu custo. Aqui ${n('melhor')} e ${n('custo')}.`],
   ['while len(grupo)',`len conta itens. A função continua enquanto o grupo conectado tiver menos de ${value(v.quantidade)} ilhas. O grupo desta chamada é ${value(v.grupo)}.`],
   ['if a in grupo',`A ponte escolhida tem uma ponta já conectada e outra nova. Testamos se a ilha ${value(v.a)} já está em grupo para decidir qual ponta acrescentar.`],
   ['while len(fila)',`Enquanto fila tiver alguma rota para examinar, a busca de caminho continua. Aqui ${n('fila')}.`],
   ['if atual == destino',`== compara valores, sem alterá-los. A última ilha desta rota é ${value(v.atual)}; a ilha procurada é ${value(v.destino)}.`],
   ['if a == atual and b not in rota',`and exige as duas condições: a ponte começa na ilha ${value(v.atual)} e sua outra ponta ainda não aparece em ${value(v.rota)}. not in evita voltar para dentro da mesma rota.`],
   ['if b == atual and a not in rota',`Uma ponte pode ser atravessada nos dois sentidos. Conferimos a direção contrária: b precisa ser a ilha atual e a ainda não pode aparecer nesta rota.`],
   ['if ponte[0] == a and ponte[1] == b',`Os índices [0] e [1] leem as pontas da ponte existente. and exige que ambas coincidam com a ligação ${value(v.a)} → ${value(v.b)} que estamos tentando criar.`],
   ['if not existe',`existe indica se a ponte já foi encontrada. not inverte True e False: só criamos a alternativa quando ainda não existe.`],
   ['while len(resgatadas)',`len(resgatadas) conta os animais salvos: ${Array.isArray(v.resgatadas)?value(v.resgatadas):'veja os resgates'}. O laço do jogo só continua enquanto faltarem ilhas.`],
   ['if custo > saldo',`A saída mais barata da região custa ${value(v.custo)} e o saldo é ${value(v.saldo)}. Se nem essa ponte couber, nenhuma nova compra é possível, mesmo com algum saldo restante.`],
   ['if b in resgatadas',`A ponte de Prim pode estar escrita em qualquer direção. Esta comparação identifica sua ponta já resgatada, para orientar a caminhada.`],
   ['if local != origem',`!= pergunta se os valores são diferentes. O jogador está na ilha ${value(v.local)} e a ponte de Prim sai da ilha ${value(v.origem)}. Se forem diferentes, precisamos encontrar um caminho gratuito até a origem.`],
   ['if a == local',`A ponta a é comparada com a posição atual, ${value(v.local)}. Se coincidir, b é uma ilha vizinha.`],
   ['if b == local',`Também testamos a outra ponta, pois as pontes funcionam nos dois sentidos. Se b for a posição atual, a é a vizinha.`],
   ['if vizinha is not None',`None significa que esta ponte não toca a posição atual. A condição também exige uma ilha ainda não resgatada ou uma ponte já comprada. Assim, não compramos uma ponte extra entre duas ilhas já salvas. Aqui ${n('vizinha')}.`],
   ['if numero in compradas',`in verifica se a ponte ${value(v.numero)} já foi paga. Se foi, sua travessia tem preço zero, sem descontar o saldo novamente.`],
   ['if preco <= saldo',`<= significa menor ou igual. Só oferecemos este movimento se o preço ${value(v.preco)} couber no saldo ${value(v.saldo)}.`],
   ['if preco > 0',`Só acrescentamos o custo à linha do destino se houver algo a pagar. Um movimento gratuito aparece sem preço, em vez de mostrar zero.`],
   ['if vizinha == passo',`passo é a próxima ilha no caminho até Prim. A vizinha ${value(v.vizinha)} recebe (Prim) quando coincide com ${value(v.passo)}, mesmo se a travessia for gratuita.`],
   ['if opcao[0] == escolha',`[0] lê o número da ilha nesta opção. Ele é comparado com a escolha digitada, ${value(v.escolha)}.`],
   ['if movimento is None',`Se nenhuma opção coincidiu com a escolha, movimento continua None. O jogo avisa e volta à rodada sem mover o jogador nem gastar pontos.`],
   ['if numero not in compradas',`not in verifica se a ponte ${value(v.numero)} ainda não foi comprada. Só uma ponte nova precisa ser registrada, paga e acrescentar um resgate.`],
   ['if len(resgatadas) == quantidade',`Comparamos o número de resgates com a quantidade de ilhas. Se forem iguais, todos os animais foram salvos e podemos anunciar a vitória.`],
  ];
  text=tests.find(([prefix])=>line.startsWith(prefix))?.[1]??`Python avaliou a condição ${line.replace(/:$/,'')}.`;
  text+=entry.count>1?` Neste trecho, o teste deu True ${entry.yes??0} vez(es) e False ${entry.no??0} vez(es). Os valores citados são da última avaliação.`:` O resultado foi ${value(entry.result)}: ${entry.result?'entrou no corpo recuado':'pulou o corpo recuado ou saiu do while'}.`;
 }else if(line==='break')text='break saiu do laço imediatamente: não há saldo suficiente para continuar os resgates.';
 else if(line==='continue')text='continue voltou ao início da próxima rodada, sem executar as compras que vêm abaixo.';
 else if(line.includes('.append(')){
  const list=line.split('.')[0];
  const purpose=list==='pontes'?'Acrescentamos [origem, destino, custo]. random.randint(1, 9) sorteia um inteiro de 1 até 9, incluindo os dois limites.':list==='grupo'?'A nova ilha passa a fazer parte da região conectada no cálculo de Prim.':list==='fila'?'rota + [ilha] cria uma nova lista prolongando a rota atual, sem modificar a antiga. A busca examinará essa alternativa depois.':list==='compradas'?'Registramos o número da ponte para que as próximas travessias sejam gratuitas.':list==='resgatadas'?'A ilha de chegada foi resgatada. Essa lista pertence à partida, não ao grupo temporário usado para calcular o orçamento.': 'Guardamos [ilha vizinha, número da ponte, preço desta travessia] como um movimento permitido.';
  text=`append acrescentou um item ao fim de ${list}. ${purpose} O item acrescentado foi ${value(entry.tails?.[list])}. Depois desta linha, ${n(list)}.`;
 }else if(line.startsWith('print(')){
  text=line.includes('print(texto)')?`print escreveu no terminal a opção ${value(v.texto)}. Esse destino é vizinho da posição atual; (Prim) marca a próxima direção recomendada e a ausência de preço significa travessia gratuita.`:line.includes('\\nIlha')?`print escreveu uma nova linha (\\n) e o resumo: ilha ${value(v.local)}, saldo ${value(v.saldo)}, resgatados ${entry.sizes?.resgatadas??'?'} de ${value(v.quantidade)}.`:line.includes('Vitoria')?'print anunciou a vitória: o laço terminou porque todos os animais foram resgatados.':line.includes('Saldo final')?`print mostrou o saldo final: ${value(v.saldo)}.`:line.includes('Fim de jogo')?'print explicou que nenhuma ponte para outro resgate cabe no saldo restante.':'print avisou que a ilha escolhida não estava entre os movimentos possíveis. Nenhum ponto foi gasto.';
 }else{
  const assignment=line.match(/^([\w ,]+) = (.+)$/);
  if(assignment){
   const names=assignment[1].split(',').map(n=>n.trim()),expr=assignment[2];
   const details:[string,string][]=[
    ['quantidade =','input() recebeu o texto digitado; int() o converteu em um inteiro. Este exemplo espera um número válido de pelo menos 2 e não impõe limite máximo. Não há uma etapa separada de validação.'],
    ['pontes =','[] criou uma lista vazia. Ela vai guardar o grafo inteiro; cada ponte contém [origem, destino, custo].'],
    ['a = random.randrange','random.randrange(b) sorteou uma ilha entre 0 e b - 1. Como b é a ilha nova, ela sempre se liga a uma que já existia.'],
    ['b = a + 2','Calculamos a ilha duas posições à frente para tentar criar uma ligação alternativa.'],
    ['existe = False','False significa que ainda não encontramos uma ponte repetida nesta busca.'],
    ['existe = True','As duas pontas coincidiram com uma ponte existente. Marcamos True para não acrescentar uma cópia.'],
    ['animais =','Criamos uma lista de nomes. Eles serão reutilizados nas ilhas, que continuam identificadas por números únicos.'],
    ['local = random.randrange','random.randrange(quantidade) sorteou a ilha inicial, de 0 até quantidade - 1.'],
    ['resgatadas =','O animal da ilha inicial já está salvo. Criamos uma lista contendo apenas essa ilha.'],
    ['compradas =','[] começou a lista de pontes pagas, ainda vazia.'],
    ['saldo = prim','A chamada prim(pontes, quantidade) terminou e seu return forneceu o orçamento mínimo. O total considera conectar todas as ilhas, não um trajeto saindo do jogador.'],
    ['grupo =','Dentro de prim(), começamos com a ilha 0 conectada. Este grupo é temporário: não é a lista de animais resgatados na partida.'],
    ['total = 0','Começamos a soma dos custos em zero.'],
    ['total = total + custo',`Somamos ${Number(v.total)-Number(v.custo)} + ${value(v.custo)} e guardamos o novo total, ${value(v.total)}. O sinal = é atribuição, não comparação.`],
    ['melhor = None','None representa a ausência de candidata: esta busca ainda não encontrou uma ponte de saída.'],
    ['melhor = numero','Guardamos a posição desta ponte na lista, pois ela é a melhor saída encontrada até aqui. Não guardamos o custo em melhor.'],
    ['numero = ponte_mais_barata','A função examinou o grafo e devolveu o número da ponte de saída mais barata do grupo recebido. Esse número é um índice na lista pontes.'],
    ['a, b, custo =','pontes[numero] selecionou uma ponte pelo índice, começando em 0. Os três nomes receberam, na ordem, sua origem, seu destino e seu custo.'],
    ['origem, destino = a, b','Inicialmente orientamos a ponte escolhida como a → b. Se a ponta resgatada for b, o próximo if inverterá os dois nomes.'],
    ['origem, destino = b, a','Invertemos as pontas: agora origem é a ilha já resgatada e destino é a ilha nova.'],
    ['passo = destino','Se já estamos na origem da ponte de Prim, o próximo movimento recomendado é diretamente para a ilha nova.'],
    ['passo = rota[1]','[1] lê o segundo item da rota; [0] é a ilha atual. Assim, indicamos só a próxima vizinha no caminho até a ponte de Prim.'],
    ['rota = caminho','caminho() terminou e devolveu uma sequência de ilhas pelas pontes compradas, da posição atual até a origem da ponte de Prim.'],
    ['fila =','[[inicio]] criou uma lista de rotas com uma única rota, contendo só a ilha inicial da caminhada. É uma busca de direção, separada do cálculo de custo de Prim.'],
    ['rota = fila.pop(0)','pop(0) removeu e devolveu o primeiro item da fila. Examinamos as rotas na ordem de chegada, das menores para as maiores.'],
    ['atual = rota[-1]','O índice [-1] selecionou o último item da rota, a ilha em que essa rota termina.'],
    ['opcoes =','Começamos uma lista vazia para os movimentos permitidos a partir da posição atual.'],
    ['vizinha = None','Nenhuma vizinha foi identificada para esta ponte ainda. None não é uma ilha.'],
    ['vizinha = b','A ponte toca a posição atual pela ponta a, então b é sua outra ponta.'],
    ['vizinha = a','A ponte toca a posição atual pela ponta b, então a é sua outra ponta.'],
    ['preco = custo','Começamos com o custo original da ponte como preço desta travessia. Se ela já foi paga, o próximo if muda esse preço para zero.'],
    ['preco = 0','A ponte já foi comprada. Agora ela é gratuita para atravessar; seu custo original no grafo continua igual.'],
    ['texto = str(vizinha)','str() transformou o número da ilha em texto. + juntou os pedaços. % calcula o resto da divisão para reutilizar os nomes dos animais, sem sair dos índices válidos da lista.'],
    ['texto = texto + " - "','Acrescentamos o preço ao texto. str(preco) converteu o número em texto para poder juntá-lo com +.'],
    ['texto = texto + " (Prim)"','Acrescentamos a marca (Prim) à próxima ilha recomendada, sem mudar o custo ou a posição do jogador.'],
    ['escolha =','input() recebeu o número digitado no terminal, como texto. int() o converteu em inteiro para comparar com os números das ilhas.'],
    ['movimento = None','Ainda não encontramos a escolha na lista de movimentos permitidos. Começamos sem movimento selecionado.'],
    ['movimento = opcao','Esta opção coincide com a ilha digitada. Guardamos seus três itens para executar o movimento depois de terminar a busca.'],
    ['local, numero, preco = movimento','Os três itens da opção atualizaram a posição do jogador, o número da ponte atravessada e o preço desta travessia.'],
    ['saldo = saldo - preco',`O saldo era ${Number(v.saldo)+Number(v.preco)}. Descontamos ${value(v.preco)} e ele passou a ${value(v.saldo)}. Este trecho não roda para uma ponte já comprada.`],
   ];
   text=(details.find(([prefix])=>line.startsWith(prefix))?.[1]??`A expressão ${expr} foi avaliada e seu resultado foi atribuído aos nomes à esquerda de =.`)+' Depois desta linha, '+names.map(n).join('; ')+'.';
  }else text=`Esta linha foi executada: ${line}.`;
 }
 return entry.count>1&&entry.kind!=='condition'?`${text} A operação ocorreu ${entry.count} vezes desde a pausa anterior; os valores citados são os da última vez.`:text;
}
export function pending(event:Pause):string {
 if(event.type==='input')return event.prompt?.startsWith('Quantas')?'Agora a execução espera o número de ilhas. As três funções acima apenas foram definidas: seus corpos só serão executados quando o programa chamá-las. Digite um inteiro de pelo menos 2 e pressione Enter.':'Agora input() espera o número de uma das ilhas listadas. Digite-o e pressione Enter. (Prim) indica o próximo movimento; uma opção sem preço usa uma ponte já comprada.';
 if(event.type==='done')return 'A execução terminou. O resultado está no terminal; Reiniciar prepara outra partida.';
 return `A faixa cinza marca a próxima linha (${event.line}), que ainda não foi executada. Próximo passo continua deste ponto.`;
}
