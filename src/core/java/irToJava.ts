import { IRNode, IRExpr, IRRepeat, IRIf, IRWhile, IRFor, IRForever, IRSwitch, IRPrint, IRVarAssign, IRVarChange, IRVarRef, IRUnaryOp, IRString, IRRandom, IRComment, IRVarDeclaration, IRVarDeclarationInit, IRVarIncrement, IRVarDecrement, IRArrayDeclaration, IRArrayAccess, IRArrayAssignment, IRArrayLength, IRFunctionDefinition, IRFunctionCall, IRReturn, IRClassDefinition, IRInterfaceDefinition, IRTextConcat, IRTextLength, IRTextSubstring, IRInputRead, IRTryCatchFinally, IRThrow, IRWaitSeconds, IRWaitUntil, IRStop, IRListDeclaration, IRListAdd, IRListRemove, IRListClear, IRListInsert, IRListSet, IRMapDeclaration, IRMapPut, IRMapRemove, IRMapGet, IRMapContainsKey, IREnumDefinition, IRThreadCreate, IRSynchronized, IRImport, IRCodeTemplate, IRBroadcast, IRBroadcastWait, IRWhenReceive, IRTernary, IRCharAt, IRTextContains, IRListGet, IRListSize, IRListContains, IRNewObject, IRLambda, IRStreamFilter, IRFunctionCallExpr, IRFileWrite, IREncryptDecrypt, IRDesktopApp, IRMobileApp, IRWebService, IRDoWhile, IRForEach, IRCompoundAssign, IRMethodCall, IRMethodCallExpr, IRFieldAccess, IRFieldAssign, IRPrintf, IRSuperCall, IRConstantDeclaration, IRArray2DDeclaration, IRArray2DAssignment, IRArray2DAccess, IRCollectionDeclaration, IRCharLiteral, IRStaticCall, IRConstant, IRInstanceOf, IRExprStatement, IRLabeled, IRJumpLabel, IRAssert, IRSwitchArrow, IRSwitchExpr, IRRecordDefinition, IRLambdaBlock, IRMethodRef, IRTextBlock, IRAnonymousClass } from '../ir/nodes';

type Ctx = { loopCounter: number; classLevel?: boolean; throwingFunctions?: Set<string> };

/** Context for the body of a method: its statements are local, not members of the class. */
function bodyCtx(ctx: Ctx): Ctx {
  return { ...ctx, classLevel: false };
}

// Calls emitted by blocks that throw checked exceptions (files, URLs, databases, threads...).
const CHECKED_CALLS = /\b(Files\.(readAllBytes|writeString)|openConnection|DriverManager\.getConnection|Class\.forName|ProcessBuilder\(|Cipher\.getInstance|\.join\(\)|\.awaitTermination\()/;

/**
 * Names of the top-level functions whose body needs `throws Exception`: they use a block
 * that throws a checked exception or call another such function.
 */
function findThrowingFunctions(nodes: IRNode[]): Set<string> {
  const bodies = new Map<string, string>();
  for (const n of nodes) {
    if (n.kind === 'function_definition') {
      const f = n as IRFunctionDefinition;
      bodies.set(safeId(f.name), emitNodes(f.body, new Set(), { loopCounter: 0 }));
    }
  }
  const throwing = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const [name, body] of bodies) {
      if (throwing.has(name)) {
        continue;
      }
      const callsThrowing = [...throwing].some(t => new RegExp(`\\b${t}\\(`).test(body));
      if (CHECKED_CALLS.test(body) || callsThrowing) {
        throwing.add(name);
        changed = true;
      }
    }
  }
  return throwing;
}

let lambdaCounter = 0;

/**
 * classLevel: the nodes are members of PacoProgram (functions, classes, constants)
 * rather than statements inside main.
 */
export function irToJava(nodes: IRNode[], options: { classLevel?: boolean } = {}): string {
  const declared = new Set<string>();
  const throwingFunctions = options.classLevel ? findThrowingFunctions(nodes) : new Set<string>();
  const ctx: Ctx = { loopCounter: 0, classLevel: options.classLevel, throwingFunctions };
  lambdaCounter = 0;
  const body = emitNodes(nodes, declared, ctx);
  if (body.includes('scanner.')) {
    return 'java.util.Scanner scanner = new java.util.Scanner(System.in);\n' + body;
  }
  return body;
}

