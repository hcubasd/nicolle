import random


def ponte_mais_barata(pontes, resgatadas):
    melhor = None
    for numero in range(len(pontes)):
        a, b, custo = pontes[numero]
        # Uma ponta resgatada e outra ainda nao resgatada.
        if (a in resgatadas) != (b in resgatadas):
            if melhor is None or custo < pontes[melhor][2]:
                melhor = numero
    return melhor


def prim(pontes, quantidade):
    grupo = [0]
    total = 0
    while len(grupo) < quantidade:
        numero = ponte_mais_barata(pontes, grupo)
        a, b, custo = pontes[numero]
        if a in grupo:
            grupo.append(b)
        else:
            grupo.append(a)
        total = total + custo
    return total


def caminho(pontes, compradas, inicio, destino):
    fila = [[inicio]]
    while len(fila) > 0:
        rota = fila.pop(0)
        atual = rota[-1]
        if atual == destino:
            return rota
        for numero in compradas:
            a, b, custo = pontes[numero]
            if a == atual and b not in rota:
                fila.append(rota + [b])
            if b == atual and a not in rota:
                fila.append(rota + [a])


quantidade = int(input("Quantas ilhas? (2 ou mais): "))

# Cada ponte e uma lista: [ilha de origem, ilha de destino, custo].
pontes = []
for b in range(1, quantidade):
    a = random.randrange(b)
    pontes.append([a, b, random.randint(1, 9)])
# Estas pontes extras criam escolhas, sem repetir as anteriores.
for a in range(quantidade - 2):
    b = a + 2
    existe = False
    for ponte in pontes:
        if ponte[0] == a and ponte[1] == b:
            existe = True
    if not existe:
        pontes.append([a, b, random.randint(1, 9)])

animais = ["gato", "cachorro", "coelho", "sapo", "ovelha"]
local = random.randrange(quantidade)
resgatadas = [local]
compradas = []
saldo = prim(pontes, quantidade)

while len(resgatadas) < quantidade:
    print("\nIlha", local, "| Saldo:", saldo, "| Resgatados:", len(resgatadas), "/", quantidade)
    numero = ponte_mais_barata(pontes, resgatadas)
    a, b, custo = pontes[numero]
    if custo > saldo:
        print("Fim de jogo: nenhuma ponte nova cabe no saldo.")
        break
    origem, destino = a, b
    if b in resgatadas:
        origem, destino = b, a
    passo = destino
    if local != origem:
        rota = caminho(pontes, compradas, local, origem)
        passo = rota[1]
    opcoes = []
    for numero in range(len(pontes)):
        a, b, custo = pontes[numero]
        vizinha = None
        if a == local:
            vizinha = b
        if b == local:
            vizinha = a
        if vizinha is not None and (vizinha not in resgatadas or numero in compradas):
            preco = custo
            if numero in compradas:
                preco = 0
            if preco <= saldo:
                opcoes.append([vizinha, numero, preco])
                texto = str(vizinha) + " - " + animais[vizinha % len(animais)]
                if preco > 0:
                    texto = texto + " - " + str(preco) + " pontos"
                if vizinha == passo:
                    texto = texto + " (Prim)"
                print(texto)
    escolha = int(input("Ilha: "))
    movimento = None
    for opcao in opcoes:
        if opcao[0] == escolha:
            movimento = opcao
    if movimento is None:
        print("Essa ilha nao esta entre as opcoes.")
        continue
    local, numero, preco = movimento
    if numero not in compradas:
        compradas.append(numero)
        saldo = saldo - preco
        resgatadas.append(local)

if len(resgatadas) == quantidade:
    print("Vitoria! Todos os", quantidade, "bichinhos foram resgatados.")
    print("Saldo final:", saldo)
