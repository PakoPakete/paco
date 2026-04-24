import { IRNode, IRExpr, IRRepeat, IRIf, IRWhile, IRFor, IRForever, IRSwitch, IRPrint, IRVarAssign, IRVarChange, IRVarRef, IRUnaryOp, IRString, IRRandom, IRComment, IRVarDeclaration, IRVarDeclarationInit, IRVarIncrement, IRVarDecrement, IRArrayDeclaration, IRArrayAccess, IRArrayAssignment, IRArrayLength, IRFunctionDefinition, IRFunctionCall, IRReturn, IRClassDefinition, IRInterfaceDefinition, IRTextConcat, IRTextLength, IRTextSubstring, IRInputRead, IRTryCatchFinally, IRThrow, IRWaitSeconds, IRWaitUntil, IRListDeclaration, IRListAdd, IRListRemove, IRListClear, IRListInsert, IRListSet, IRMapDeclaration, IREnumDefinition, IRThreadCreate, IRSynchronized, IRImport, IRCodeTemplate, IRBroadcast, IRBroadcastWait, IRWhenReceive, IRTernary, IRCharAt, IRTextContains, IRListGet, IRListSize, IRListContains, IRNewObject, IRLambda, IRStreamFilter, IRFunctionCallExpr } from '../ir/nodes';

/**
 * Convierte una lista de nodos IR en código Java (solo el cuerpo).
 */
export function irToJava(nodes: IRNode[]): string {
  const declared = new Set<string>();
  const ctx = { loopCounter: 0 };
  return emitNodes(nodes, declared, ctx);
}

function emitNodes(nodes: IRNode[], declared: Set<string>, ctx: { loopCounter: number }): string {
  let out = '';
  if (!nodes || nodes.length === 0) {
    return out;
  }

  for (const node of nodes) {
    if (!node) {
      continue;
    }
    switch (node.kind) {
      case 'repeat':
        out += emitRepeat(node as IRRepeat, declared, ctx);
        break;

      case 'if':
        out += emitIf(node as IRIf, declared, ctx);
        break;

      case 'while':
        out += emitWhile(node as IRWhile, declared, ctx);
        break;

      case 'for':
        out += emitFor(node as IRFor, declared, ctx);
        break;

      case 'switch':
        out += emitSwitch(node as IRSwitch, declared, ctx);
        break;

      case 'break':
        out += 'break;\n';
        break;

      case 'continue':
        out += 'continue;\n';
        break;

      case 'print':
        out += emitPrint(node as IRPrint, declared, ctx);
        break;

      case 'var_assign':
        out += emitVarAssign(node as IRVarAssign, declared, ctx);
        break;

      case 'var_change':
        out += emitVarChange(node as IRVarChange, declared, ctx);
        break;

      case 'comment':
        out += emitComment(node as IRComment, declared, ctx);
        break;

      case 'var_declaration':
        out += emitVarDeclaration(node as IRVarDeclaration, declared, ctx);
        break;

      case 'var_declaration_init':
        out += emitVarDeclarationInit(node as IRVarDeclarationInit, declared, ctx);
        break;

      case 'var_increment':
        out += emitVarIncrement(node as IRVarIncrement, declared, ctx);
        break;

      case 'var_decrement':
        out += emitVarDecrement(node as IRVarDecrement, declared, ctx);
        break;

      case 'array_declaration':
        out += emitArrayDeclaration(node as IRArrayDeclaration, declared, ctx);
        break;

      case 'array_assignment':
        out += emitArrayAssignment(node as IRArrayAssignment, declared, ctx);
        break;

      case 'function_definition':
        out += emitFunctionDefinition(node as IRFunctionDefinition, declared, ctx);
        break;

      case 'function_call':
        out += emitFunctionCall(node as IRFunctionCall, declared, ctx);
        break;

      case 'return':
        out += emitReturn(node as IRReturn, declared, ctx);
        break;

      case 'class_definition':
        out += emitClassDefinition(node as IRClassDefinition, declared, ctx);
        break;

      case 'interface_definition':
        out += emitInterfaceDefinition(node as IRInterfaceDefinition, declared, ctx);
        break;

      case 'forever':
        out += emitForever(node as IRForever, declared, ctx);
        break;

      case 'wait_seconds':
        out += emitWaitSeconds(node as IRWaitSeconds, declared, ctx);
        break;

      case 'wait_until':
        out += emitWaitUntil(node as IRWaitUntil, declared, ctx);
        break;

      case 'stop':
        out += 'System.exit(0);\n';
        break;

      case 'try_catch_finally':
        out += emitTryCatchFinally(node as IRTryCatchFinally, declared, ctx);
        break;

      case 'throw':
        out += emitThrow(node as IRThrow, declared, ctx);
        break;

      case 'broadcast':
        out += `${safeId((node as IRBroadcast).message)}();\n`;
        break;

      case 'broadcast_wait':
        out += `${safeId((node as IRBroadcastWait).message)}();\n`;
        break;

      case 'when_receive':
        out += emitWhenReceive(node as IRWhenReceive, declared, ctx);
        break;

      case 'list_declaration':
        out += emitListDeclaration(node as IRListDeclaration, declared, ctx);
        break;

      case 'list_add':
        out += `${safeId((node as IRListAdd).listName)}.add(${emitExpr((node as IRListAdd).value, declared)});\n`;
        break;

      case 'list_remove':
        out += `${safeId((node as IRListRemove).listName)}.remove((int)(${emitExpr((node as IRListRemove).index, declared)}));\n`;
        break;

      case 'list_clear':
        out += `${safeId((node as IRListClear).listName)}.clear();\n`;
        break;

      case 'list_insert':
        out += `${safeId((node as IRListInsert).listName)}.add(${emitExpr((node as IRListInsert).index, declared)}, ${emitExpr((node as IRListInsert).value, declared)});\n`;
        break;

      case 'list_set':
        out += `${safeId((node as IRListSet).listName)}.set(${emitExpr((node as IRListSet).index, declared)}, ${emitExpr((node as IRListSet).value, declared)});\n`;
        break;

      case 'map_declaration':
        out += emitMapDeclaration(node as IRMapDeclaration, declared, ctx);
        break;

      case 'enum_definition':
        out += emitEnumDefinition(node as IREnumDefinition, declared, ctx);
        break;

      case 'thread_create':
        out += emitThreadCreate(node as IRThreadCreate, declared, ctx);
        break;

      case 'synchronized':
        out += emitSynchronized(node as IRSynchronized, declared, ctx);
        break;

      case 'import':
        out += `import ${(node as IRImport).library};\n`;
        break;

      case 'code_template':
        out += `${(node as IRCodeTemplate).code}\n`;
        break;

      default:
        out += `// TODO: nodo no soportado\n`;
        break;
    }
  }

  return out;
}