function emitNodes(nodes: IRNode[], declared: Set<string>, ctx: Ctx): string {
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
        // Outside a method body the class is a member of PacoProgram; inside one it is a local class.
        out += emitClassDefinition(node as IRClassDefinition, declared, ctx, ctx.classLevel !== false);
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

      case 'stop': {
        const stopNode = node as IRStop;
        out += stopNode.mode === 'ALL' ? 'System.exit(0);\n' : 'return;\n';
        break;
      }

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

      case 'map_put':
        out += `${safeId((node as IRMapPut).mapName)}.put(${emitExpr((node as IRMapPut).key, declared)}, ${emitExpr((node as IRMapPut).value, declared)});\n`;
        break;

      case 'map_remove':
        out += `${safeId((node as IRMapRemove).mapName)}.remove(${emitExpr((node as IRMapRemove).key, declared)});\n`;
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

      case 'file_write': {
        const fw = node as IRFileWrite;
        const content = emitExpr(fw.content, declared);
        out += `try { java.nio.file.Files.writeString(java.nio.file.Paths.get("${fw.path}"), ${content}); } catch (java.io.IOException e) { e.printStackTrace(); }\n`;
        break;
      }

      case 'encrypt_decrypt': {
        const ed = node as IREncryptDecrypt;
        const data = emitExpr(ed.data, declared);
        const op = ed.mode === 'ENCRYPT' ? 'javax.crypto.Cipher.ENCRYPT_MODE' : 'javax.crypto.Cipher.DECRYPT_MODE';
        out += `javax.crypto.Cipher cipher = javax.crypto.Cipher.getInstance("AES");\n`;
        out += `cipher.init(${op}, new javax.crypto.spec.SecretKeySpec("${ed.key}".getBytes(), "AES"));\n`;
        out += `byte[] result = cipher.doFinal(${data}.getBytes(java.nio.charset.StandardCharsets.UTF_8));\n`;
        break;
      }

      case 'desktop_app': {
        const da = node as IRDesktopApp;
        const daBody = emitNodes(da.body, declared, ctx);
        out += `javax.swing.JFrame frame = new javax.swing.JFrame("${da.title}");\n`;
        out += `frame.setSize(400, 300);\n`;
        out += `frame.setDefaultCloseOperation(javax.swing.JFrame.EXIT_ON_CLOSE);\n`;
        out += daBody;
        out += `frame.setVisible(true);\n`;
        break;
      }

      case 'mobile_app': {
        const ma = node as IRMobileApp;
        const maBody = emitNodes(ma.body, declared, ctx);
        out += maBody;
        break;
      }

      case 'do_while': {
        const dw = node as IRDoWhile;
        out += `do {\n${indent(emitNodes(dw.body, declared, ctx), 1)}} while (${emitBooleanExpr(dw.condition, declared)});\n`;
        break;
      }

      case 'for_each': {
        const fe = node as IRForEach;
        const inner = new Set(declared);
        inner.add(safeId(fe.name));
        out += `for (${fe.elementType} ${safeId(fe.name)} : ${emitTarget(fe.collection, declared)}) {\n${indent(emitNodes(fe.body, inner, ctx), 1)}}\n`;
        break;
      }

      case 'compound_assign': {
        const ca = node as IRCompoundAssign;
        out += `${safeId(ca.name)} ${ca.op} ${emitExpr(ca.value, declared)};\n`;
        break;
      }

      case 'method_call': {
        const mc = node as IRMethodCall;
        out += `${emitMethodCall(mc.target, mc.method, mc.args, declared)};\n`;
        break;
      }

      case 'field_assign': {
        const fa = node as IRFieldAssign;
        out += `${emitTarget(fa.target, declared)}.${safeId(fa.field)} = ${emitExpr(fa.value, declared)};\n`;
        break;
      }

      case 'printf': {
        const pf = node as IRPrintf;
        const args = pf.args.map(a => ', ' + emitExpr(a, declared)).join('');
        out += `System.out.printf(${javaString(pf.format)}${args});\n`;
        break;
      }

      case 'super_call':
        out += `super(${(node as IRSuperCall).args.map(a => emitExpr(a, declared)).join(', ')});\n`;
        break;

      case 'constant_declaration': {
        const cd = node as IRConstantDeclaration;
        declared.add(safeId(cd.name));
        const mods = ctx.classLevel ? 'static final' : 'final';
        out += `${mods} ${cd.type} ${safeId(cd.name)} = ${emitExpr(cd.value, declared)};\n`;
        break;
      }

      case 'array2d_declaration': {
        const a2 = node as IRArray2DDeclaration;
        declared.add(safeId(a2.name));
        out += `${a2.type}[][] ${safeId(a2.name)} = new ${a2.type}[${emitExpr(a2.rows, declared)}][${emitExpr(a2.cols, declared)}];\n`;
        break;
      }

      case 'array2d_assignment': {
        const as2 = node as IRArray2DAssignment;
        out += `${safeId(as2.name)}[${emitExpr(as2.row, declared)}][${emitExpr(as2.col, declared)}] = ${emitExpr(as2.value, declared)};\n`;
        break;
      }

      case 'collection_declaration': {
        const cd = node as IRCollectionDeclaration;
        declared.add(safeId(cd.name));
        out += `java.util.${cd.collectionType}<${cd.elementType}> ${safeId(cd.name)} = new java.util.${cd.collectionType}<>();\n`;
        break;
      }

      case 'labeled': {
        const lb = node as IRLabeled;
        // Java labels a single statement: put the label on the first loop, or wrap everything in a block.
        const loopKinds = ['for', 'while', 'repeat', 'forever', 'do_while', 'for_each'];
        const loopAt = lb.body.findIndex(n => loopKinds.includes(n.kind));
        if (loopAt < 0) {
          out += `${safeId(lb.label)}: {\n${indent(emitNodes(lb.body, new Set(declared), ctx), 1)}}\n`;
        } else {
          out += emitNodes(lb.body.slice(0, loopAt), declared, ctx);
          out += `${safeId(lb.label)}:\n`;
          out += emitNodes(lb.body.slice(loopAt), declared, ctx);
        }
        break;
      }

      case 'jump_label': {
        const jl = node as IRJumpLabel;
        out += `${jl.jump} ${safeId(jl.label)};\n`;
        break;
      }

      case 'assert': {
        const as = node as IRAssert;
        const msg = as.message ? ` : ${emitExpr(as.message, declared)}` : '';
        out += `assert ${emitBooleanExpr(as.condition, declared)}${msg};\n`;
        break;
      }

      case 'switch_arrow': {
        const sa = node as IRSwitchArrow;
        let cases = '';
        for (const c of sa.cases) {
          const label = c.value ? `case ${emitExpr(c.value, declared)}` : 'default';
          cases += `${label} -> {\n${indent(emitNodes(c.body, new Set(declared), ctx), 1)}}\n`;
        }
        out += `switch (${emitExpr(sa.expr, declared)}) {\n${indent(cases, 1)}}\n`;
        break;
      }

      case 'record_definition': {
        const rd = node as IRRecordDefinition;
        const recordImpl = rd.implementsInterfaces && rd.implementsInterfaces.length > 0 ? ` implements ${rd.implementsInterfaces.join(', ')}` : '';
        out += `public record ${safeId(rd.name)}(${rd.components.map(c => `${c.type} ${safeId(c.name)}`).join(', ')})${recordImpl} {}\n`;
        break;
      }

      case 'expr_statement':
        out += `${emitExpr((node as IRExprStatement).expr, declared)};\n`;
        break;

      case 'web_service': {
        const ws = node as IRWebService;
        const wsBody = emitNodes(ws.body, declared, ctx);
        out += wsBody;
        break;
      }

      default:
        break;
    }
  }

  return out;
}

