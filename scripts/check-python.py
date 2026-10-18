"""Exercise the unmodified terminal script and browser debugger with real Python."""
from pathlib import Path
import ast
import builtins
import contextlib
import io
import random
import re
import sys

root = Path(__file__).resolve().parents[1]
source = (root / 'src/python/prim.py').read_text()
# Load the ordinary helper functions separately to drive deterministic test players.
tree = ast.parse(source)
helpers = {}
exec(compile(ast.Module(body=[n for n in tree.body if isinstance(n, ast.FunctionDef)], type_ignores=[]), 'prim.py', 'exec'), helpers)
original_input = builtins.input


def choice(state, bad=False):
    edges = state['pontes']
    rescued = state['resgatadas']
    candidates = [i for i, (a, b, cost) in enumerate(edges)
                  if (a in rescued) != (b in rescued) and cost <= state['saldo']]
    assert candidates
    edge = max(candidates, key=lambda i: edges[i][2]) if bad else min(candidates, key=lambda i: edges[i][2])
    a, b, cost = edges[edge]
    origin, target = (a, b) if a in rescued else (b, a)
    if state['local'] == origin:
        return str(target)
    route = helpers['caminho'](edges, state['compradas'], state['local'], origin)
    assert len(route) > 1
    return str(route[1])


def run(count, seed, bad=False):
    random.seed(seed)
    output = io.StringIO()
    scope = {}
    inputs = []
    invalid = [str(count)]
    moves = 0

    def answer(prompt):
        nonlocal moves
        if prompt.startswith('Quantas'):
            result = invalid.pop(0)
        else:
            moves += 1
            assert moves < count * count * 4
            # An invalid movement must preserve position, balance and rescues.
            result = '999999999' if moves == 1 else choice(scope, bad)
        inputs.append(result)
        return result

    builtins.input = answer
    try:
        with contextlib.redirect_stdout(output):
            exec(compile(source, 'prim.py', 'exec'), scope)
    finally:
        builtins.input = original_input
    assert len(scope['resgatadas']) == len(set(scope['resgatadas']))
    assert scope['saldo'] >= 0
    assert len(scope['compradas']) == len(scope['resgatadas']) - 1
    assert 'Essa ilha nao esta entre as opcoes.' in output.getvalue()
    return scope, output.getvalue(), inputs


for count in [2, 4, 16, 129, 257]:
    for seed in [0, 42]:
        state, text, _ = run(count, seed)
        assert len(state['resgatadas']) == count
        assert state['saldo'] == 0
        assert 'Vitoria!' in text

losses = 0
for seed in range(20):
    state, text, _ = run(16, seed, bad=True)
    if len(state['resgatadas']) < 16:
        losses += 1
        assert 'Fim de jogo:' in text
        i = helpers['ponte_mais_barata'](state['pontes'], state['resgatadas'])
        assert state['pontes'][i][2] > state['saldo']
assert losses > 0

# Instrumentation must preserve the standalone script's output, not simulate it.
_, expected, answers = run(4, 42)
random.seed(42)
debugger = {}
exec((root / 'public/grafos/python/instrument.py').read_text(), debugger)
points = [node.lineno for node in ast.walk(ast.parse(source))
          if isinstance(node, ast.stmt) and not isinstance(node, ast.FunctionDef)]
generator = debugger['_prepare'](source, points)
output = io.StringIO()
value = None
pauses = 0
journal = []
with contextlib.redirect_stdout(output):
    while True:
        try:
            event = generator.send(value)
        except StopIteration:
            break
        value = None
        journal.extend(debugger['_take_events']())
        assert event['line'] >= 1
        if event['type'] == 'input':
            value = answers.pop(0)
        else:
            pauses += 1
journal.extend(debugger['_take_events']())
assert any(e['kind']=='definition' for e in journal)
assert any(e['kind']=='condition' and isinstance(e['result'], bool) for e in journal)
assert any(e['kind']=='return' for e in journal)
assert any(e['kind']=='call' for e in journal)
assert not answers
assert pauses > 30
assert output.getvalue() == expected

# The simple example deliberately delegates malformed integer input to Python.
builtins.input = lambda prompt: 'abc'
try:
    with contextlib.redirect_stdout(io.StringIO()):
        try:
            exec(source, {})
        except ValueError:
            pass
        else:
            raise AssertionError('int() must reject nonnumeric input')
finally:
    builtins.input = original_input
print('Python: optimal rescues through 257 islands, free backtracking, invalid moves, budget losses, native int input errors, executed-line journals and exact standalone/debugger output parity passed.')