// ---------- EMISORES DE NODOS ----------

function emitRepeat(node: IRRepeat, declared: Set<string>, ctx: { loopCounter: number }): string {
  const timesCode = emitExpr(node.times, declared);
  const loopVar = `i_${ctx.loopCounter++}`;
  const body = emitNodes(node.body, declared, ctx);

  return (
    `for (int ${loopVar} = 0; ${loopVar} < ${timesCode}; ${loopVar}++) {\n` +
    indent(body || '// (vacio)\n', 1) +
    `}\n`
  );
}

function emitIf(node: IRIf, declared: Set<string>, ctx: { loopCounter: number }): string {
  const condCode = emitBooleanExpr(node.condition, declared);
  const body = emitNodes(node.body, declared, ctx);

  let result =
    `if (${condCode}) {\n` +
    indent(body || '// (vacio)\n', 1) +
    `}\n`;

  if (node.elseBody && node.elseBody.length > 0) {
    const elseCode = emitNodes(node.elseBody, declared, ctx);

    // Para no poner "else { if () { ... } }" sino "else if () { ... }"
    if (node.elseBody.length === 1 && node.elseBody[0].kind === 'if') {
      result = result.trimEnd() + ` else ` + elseCode;
    } else {
      result = result.trimEnd() + ` else {\n` +
        indent(elseCode || '// (vacio)\n', 1) +
        `}\n`;
    }
  }

  return result;
}

function emitWhile(node: IRWhile, declared: Set<string>, ctx: { loopCounter: number }): string {
  const condCode = emitBooleanExpr(node.condition, declared);
  const body = emitNodes(node.body, declared, ctx);

  return (
    `while (${condCode}) {\n` +
    indent(body || '// (vacio)\n', 1) +
    `}\n`
  );
}