function emitRepeat(node: IRRepeat, declared: Set<string>, ctx: Ctx): string {
  const timesCode = emitExpr(node.times, declared);
  const loopVar = `i_${ctx.loopCounter++}`;
  const body = emitNodes(node.body, declared, ctx);

  return (
    `for (int ${loopVar} = 0; ${loopVar} < ${timesCode}; ${loopVar}++) {\n` +
    indent(body || '', 1) +
    `}\n`
  );
}

function emitIf(node: IRIf, declared: Set<string>, ctx: Ctx): string {
  const condCode = emitBooleanExpr(node.condition, declared);
  const body = emitNodes(node.body, declared, ctx);

  let result =
    `if (${condCode}) {\n` +
    indent(body || '', 1) +
    `}\n`;

  if (node.elseBody && node.elseBody.length > 0) {
    const elseCode = emitNodes(node.elseBody, declared, ctx);

    if (node.elseBody.length === 1 && node.elseBody[0].kind === 'if') {
      result = result.trimEnd() + ` else ` + elseCode;
    } else {
      result = result.trimEnd() + ` else {\n` +
        indent(elseCode || '', 1) +
        `}\n`;
    }
  }

  return result;
}

function emitWhile(node: IRWhile, declared: Set<string>, ctx: Ctx): string {
  const condCode = emitBooleanExpr(node.condition, declared);
  const body = emitNodes(node.body, declared, ctx);

  return (
    `while (${condCode}) {\n` +
    indent(body || '', 1) +
    `}\n`
  );
}

