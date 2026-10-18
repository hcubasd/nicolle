# Resgate dos Bichinhos — jogo de texto e oráculo de Kruskal.
# Execute este arquivo ou cole-o em uma única célula do Colab.
# Cada ponte é comprada uma vez e pode ser percorrida nos dois sentidos.

def kruskal(vertices, arestas):
    grupo = {}
    for vertice in vertices:
        grupo[vertice] = vertice
    arvore = []
    custo_total = 0
    for custo, a, b in sorted(arestas):
        grupo_a = grupo[a]
        grupo_b = grupo[b]
        if grupo_a != grupo_b:
            for vertice in vertices:
                if grupo[vertice] == grupo_b:
                    grupo[vertice] = grupo_a
            arvore.append((custo, a, b))
            custo_total = custo_total + custo
            if len(arvore) == len(vertices) - 1:
                break
    return arvore, custo_total


vertices = ["A", "B", "C", "D"]
arestas = [(8, "A", "D"), (2, "B", "C"), (9, "B", "D"),
           (1, "A", "B"), (4, "C", "D"), (3, "A", "C")]
animais = {"A": "Amora", "B": "Bento", "C": "Cacau", "D": "Dori"}

print("Resgate dos Bichinhos")
print("Escolha uma partida: A, B, C ou D.")
local = input("Ilha inicial: ").strip().upper()
while local not in vertices:
    local = input("Digite uma ilha válida (A, B, C ou D): ").strip().upper()

resgatados = [local]
comprados = []
gasto_total = 0
print("Primeiro resgate:", animais[local])

while len(resgatados) < len(vertices):
    print("\nVocê está em", local)
    print("Moedas gastas:", gasto_total)
    print("Bichinhos na turma:")
    for ilha in resgatados:
        print("-", animais[ilha])

    # O menu só inclui caminhos que encostam na ilha atual.
    opcoes = {}
    for custo, a, b in arestas:
        if a == local:
            opcoes[b] = (custo, a, b)
        if b == local:
            opcoes[a] = (custo, a, b)

    print("Próximas ilhas:")
    for destino in opcoes:
        caminho = opcoes[destino]
        if caminho in comprados:
            preco = 0
        else:
            preco = caminho[0]
        print(destino, animais[destino], "custa", preco)

    escolha = input("Ilha, DICA ou SAIR: ").strip().upper()
    if escolha == "SAIR":
        break
    if escolha == "DICA":
        rede, minimo = kruskal(vertices, arestas)
        print("Rede mínima para comprar:")
        for custo, a, b in rede:
            print(a, b, custo)
        print("Custo mínimo, começando do zero:", minimo)
        print("A dica não compra caminhos. Você escolhe por onde andar.")
        continue
    if escolha not in opcoes:
        print("Essa ilha não é vizinha. Escolha uma opção do menu.")
        continue

    caminho = opcoes[escolha]
    if caminho not in comprados:
        comprados.append(caminho)
        gasto_total = gasto_total + caminho[0]
        print("Comprou o caminho por", caminho[0])
    else:
        print("Caminho já comprado: viagem gratuita.")

    local = escolha
    if local not in resgatados:
        resgatados.append(local)
        print("Novo resgate:", animais[local])

if len(resgatados) == len(vertices):
    print("\nTodos os bichinhos resgatados!")
    rede, minimo = kruskal(vertices, arestas)
    print("Você gastou:", gasto_total)
    print("Mínimo possível:", minimo)
    if gasto_total == minimo:
        print("Resgate com custo mínimo!")
    else:
        print("Uma nova aventura pode gastar menos. Consulte o oráculo!")
else:
    print("Aventura encerrada. Bichinhos resgatados:", len(resgatados))