function emitFor(node: IRFor, declared: Set<string>, ctx: { loopCounter: number }): string {
  // Scope nuevo para que la variable del for no contamine el ámbito exterior (Bug 5)
  const forDeclared = new Set(declared);
  const initCode = node.init ? emitNodes([node.init], forDeclared, ctx).trim().replace(/;$/, '') : '';
  const condCode = node.condition ? emitExpr(node.condition, forDeclared) : 'true';
  const incrCode = node.increment ? emitNodes([node.increment], forDeclared, ctx).trim().replace(/;$/, '') : '';
  const bodyCode = emitNodes(node.body, forDeclared, ctx) || '// (vacio)\n';
  return `for (${initCode}; ${condCode}; ${incrCode}) {\n${indent(bodyCode, 1)}}\n`;
}

function emitSwitch(node: IRSwitch, declared: Set<string>, ctx: { loopCounter: number }): string {
  const exprCode = emitExpr(node.expr, declared);
  let casesCode = '';
  for (const c of node.cases) {
    if (c.value) {
      const valCode = emitExpr(c.value, declared);
      casesCode += `case ${valCode}:\n${indent(emitNodes(c.body, declared, ctx), 1)}break;\n`;
    } else {
      casesCode += `default:\n${indent(emitNodes(c.body, declared, ctx), 1)}break;\n`;
    }
  }
  return `switch (${exprCode}) {\n${indent(casesCode, 1)}}\n`;
}

function emitPrint(node: IRPrint, declared: Set<string>, ctx: { loopCounter: number }): string {
  const exprCode = emitExpr(node.value, declared);
  return `System.out.println(${exprCode});\n`;
}

function emitComment(node: IRComment, declared: Set<string>, ctx: { loopCounter: number }): string {
  return `// ${node.text}\n`;
}

function emitVarDeclaration(node: IRVarDeclaration, declared: Set<string>, ctx: { loopCounter: number }): string {
  declared.add(node.name);
  return `${node.type} ${safeId(node.name)};\n`;
}

function emitVarDeclarationInit(node: IRVarDeclarationInit, declared: Set<string>, ctx: { loopCounter: number }): string {
  declared.add(node.name);
  const valueCode = emitExpr(node.value, declared);
  return `${node.type} ${safeId(node.name)} = ${valueCode};\n`;
}

function emitVarIncrement(node: IRVarIncrement, declared: Set<string>, ctx: { loopCounter: number }): string {
  return `${safeId(node.name)}++;\n`;
}

function emitVarDecrement(node: IRVarDecrement, declared: Set<string>, ctx: { loopCounter: number }): string {
  return `${safeId(node.name)}--;\n`;
}

function emitArrayDeclaration(node: IRArrayDeclaration, declared: Set<string>, ctx: { loopCounter: number }): string {
  declared.add(node.name);
  const sizeCode = emitExpr(node.size, declared);
  return `${node.type}[] ${safeId(node.name)} = new ${node.type}[${sizeCode}];\n`;
}

function emitArrayAssignment(node: IRArrayAssignment, declared: Set<string>, ctx: { loopCounter: number }): string {
  const indexCode = emitExpr(node.index, declared);
  const valueCode = emitExpr(node.value, declared);
  return `${safeId(node.name)}[${indexCode}] = ${valueCode};\n`;
}

function emitFunctionDefinition(node: IRFunctionDefinition, declared: Set<string>, ctx: { loopCounter: number }): string {
  const paramsCode = node.params.map(p => `${p.type} ${safeId(p.name)}`).join(', ');
  const bodyCode = emitNodes(node.body, new Set(declared), ctx);
  return `public static ${node.returnType} ${safeId(node.name)}(${paramsCode}) {\n${indent(bodyCode, 1)}}\n`;
}

function emitFunctionCall(node: IRFunctionCall, declared: Set<string>, ctx: { loopCounter: number }): string {
  const argsCode = node.args.map(arg => emitExpr(arg, declared)).join(', ');
  return `${safeId(node.name)}(${argsCode});\n`;
}