function emitFor(node: IRFor, declared: Set<string>, ctx: Ctx): string {
  const forDeclared = new Set(declared);
  const initCode = node.init ? emitNodes([node.init], forDeclared, ctx).trim().replace(/;$/, '') : '';
  const condCode = node.condition ? emitExpr(node.condition, forDeclared) : 'true';
  const incrCode = node.increment ? emitNodes([node.increment], forDeclared, ctx).trim().replace(/;$/, '') : '';
  const bodyCode = emitNodes(node.body, forDeclared, ctx) || '';
  return `for (${initCode}; ${condCode}; ${incrCode}) {\n${indent(bodyCode, 1)}}\n`;
}

function emitSwitch(node: IRSwitch, declared: Set<string>, ctx: Ctx): string {
  const exprCode = emitExpr(node.expr, declared);
  let casesCode = '';
  for (const c of node.cases) {
    const label = c.value ? `case ${emitExpr(c.value, declared)}:` : 'default:';
    const last = c.body.length > 0 ? c.body[c.body.length - 1].kind : '';
    // A trailing break after an explicit break/continue/return/throw is unreachable and javac rejects it.
    const autoBreak = ['break', 'return', 'throw', 'continue', 'jump_label', 'stop'].includes(last) ? '' : 'break;\n';
    casesCode += `${label}\n${indent(emitNodes(c.body, declared, ctx) + autoBreak, 1)}`;
  }
  return `switch (${exprCode}) {\n${indent(casesCode, 1)}}\n`;
}

function emitPrint(node: IRPrint, declared: Set<string>, ctx: Ctx): string {
  const exprCode = emitExpr(node.value, declared);
  return node.newline === false ? `System.out.print(${exprCode});\n` : `System.out.println(${exprCode});\n`;
}

function emitComment(node: IRComment, declared: Set<string>, ctx: Ctx): string {
  return `// ${node.text}\n`;
}

function emitVarDeclaration(node: IRVarDeclaration, declared: Set<string>, ctx: Ctx): string {
  declared.add(node.name);
  return `${node.type} ${safeId(node.name)};\n`;
}

function emitVarDeclarationInit(node: IRVarDeclarationInit, declared: Set<string>, ctx: Ctx): string {
  declared.add(node.name);
  const valueCode = emitExpr(node.value, declared);
  return `${node.type} ${safeId(node.name)} = ${valueCode};\n`;
}

function emitVarIncrement(node: IRVarIncrement, declared: Set<string>, ctx: Ctx): string {
  return `${safeId(node.name)}++;\n`;
}

function emitVarDecrement(node: IRVarDecrement, declared: Set<string>, ctx: Ctx): string {
  return `${safeId(node.name)}--;\n`;
}

function emitArrayDeclaration(node: IRArrayDeclaration, declared: Set<string>, ctx: Ctx): string {
  declared.add(node.name);
  const sizeCode = emitExpr(node.size, declared);
  return `${node.type}[] ${safeId(node.name)} = new ${node.type}[${sizeCode}];\n`;
}

