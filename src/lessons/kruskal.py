# Kruskal com grupos simples — Nicolle, Grafos e Redes.
# Arestas no formato (custo, origem, destino).

def kruskal(vertices, arestas):
    grupo = {}
    for vertice in vertices:
        grupo[vertice] = vertice

    arvore = []
    custo_total = 0
    ordenadas = sorted(arestas)

    for custo, a, b in ordenadas:
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
arestas = [
    (8, "A", "D"),
    (2, "B", "C"),
    (9, "B", "D"),
    (1, "A", "B"),
    (4, "C", "D"),
    (3, "A", "C"),
]

arvore, custo_total = kruskal(vertices, arestas)
print("Caminhos:", arvore)
print("Custo total:", custo_total)
assert custo_total == 7
assert len(arvore) == 3