function emitReturn(node: IRReturn, declared: Set<string>, ctx: { loopCounter: number }): string {
  if (node.value) {
    const valueCode = emitExpr(node.value, declared);
    return `return ${valueCode};\n`;
  }
  return 'return;\n';
}

function emitClassDefinition(node: IRClassDefinition, declared: Set<string>, ctx: { loopCounter: number }): string {
  let header = `public class ${node.name}`;
  if (node.extendsClass) {
    header += ` extends ${node.extendsClass}`;
  }
  if (node.implementsInterfaces && node.implementsInterfaces.length > 0) {
    header += ` implements ${node.implementsInterfaces.join(', ')}`;
  }
  const attrCode = emitClassAttributes(node.attributes, declared, ctx);
  const methodCode = node.methods.map(m => emitClassMethod(m, node.name, declared, ctx)).join('\n');
  return `${header} {\n${indent(attrCode + methodCode, 1)}}\n`;
}

function emitClassAttributes(attrs: IRVarDeclaration[], declared: Set<string>, ctx: { loopCounter: number }): string {
  let out = '';
  for (const attr of attrs) {
    const mod = attr.accessModifier || 'private';
    out += `${mod} ${attr.type} ${safeId(attr.name)};\n`;
  }
  return out;
}

function emitClassMethod(node: IRFunctionDefinition, className: string, declared: Set<string>, ctx: { loopCounter: number }): string {
  const mod = node.accessModifier || 'public';
  const override = node.isOverride ? '@Override\n' : '';
  const staticMod = node.isStatic ? 'static ' : '';

  if (node.name === '__constructor__') {
    const paramsCode = node.params.map(p => `${p.type} ${safeId(p.name)}`).join(', ');
    const bodyCode = emitNodes(node.body, new Set(declared), ctx);
    return `${override}${mod} ${className}(${paramsCode}) {\n${indent(bodyCode, 1)}}\n`;
  }

  const paramsCode = node.params.map(p => `${p.type} ${safeId(p.name)}`).join(', ');
  const bodyCode = emitNodes(node.body, new Set(declared), ctx);
  return `${override}${mod} ${staticMod}${node.returnType} ${safeId(node.name)}(${paramsCode}) {\n${indent(bodyCode, 1)}}\n`;
}

function emitInterfaceDefinition(node: IRInterfaceDefinition, declared: Set<string>, ctx: { loopCounter: number }): string {
  let methodsCode = '';
  for (const m of node.methods) {
    const params = m.params.map(p => `${p.type} ${safeId(p.name)}`).join(', ');
    methodsCode += `${m.returnType} ${safeId(m.name)}(${params});\n`;
  }
  return `public interface ${node.name} {\n${indent(methodsCode, 1)}}\n`;
}

function emitForever(node: IRForever, declared: Set<string>, ctx: { loopCounter: number }): string {
  const body = emitNodes(node.body, declared, ctx);
  return `while (true) {\n${indent(body || '// (vacio)\n', 1)}}\n`;
}

function emitWaitSeconds(node: IRWaitSeconds, declared: Set<string>, ctx: { loopCounter: number }): string {
  const secs = emitExpr(node.seconds, declared);
  return `try { Thread.sleep((long)(${secs} * 1000)); } catch (InterruptedException e) { e.printStackTrace(); }\n`;
}

function emitWaitUntil(node: IRWaitUntil, declared: Set<string>, ctx: { loopCounter: number }): string {
  const cond = emitExpr(node.condition, declared);
  return `while (!(${cond})) {\n${indent('try { Thread.sleep(10); } catch (InterruptedException e) { break; }\n', 1)}}\n`;
}

function emitTryCatchFinally(node: IRTryCatchFinally, declared: Set<string>, ctx: { loopCounter: number }): string {
  const tryCode = emitNodes(node.tryBody, declared, ctx);
  const catchCode = emitNodes(node.catchBody, declared, ctx);
  let result = `try {\n${indent(tryCode || '// (vacio)\n', 1)}} catch (${node.catchType} ${safeId(node.catchVar)}) {\n${indent(catchCode || '// (vacio)\n', 1)}}`;
  if (node.finallyBody && node.finallyBody.length > 0) {
    const finallyCode = emitNodes(node.finallyBody, declared, ctx);
    result += ` finally {\n${indent(finallyCode, 1)}}`;
  }
  return result + '\n';
}