function emitArrayAssignment(node: IRArrayAssignment, declared: Set<string>, ctx: Ctx): string {
  const indexCode = emitExpr(node.index, declared);
  const valueCode = emitExpr(node.value, declared);
  return `${safeId(node.name)}[${indexCode}] = ${valueCode};\n`;
}

function emitFunctionDefinition(node: IRFunctionDefinition, declared: Set<string>, ctx: Ctx): string {
  const paramsCode = node.params.map(p => `${p.type} ${safeId(p.name)}`).join(', ');
  const bodyCode = emitNodes(node.body, new Set(declared), bodyCtx(ctx));
  const throwsCode = ctx.throwingFunctions?.has(safeId(node.name)) ? ' throws Exception' : '';
  return `public static ${node.returnType} ${safeId(node.name)}(${paramsCode})${throwsCode} {\n${indent(bodyCode, 1)}}\n`;
}

function emitFunctionCall(node: IRFunctionCall, declared: Set<string>, ctx: Ctx): string {
  const argsCode = node.args.map(arg => emitExpr(arg, declared)).join(', ');
  return `${safeId(node.name)}(${argsCode});\n`;
}

function emitReturn(node: IRReturn, declared: Set<string>, ctx: Ctx): string {
  if (node.value) {
    const valueCode = emitExpr(node.value, declared);
    return `return ${valueCode};\n`;
  }
  return 'return;\n';
}

function emitClassDefinition(node: IRClassDefinition, declared: Set<string>, ctx: Ctx, member: boolean = true): string {
  // Member classes live inside PacoProgram (or another class), so they must be static to be created from main.
  // Local classes, declared inside a method, cannot take modifiers.
  // A final class cannot be abstract, so the inheritance choice wins over the checkbox.
  const abstractMod = node.isAbstract && node.inheritance !== 'final' ? 'abstract ' : '';
  const inheritanceMod = node.inheritance ? `${node.inheritance} ` : '';
  let header = `${member ? 'public static ' : ''}${abstractMod}${inheritanceMod}class ${node.name}`;
  if (node.extendsClass) {
    header += ` extends ${node.extendsClass}`;
  }
  if (node.implementsInterfaces && node.implementsInterfaces.length > 0) {
    header += ` implements ${node.implementsInterfaces.join(', ')}`;
  }
  if (node.inheritance === 'sealed' && node.permits && node.permits.length > 0) {
    header += ` permits ${node.permits.join(', ')}`;
  }
  const attrCode = emitClassAttributes(node.attributes, declared, ctx);
  // A generic class Caja<T> has a constructor called just Caja.
  const simpleName = node.name.replace(/<.*$/, '').trim();
  const methodCode = node.methods.map(m => emitClassMethod(m, simpleName, declared, ctx)).join('\n');
  const innerCode = (node.innerClasses ?? []).map(c => '\n' + emitClassDefinition(c, declared, ctx, true)).join('');
  return `${header} {\n${indent(attrCode + methodCode + innerCode, 1)}}\n`;
}

function emitClassAttributes(attrs: IRVarDeclaration[], declared: Set<string>, ctx: Ctx): string {
  let out = '';
  for (const attr of attrs) {
    const mods = [attr.accessModifier || 'private'];
    if (attr.isStatic) { mods.push('static'); }
    if (attr.isFinal) { mods.push('final'); }
    const init = attr.value ? ` = ${emitExpr(attr.value, declared)}` : '';
    out += `${mods.join(' ')} ${attr.type} ${safeId(attr.name)}${init};\n`;
  }
  return out;
}

