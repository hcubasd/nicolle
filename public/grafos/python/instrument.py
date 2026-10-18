"""Browser-only execution journal. The downloaded game stays ordinary Python."""
import ast
import json
import types

_events = {}


def _clean(value, depth=0):
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, (list, tuple)) and depth < 3:
        result = [_clean(item, depth + 1) for item in value[:8]]
        if len(value) > 8:
            result.append("... mais " + str(len(value) - 8) + " itens")
        return result
    return str(value)[:120]


def _snapshot(values):
    return {key: _clean(value) for key, value in values.items()
            if not key.startswith("_") and not callable(value)
            and not isinstance(value, types.ModuleType)}


def _record(line, scope, values, kind, result=None):
    key = (line, scope, kind)
    count = _events.get(key, {}).get("count", 0) + 1
    previous = _events.get(key, {})
    _events[key] = {"line": line, "scope": scope, "kind": kind,
                    "values": _snapshot(values), "sizes": {k: len(v) for k, v in values.items() if isinstance(v, (list, tuple))},
                    "tails": {k: _clean(v[-1]) for k, v in values.items() if isinstance(v, list) and v},
                    "count": count, "result": _clean(result),
                    "yes": previous.get("yes", 0) + int(kind == "condition" and bool(result)),
                    "no": previous.get("no", 0) + int(kind == "condition" and not bool(result))}


def _condition(value, line, scope, values):
    _record(line, scope, values, "condition", bool(value))
    return value


def _take_events():
    events = list(_events.values())
    _events.clear()
    return events


class _Instrument(ast.NodeTransformer):
    def __init__(self, functions, breakpoints):
        self.functions = functions
        self.breakpoints = set(breakpoints)
        self.scope = "jogo"

    def record(self, node, kind, result="None"):
        call = ast.parse(f'_record({node.lineno}, {self.scope!r}, locals(), {kind!r}, {result})').body[0]
        return ast.copy_location(call, node)

    def visit_FunctionDef(self, node):
        old = self.scope
        self.scope = node.name
        node = self.generic_visit(node)
        node.body.insert(0, self.record(node, "call"))
        self.scope = old
        return node

    def visit_Call(self, node):
        node = self.generic_visit(node)
        if isinstance(node.func, ast.Name):
            if node.func.id == "input":
                prompt = node.args[0] if node.args else ast.Constant("")
                event = ast.Dict(keys=[ast.Constant(k) for k in ("type", "line", "scope", "prompt", "values")],
                                 values=[ast.Constant("input"), ast.Constant(node.lineno), ast.Constant(self.scope), prompt,
                                         ast.Call(func=ast.Name(id="_snapshot", ctx=ast.Load()), args=[ast.Call(func=ast.Name(id="locals", ctx=ast.Load()), args=[], keywords=[])], keywords=[])])
                return ast.copy_location(ast.Yield(value=event), node)
            if node.func.id in self.functions:
                return ast.copy_location(ast.YieldFrom(value=node), node)
        return node

    def condition(self, node):
        node = self.generic_visit(node)
        node.test = ast.copy_location(ast.Call(func=ast.Name(id="_condition", ctx=ast.Load()),
            args=[node.test, ast.Constant(node.lineno), ast.Constant(self.scope),
                  ast.Call(func=ast.Name(id="locals", ctx=ast.Load()), args=[], keywords=[])], keywords=[]), node.test)
        return node

    visit_If = condition
    visit_While = condition

    def visit_For(self, node):
        node = self.generic_visit(node)
        node.body.insert(0, self.record(node, "iteration"))
        return node

    def generic_visit(self, node):
        node = super().generic_visit(node)
        for field, value in ast.iter_fields(node):
            if not isinstance(value, list):
                continue
            replacement = []
            for item in value:
                if not isinstance(item, ast.stmt):
                    replacement.append(item)
                    continue
                if not isinstance(item, ast.FunctionDef) and item.lineno in self.breakpoints:
                    pause = ast.parse(f'yield {{"type": "pause", "line": {item.lineno}, "scope": {self.scope!r}, "values": _snapshot(locals())}}').body[0]
                    replacement.append(ast.copy_location(pause, item))
                if isinstance(item, ast.Return):
                    assignment = ast.Assign(targets=[ast.Name(id="_returned", ctx=ast.Store())], value=item.value or ast.Constant(None))
                    replacement.extend([ast.copy_location(assignment, item), self.record(item, "return", "_returned")])
                    item.value = ast.Name(id="_returned", ctx=ast.Load())
                if isinstance(item, (ast.Break, ast.Continue)):
                    replacement.append(self.record(item, "flow"))
                replacement.append(item)
                if isinstance(item, ast.For):
                    replacement.append(self.record(item, "loop"))
                if isinstance(item, (ast.Assign, ast.Expr, ast.Import, ast.FunctionDef)):
                    replacement.append(self.record(item, "definition" if isinstance(item, ast.FunctionDef) else "executed"))
            setattr(node, field, replacement)
        return node


def _prepare(source, breakpoints):
    _events.clear()
    tree = ast.parse(source, filename="prim.py")
    functions = [node.name for node in tree.body if isinstance(node, ast.FunctionDef)]
    tree = _Instrument(functions, breakpoints).visit(tree)
    wrapper = ast.FunctionDef(name="_program", args=ast.arguments(posonlyargs=[], args=[], kwonlyargs=[], kw_defaults=[], defaults=[]), body=tree.body, decorator_list=[])
    module = ast.fix_missing_locations(ast.Module(body=[wrapper], type_ignores=[]))
    namespace = {"_snapshot": _snapshot, "_record": _record, "_condition": _condition}
    exec(compile(module, "prim.py", "exec"), namespace)
    return namespace["_program"]()


def _advance(answer=None):
    try:
        event = _execution.send(answer)
    except StopIteration:
        event = {"type": "done"}
    event["events"] = _take_events()
    return json.dumps(event, ensure_ascii=False)