function emitThrow(node: IRThrow, declared: Set<string>, ctx: { loopCounter: number }): string {
  const expr = emitExpr(node.expr, declared);
  return `throw new ${expr};\n`;
}

function emitWhenReceive(node: IRWhenReceive, declared: Set<string>, ctx: { loopCounter: number }): string {
  const body = emitNodes(node.body, declared, ctx);
  return `public static void ${safeId(node.message)}() {\n${indent(body || '// (vacio)\n', 1)}}\n`;
}

function emitListDeclaration(node: IRListDeclaration, declared: Set<string>, ctx: { loopCounter: number }): string {
  declared.add(node.name);
  return `ArrayList<${node.elementType}> ${safeId(node.name)} = new ArrayList<>();\n`;
}

function emitMapDeclaration(node: IRMapDeclaration, declared: Set<string>, ctx: { loopCounter: number }): string {
  declared.add(node.name);
  return `HashMap<${node.keyType}, ${node.valueType}> ${safeId(node.name)} = new HashMap<>();\n`;
}

function emitEnumDefinition(node: IREnumDefinition, declared: Set<string>, ctx: { loopCounter: number }): string {
  return `enum ${node.name} { ${node.values.join(', ')} }\n`;
}

function emitThreadCreate(node: IRThreadCreate, declared: Set<string>, ctx: { loopCounter: number }): string {
  const body = emitNodes(node.body, declared, ctx);
  return `Thread ${safeId(node.name)} = new Thread(() -> {\n${indent(body || '// (vacio)\n', 1)}});\n${safeId(node.name)}.start();\n`;
}

function emitSynchronized(node: IRSynchronized, declared: Set<string>, ctx: { loopCounter: number }): string {
  const lock = emitExpr(node.lock, declared);
  const body = emitNodes(node.body, declared, ctx);
  return `synchronized (${lock}) {\n${indent(body || '// (vacio)\n', 1)}}\n`;
}

function emitVarAssign(node: IRVarAssign, declared: Set<string>, ctx: { loopCounter: number }): string {
  const name = safeId(node.name);
  const valueCode = emitExpr(node.value, declared);

  if (!declared.has(name)) {
    declared.add(name);
    return `double ${name} = ${valueCode};\n`;
  }
  return `${name} = ${valueCode};\n`;
}

function emitVarChange(node: IRVarChange, declared: Set<string>, ctx: { loopCounter: number }): string {
  const name = safeId(node.name);
  const valueCode = emitExpr(node.value, declared);

  if (!declared.has(name)) {
    declared.add(name);
    return `double ${name} = ${valueCode};\n`; // Scratch crea var si no existe
  }
  return `${name} += ${valueCode};\n`;
}

// ---------- EMISOR DE EXPRESIONES ----------