function emitClassMethod(node: IRFunctionDefinition, className: string, declared: Set<string>, ctx: Ctx): string {
  const mod = node.accessModifier || 'public';
  const override = node.isOverride ? '@Override\n' : '';
  const staticMod = node.isStatic ? 'static ' : '';

  if (node.name === '__constructor__') {
    const paramsCode = node.params.map(p => `${p.type} ${safeId(p.name)}`).join(', ');
    const bodyCode = emitNodes(node.body, new Set(declared), bodyCtx(ctx));
    return `${override}${mod} ${className}(${paramsCode}) {\n${indent(bodyCode, 1)}}\n`;
  }

  const paramsCode = node.params.map(p => `${p.type} ${safeId(p.name)}`).join(', ');
  const throwsCode = node.throwsTypes ? ` throws ${node.throwsTypes}` : '';
  if (node.isAbstract) {
    return `${mod} abstract ${node.returnType} ${safeId(node.name)}(${paramsCode})${throwsCode};\n`;
  }
  const bodyCode = emitNodes(node.body, new Set(declared), bodyCtx(ctx));
  return `${override}${mod} ${staticMod}${node.returnType} ${safeId(node.name)}(${paramsCode})${throwsCode} {\n${indent(bodyCode, 1)}}\n`;
}

function emitInterfaceDefinition(node: IRInterfaceDefinition, declared: Set<string>, ctx: Ctx): string {
  let methodsCode = '';
  for (const m of node.methods) {
    const params = m.params.map(p => `${p.type} ${safeId(p.name)}`).join(', ');
    methodsCode += `${m.returnType} ${safeId(m.name)}(${params});\n`;
  }
  const permits = node.isSealed && node.permits && node.permits.length > 0 ? ` permits ${node.permits.join(', ')}` : '';
  return `public ${node.isSealed ? 'sealed ' : ''}interface ${node.name}${permits} {\n${indent(methodsCode, 1)}}\n`;
}

function emitForever(node: IRForever, declared: Set<string>, ctx: Ctx): string {
  const body = emitNodes(node.body, declared, ctx);
  return `while (true) {\n${indent(body || '', 1)}}\n`;
}

function emitWaitSeconds(node: IRWaitSeconds, declared: Set<string>, ctx: Ctx): string {
  const secs = emitExpr(node.seconds, declared);
  return `try { Thread.sleep((long)(${secs} * 1000)); } catch (InterruptedException e) { e.printStackTrace(); }\n`;
}

function emitWaitUntil(node: IRWaitUntil, declared: Set<string>, ctx: Ctx): string {
  const cond = emitExpr(node.condition, declared);
  return `while (!(${cond})) {\n${indent('try { Thread.sleep(10); } catch (InterruptedException e) { break; }\n', 1)}}\n`;
}

function emitTryCatchFinally(node: IRTryCatchFinally, declared: Set<string>, ctx: Ctx): string {
  const tryCode = emitNodes(node.tryBody, declared, ctx);
  const catches = node.catches ?? [{ type: node.catchType, varName: node.catchVar, body: node.catchBody }];
  let result = `try {\n${indent(tryCode, 1)}}`;
  for (const c of catches) {
    result += ` catch (${c.type} ${safeId(c.varName)}) {\n${indent(emitNodes(c.body, declared, ctx), 1)}}`;
  }
  if (node.finallyBody && node.finallyBody.length > 0) {
    const finallyCode = emitNodes(node.finallyBody, declared, ctx);
    result += ` finally {\n${indent(finallyCode, 1)}}`;
  }
  return result + '\n';
}

function emitThrow(node: IRThrow, declared: Set<string>, ctx: Ctx): string {
  const expr = emitExpr(node.expr, declared);
  return `throw ${expr};\n`;
}

function emitWhenReceive(node: IRWhenReceive, declared: Set<string>, ctx: Ctx): string {
  const body = emitNodes(node.body, declared, bodyCtx(ctx));
  return `public static void ${safeId(node.message)}() {\n${indent(body, 1)}}\n`;
}

function emitListDeclaration(node: IRListDeclaration, declared: Set<string>, ctx: Ctx): string {
  declared.add(node.name);
  return `java.util.ArrayList<${node.elementType}> ${safeId(node.name)} = new java.util.ArrayList<>();\n`;
}

function emitMapDeclaration(node: IRMapDeclaration, declared: Set<string>, ctx: Ctx): string {
  declared.add(node.name);
  return `java.util.HashMap<${node.keyType}, ${node.valueType}> ${safeId(node.name)} = new java.util.HashMap<>();\n`;
}

function emitEnumDefinition(node: IREnumDefinition, declared: Set<string>, ctx: Ctx): string {
  return `enum ${node.name} { ${node.values.join(', ')} }\n`;
}

function emitThreadCreate(node: IRThreadCreate, declared: Set<string>, ctx: Ctx): string {
  const body = emitNodes(node.body, declared, ctx);
  return `Thread ${safeId(node.name)} = new Thread(() -> {\n${indent(body, 1)}});\n${safeId(node.name)}.start();\n`;
}

function emitSynchronized(node: IRSynchronized, declared: Set<string>, ctx: Ctx): string {
  const lock = emitExpr(node.lock, declared);
  const body = emitNodes(node.body, declared, ctx);
  return `synchronized (${lock}) {\n${indent(body, 1)}}\n`;
}

function emitVarAssign(node: IRVarAssign, declared: Set<string>, ctx: Ctx): string {
  const name = safeId(node.name);
  const valueCode = emitExpr(node.value, declared);

  if (!declared.has(name)) {
    declared.add(name);
    return `var ${name} = ${valueCode};\n`;
  }
  return `${name} = ${valueCode};\n`;
}

function emitVarChange(node: IRVarChange, declared: Set<string>, ctx: Ctx): string {
  const name = safeId(node.name);
  const valueCode = emitExpr(node.value, declared);

  if (!declared.has(name)) {
    declared.add(name);
    return `var ${name} = ${valueCode};\n`;
  }
  return `${name} += ${valueCode};\n`;
}

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
      return javaString((expr as IRString).value);

    case 'random':
      const rand = expr as IRRandom;
      // Integer between min and max, both included, like Scratch's "número al azar".
      return `((int) (Math.random() * ((${emitExpr(rand.max, declared)}) - (${emitExpr(rand.min, declared)}) + 1)) + (${emitExpr(rand.min, declared)}))`;

    case 'binary_op':
      if (expr.op === 'xor') {
        return `(${emitExpr(expr.left, declared)} ^ ${emitExpr(expr.right, declared)})`;
      }
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
      if (input.type === 'boolean') {return 'scanner.nextBoolean()';}
      if (input.type === 'word') {return 'scanner.next()';}
      if (input.type === 'hasNextInt') {return 'scanner.hasNextInt()';}
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

    case 'map_get':
      const mg = expr as IRMapGet;
      return `${safeId(mg.mapName)}.get(${emitExpr(mg.key, declared)})`;

    case 'map_contains_key':
      const mck = expr as IRMapContainsKey;
      return `${safeId(mck.mapName)}.containsKey(${emitExpr(mck.key, declared)})`;

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
      return `${safeId(sf.collection)}.stream().filter(${sf.variable} -> ${emitExpr(sf.condition, declared)}).collect(java.util.stream.Collectors.toList())`;

    case 'function_call_expr':
      const fce = expr as IRFunctionCallExpr;
      const fceArgs = fce.args.map(a => emitExpr(a, declared)).join(', ');
      return `${safeId(fce.name)}(${fceArgs})`;

    case 'method_call_expr': {
      const mce = expr as IRMethodCallExpr;
      return emitMethodCall(mce.target, mce.method, mce.args, declared);
    }

    case 'field_access': {
      const fa = expr as IRFieldAccess;
      return `${emitTarget(fa.target, declared)}.${safeId(fa.field)}`;
    }

    case 'char':
      return `'${escapeJava((expr as IRCharLiteral).value, "'")}'`;

    case 'null':
      return 'null';

    case 'super_ref':
      return 'super';

    case 'static_call': {
      const sc = expr as IRStaticCall;
      return `${qualifiedName(sc.callee)}(${sc.args.map(a => emitExpr(a, declared)).join(', ')})`;
    }

    case 'constant':
      return qualifiedName((expr as IRConstant).code);

    case 'instance_of': {
      const io = expr as IRInstanceOf;
      const bind = io.bindName ? ` ${safeId(io.bindName)}` : '';
      return `(${emitTarget(io.expr, declared)} instanceof ${io.className}${bind})`;
    }

    case 'lambda_block': {
      const lb = expr as IRLambdaBlock;
      const params = lb.params.length === 1 ? safeId(lb.params[0]) : `(${lb.params.map(safeId).join(', ')})`;
      // Variables inside a lambda cannot shadow the method's own, so its loops get their own counter range.
      const body = emitNodes(lb.body, new Set(declared), { loopCounter: 1000 * ++lambdaCounter });
      return `${params} -> {\n${indent(body, 1)}}`;
    }

    case 'method_ref': {
      const mr = expr as IRMethodRef;
      return `${qualifiedName(mr.target)}::${mr.method === 'new' ? 'new' : safeId(mr.method)}`;
    }

    case 'switch_expr': {
      const se = expr as IRSwitchExpr;
      let cases = '';
      for (const c of se.cases) {
        const label = c.value ? `case ${emitExpr(c.value, declared)}` : 'default';
        cases += `${label} -> ${emitExpr(c.result, declared)};\n`;
      }
      // A switch expression must cover every value.
      if (!se.cases.some(c => c.value === undefined)) {
        cases += 'default -> throw new IllegalStateException("valor no previsto");\n';
      }
      return `switch (${emitExpr(se.expr, declared)}) {\n${indent(cases, 1)}}`;
    }

    case 'text_block':
      return emitTextBlock(expr as IRTextBlock);

    case 'anonymous_class': {
      const ac = expr as IRAnonymousClass;
      const ctx: Ctx = { loopCounter: 1000 * ++lambdaCounter };
      const methods = ac.methods.map(m => emitClassMethod(m, ac.className, declared, ctx)).join('\n');
      return `new ${ac.className}() {\n${indent(methods, 1)}}`;
    }

    case 'array2d_access': {
      const a2 = expr as IRArray2DAccess;
      return `${safeId(a2.name)}[${emitExpr(a2.row, declared)}][${emitExpr(a2.col, declared)}]`;
    }

    default:
      return '0';
  }
}