function emitExpr(expr: IRExpr, declared: Set<string>): string {
  if (!expr) {
    return '0';
  }
  switch (expr.kind) {
    case 'number':
      return expr.value.toString();

    case 'boolean':
      return (expr as any).value ? 'true' : 'false';

    case 'string':
      return `"${(expr as IRString).value}"`;

    case 'random':
      const rand = expr as IRRandom;
      return `(Math.random() * (${emitExpr(rand.max, declared)} - ${emitExpr(rand.min, declared)}) + ${emitExpr(rand.min, declared)})`;

    case 'binary_op':
      if (expr.op === '^') {
        return `Math.pow(${emitExpr(expr.left, declared)}, ${emitExpr(expr.right, declared)})`;
      }
      if (expr.op === '.equals') {
        return `${emitExpr(expr.left, declared)}.equals(${emitExpr(expr.right, declared)})`;
      }
      return `(${emitExpr(expr.left, declared)} ${expr.op} ${emitExpr(expr.right, declared)})`;

    case 'unary_op':
      const unary = expr as IRUnaryOp;
      return `${unary.op}(${emitExpr(unary.expr, declared)})`;

    case 'var_ref':
      return safeId((expr as IRVarRef).name);

    case 'array_access':
      const arrAcc = expr as IRArrayAccess;
      return `${safeId(arrAcc.name)}[${emitExpr(arrAcc.index, declared)}]`;

    case 'array_length':
      const arrLen = expr as IRArrayLength;
      return `${safeId(arrLen.name)}.length`;

    case 'text_concat':
      const concat = expr as IRTextConcat;
      return `${emitExpr(concat.left, declared)} + ${emitExpr(concat.right, declared)}`;

    case 'text_length':
      const txtLen = expr as IRTextLength;
      return `${emitExpr(txtLen.expr, declared)}.length()`;

    case 'input_read':
      const input = expr as IRInputRead;
      if (input.type === 'int') {return 'scanner.nextInt()';}
      if (input.type === 'double') {return 'scanner.nextDouble()';}
      return 'scanner.nextLine()';

    case 'ternary':
      const tern = expr as IRTernary;
      return `(${emitExpr(tern.condition, declared)} ? ${emitExpr(tern.ifTrue, declared)} : ${emitExpr(tern.ifFalse, declared)})`;

    case 'char_at':
      const ca = expr as IRCharAt;
      return `${emitExpr(ca.text, declared)}.charAt(${emitExpr(ca.index, declared)})`;

    case 'text_contains':
      const tc = expr as IRTextContains;
      return `${emitExpr(tc.text, declared)}.contains(${emitExpr(tc.search, declared)})`;

    case 'text_substring':
      const tsub = expr as IRTextSubstring;
      return `${emitExpr(tsub.text, declared)}.substring((int)(${emitExpr(tsub.start, declared)}), (int)(${emitExpr(tsub.end, declared)}))`;

    case 'list_get':
      const lg = expr as IRListGet;
      return `${safeId(lg.listName)}.get((int)(${emitExpr(lg.index, declared)}))`;

    case 'list_size':
      const ls = expr as IRListSize;
      return `${safeId(ls.listName)}.size()`;

    case 'list_contains':
      const lc = expr as IRListContains;
      return `${safeId(lc.listName)}.contains(${emitExpr(lc.value, declared)})`;

    case 'new_object':
      const no = expr as IRNewObject;
      const noArgs = no.args.map(a => emitExpr(a, declared)).join(', ');
      return `new ${no.className}(${noArgs})`;

    case 'this_ref':
      return 'this';

    case 'timer':
      return 'System.currentTimeMillis()';

    case 'lambda':
      const lam = expr as IRLambda;
      const lamParams = lam.params.length === 1 ? lam.params[0] : `(${lam.params.join(', ')})`;
      return `${lamParams} -> ${emitExpr(lam.body, declared)}`;

    case 'stream_filter':
      const sf = expr as IRStreamFilter;
      return `${safeId(sf.collection)}.stream().filter(${sf.variable} -> ${emitExpr(sf.condition, declared)}).collect(Collectors.toList())`;

    case 'function_call_expr':
      const fce = expr as IRFunctionCallExpr;
      const fceArgs = fce.args.map(a => emitExpr(a, declared)).join(', ');
      return `${safeId(fce.name)}(${fceArgs})`;

    default:
      return '0';
  }
}

// ---------- EMISOR DE EXPRESIONES BOOLEANAS ----------

function emitBooleanExpr(expr: IRExpr, declared: Set<string>): string {
  const code = emitExpr(expr, declared);
  switch (expr.kind) {
    case 'boolean':
      return code;
    case 'binary_op':
      // Operadores que ya devuelven boolean
      if (['==', '!=', '<', '>', '<=', '>=', '&&', '||', '.equals'].includes(expr.op)) {
        return code;
      }
      return `${code} != 0`;
    case 'unary_op':
      if (expr.op === '!') {return code;}
      return `${code} != 0`;
    case 'text_contains':
    case 'list_contains':
      return code;
    case 'number':
      return `${code} != 0`;
    case 'string':
      return `${code}.length() > 0`;
    default:
      return code;
  }
}

// ---------- Helper para identar texto ----------

function indent(text: string, level: number): string {
  if (!text) {
    return '';
  }
  const pad = '    '.repeat(level);
  return text
    .split('\n')
    .map((line) => (line.trim() ? pad + line : line))
    .join('\n');
}

function safeId(name: string): string {
  const cleaned = (name ?? '').replace(/[^\w]/g, '_');
  if (!cleaned) {
    return 'var';
  }
  return /^\d/.test(cleaned) ? '_' + cleaned : cleaned;
}