/** Expressions that can sit before a "." without parentheses. */
const SIMPLE_TARGETS = ['var_ref', 'this_ref', 'super_ref', 'string', 'method_call_expr', 'field_access', 'function_call_expr', 'array_access', 'array2d_access', 'list_get', 'map_get', 'static_call', 'constant'];

function emitTarget(expr: IRExpr, declared: Set<string>): string {
  const code = emitExpr(expr, declared);
  return SIMPLE_TARGETS.includes(expr.kind) ? code : `(${code})`;
}

function emitMethodCall(target: IRExpr, method: string, args: IRExpr[], declared: Set<string>): string {
  return `${emitTarget(target, declared)}.${safeId(method)}(${args.map(a => emitExpr(a, declared)).join(', ')})`;
}

/** Library names come from dropdowns; anything else is reduced to a safe dotted name. */
function qualifiedName(name: string): string {
  return name.split('.').map(part => safeId(part)).join('.');
}

/**
 * Makes typed text safe inside a Java literal. Escapes the student typed on purpose
 * (\n, \t, \") are kept; stray backslashes, bare quotes and real line breaks are escaped.
 */
function escapeJava(text: string, quote: string): string {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '\\') {
      const next = text[i + 1];
      if (next !== undefined && 'btnfrs"\'\\01234567'.includes(next)) {
        out += c + next;
        i++;
      } else {
        out += '\\\\';
      }
    } else if (c === quote) {
      out += '\\' + quote;
    } else if (c === '\n') {
      out += '\\n';
    } else if (c === '\r') {
      out += '\\r';
    } else {
      out += c;
    }
  }
  return out;
}

function javaString(text: string): string {
  return `"${escapeJava(text, '"')}"`;
}

function emitBooleanExpr(expr: IRExpr, declared: Set<string>): string {
  const code = emitExpr(expr, declared);
  switch (expr.kind) {
    case 'boolean':
      return code;
    case 'binary_op':
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

/** Java 15 text block. Lines come from the "\n" the student typed. */
function emitTextBlock(tb: IRTextBlock): string {
  const q = '"'.repeat(3);
  // Escaping every quote keeps a line ending in " from merging with the closing delimiter.
  const body = tb.lines.map(l => escapeJava(l, '"')).join('\n');
  return `${q}\n${body}${q}`;
}
