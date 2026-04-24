// src/core/scratch/xmlToIr.ts
import { DOMParser } from 'xmldom';
import {
  IRNode,
  IRExpr,
  IRRepeat,
  IRIf,
  IRWhile,
  IRForever,
  IRPrint,
  IRVarAssign,
  IRVarChange,
  IRNumber,
  IRBoolean,
  IRBinaryOp,
  IRUnaryOp,
  IRString,
  IRRandom,
  IRVarRef,
  IRComment,
  IRVarDeclaration,
  IRVarDeclarationInit,
  IRVarIncrement,
  IRVarDecrement,
  IRArrayDeclaration,
  IRArrayAccess,
  IRArrayAssignment,
  IRArrayLength,
  IRFunctionDefinition,
  IRFunctionCall,
  IRReturn,
  IRClassDefinition,
  IRInterfaceDefinition,
  IRBreak,
  IRContinue,
  IRFor,
  IRSwitch,
  IRTextConcat,
  IRTextLength,
  IRInputRead,
  IRTryCatchFinally,
  IRThrow,
  IRWaitSeconds,
  IRWaitUntil,
  IRStop,
  IRListDeclaration,
  IRListAdd,
  IRListRemove,
  IRListClear,
  IRListInsert,
  IRListSet,
  IRMapDeclaration,
  IREnumDefinition,
  IRThreadCreate,
  IRSynchronized,
  IRImport,
  IRCodeTemplate,
  IRBroadcast,
  IRBroadcastWait,
  IRWhenReceive,
  IRTernary,
  IRCharAt,
  IRTextContains,
  IRTextSubstring,
  IRListGet,
  IRListSize,
  IRListContains,
  IRNewObject,
  IRThisRef,
  IRTimerExpr,
  IRLambda,
  IRStreamFilter,
  IRFunctionCallExpr,
} from '../ir/nodes';

/**
 * Punto de entrada: toma el XML que mandas desde la webview
 * y devuelve una lista de nodos IRNode.
 */
export function xmlToIr(xml: string): IRNode[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const root = doc.documentElement; // <xml ...>

  let result: IRNode[] = [];

  for (let n = root.firstChild; n; n = n.nextSibling) {
    if (n.nodeType !== 1) {
      continue;
    }
    const el = n as Element;
    if (el.tagName === 'block') {
      result = result.concat(parseBlockSequence(el));
    }
  }

  return result;
}

// ---------- Parsers de SECUENCIAS ----------

function parseBlockSequence(firstBlock: Element | null): IRNode[] {
  const result: IRNode[] = [];
  let current: Element | null = firstBlock;

  while (current) {
    if (current.tagName === 'block' || current.tagName === 'shadow') {
      const type = current.getAttribute('type');

      if (type === 'controls_repeat_ext' || type === 'controls_repeat') {
        result.push(parseRepeat(current));
      } else if (type === 'controls_if') {
        result.push(parseIf(current));
      } else if (type === 'controls_whileUntil') {
        result.push(parseWhile(current));
      } else if (type === 'controls_forever' || type === 'controls_for_infinite') {
        result.push(parseForever(current));
      } else if (type === 'variables_set' || type === 'variable_assignment') {
        result.push(parseVarSet(current));
      } else if (type === 'variables_change' || type === 'variable_change_by') {
        result.push(parseVarChange(current));
      } else if (type === 'text_print') {
        result.push(parseSay(current));
      } else if (type === 'comment_block') {
        result.push(parseComment(current));
      } else if (type === 'variable_declaration') {
        result.push(parseVarDeclaration(current));
      } else if (type === 'variable_declaration_init') {
        result.push(parseVarDeclarationInit(current));
      } else if (type === 'variable_increment') {
        result.push(parseVarIncrement(current));
      } else if (type === 'variable_decrement') {
        result.push(parseVarDecrement(current));
      } else if (type === 'array_declaration') {
        result.push(parseArrayDeclaration(current));
      } else if (type === 'array_initialization') {
        result.push(parseArrayInitialization(current));
      } else if (type === 'array_assignment') {
        result.push(parseArrayAssignment(current));
      } else if (type === 'function_definition') {
        result.push(parseFunctionDefinition(current));
      } else if (type === 'void_function_definition') {
        result.push(parseVoidFunctionDefinition(current));
      } else if (type === 'function_call') {
        result.push(parseFunctionCall(current));
      } else if (type === 'controls_for') {
        result.push(parseFor(current));
      } else if (type === 'controls_switch') {
        result.push(parseSwitch(current));
      } else if (type === 'controls_break') {
        result.push(parseBreak(current));
      } else if (type === 'controls_continue') {
        result.push(parseContinue(current));
      } else if (type === 'controls_return' || type === 'function_return_value') {
        result.push(parseReturn(current));
      }
      // Eventos
      else if (type === 'event_green_flag') {
        // No-op: the main wrapper handles it
      } else if (type === 'event_broadcast') {
        result.push(parseBroadcast(current));
      } else if (type === 'event_broadcast_wait') {
        result.push(parseBroadcastWait(current));
      } else if (type === 'event_when_receive') {
        result.push(parseWhenReceive(current));
      }
      // Control
      else if (type === 'controls_wait_seconds') {
        result.push(parseWaitSeconds(current));
      } else if (type === 'controls_wait_until') {
        result.push(parseWaitUntil(current));
      } else if (type === 'controls_stop') {
        result.push(parseStop(current));
      }
      // Manejo de errores
      else if (type === 'try_catch_finally') {
        result.push(parseTryCatchFinally(current));
      } else if (type === 'throw_exception') {
        result.push(parseThrow(current));
      }
      // Listas / Colecciones
      else if (type === 'list_declaration') {
        result.push(parseListDeclaration(current));
      } else if (type === 'list_add') {
        result.push(parseListAdd(current));
      } else if (type === 'list_remove') {
        result.push(parseListRemove(current));
      } else if (type === 'list_clear') {
        result.push(parseListClear(current));
      } else if (type === 'list_insert') {
        result.push(parseListInsert(current));
      } else if (type === 'list_set') {
        result.push(parseListSet(current));
      }
      // Map
      else if (type === 'map_declaration') {
        result.push(parseMapDeclaration(current));
      }
      // Enum
      else if (type === 'enum_definition') {
        result.push(parseEnumDefinition(current));
      }
      // OOP
      else if (type === 'class_definition') {
        result.push(parseClassDefinition(current));
      } else if (type === 'class_extends') {
        result.push(parseClassExtends(current));
      } else if (type === 'interface_definition') {
        result.push(parseInterfaceDefinition(current));
      } else if (type === 'class_implements') {
        result.push(parseClassImplements(current));
      } else if (type === 'method_override') {
        result.push(parseMethodOverride(current));
      } else if (type === 'method_definition') {
        result.push(parseMethodDefinition(current));
      } else if (type === 'constructor_definition') {
        result.push(parseConstructorDefinition(current));
      }
      // Funcional
      else if (type === 'generic_function') {
        result.push(parseGenericFunction(current));
      }
      // Concurrencia
      else if (type === 'thread_create') {
        result.push(parseThreadCreate(current));
      } else if (type === 'synchronized_block') {
        result.push(parseSynchronized(current));
      } else if (type === 'parallel_exec') {
        result.push(parseParallelExec(current));
      }
      // E/S
      else if (type === 'file_read') {
        result.push(parseFileRead(current));
      } else if (type === 'file_write') {
        result.push(parseFileWrite(current));
      } else if (type === 'url_connection') {
        result.push(parseUrlConnection(current));
      } else if (type === 'encrypt_decrypt') {
        result.push(parseEncryptDecrypt(current));
      } else if (type === 'db_connect') {
        result.push(parseDbConnect(current));
      }
      // Sistema
      else if (type === 'system_reset_timer') {
        result.push({ kind: 'code_template', code: 'long timerStart = System.currentTimeMillis();' } as IRCodeTemplate);
      }
      // Librerías
      else if (type === 'import_library') {
        result.push(parseImport(current));
      } else if (type === 'desktop_app') {
        result.push(parseDesktopApp(current));
      } else if (type === 'mobile_app') {
        result.push(parseMobileApp(current));
      } else if (type === 'web_service') {
        result.push(parseWebService(current));
      }
      // Avanzado
      else if (type === 'reflection') {
        result.push(parseReflection(current));
      } else if (type === 'garbage_collect') {
        result.push({ kind: 'code_template', code: 'System.gc();' } as IRCodeTemplate);
      } else if (type === 'interop_language') {
        result.push(parseInterop(current));
      }
      // Variable show
      else if (type === 'variable_show') {
        result.push(parseVariableShow(current));
      }

      current = getNextBlock(current);
    } else {
      break;
    }
  }

  return result;
}

function getNextBlock(block: Element): Element | null {
  for (let i = 0; i < block.childNodes.length; i++) {
    const child = block.childNodes.item(i) as Element;
    if (child && child.nodeType === 1 && child.tagName === 'next') {
      for (let j = 0; j < child.childNodes.length; j++) {
        const nextChild = child.childNodes.item(j) as Element;
        if (nextChild && nextChild.nodeType === 1 && (nextChild.tagName === 'block' || nextChild.tagName === 'shadow')) {
          return nextChild;
        }
      }
    }
  }
  return null;
}

// ---------- Parsers de NODOS (sentencias) ----------

function parseRepeat(block: Element): IRRepeat {
  // controls_repeat_ext usa <value name="TIMES">, controls_repeat usa <field name="TIMES">
  const timesValue = findValue(block, 'TIMES');
  let timesExpr: IRExpr;
  if (timesValue) {
    timesExpr = parseExprFromValue(timesValue);
  } else {
    const timesField = findFieldByName(block, 'TIMES');
    const num = timesField ? Number(timesField.textContent) : 0;
    timesExpr = numberLiteral(isNaN(num) ? 0 : num);
  }

  const bodyStatement = findStatement(block, 'DO');
  const body = bodyStatement ? parseStatementBody(bodyStatement) : [];

  return {
    kind: 'repeat',
    times: timesExpr,
    body,
  };
}

function parseIf(block: Element): IRIf {
  const condValue = findValue(block, 'IF0') || firstValue(block);
  const condExpr = condValue ? parseExprFromValue(condValue) : numberLiteral(0);

  const bodyStatement = findStatement(block, 'DO0') || findStatement(block, 'DO');
  const body = bodyStatement ? parseStatementBody(bodyStatement) : [];

  const mainIf: IRIf = {
    kind: 'if',
    condition: condExpr,
    body,
  };

  const mutation = firstChildMutation(block);
  const elseifCount = mutation ? parseInt(mutation.getAttribute('elseif') || '0', 10) : 0;
  const hasElse = mutation ? parseInt(mutation.getAttribute('else') || '0', 10) : 0;

  let lastIf = mainIf;

  for (let i = 1; i <= elseifCount; i++) {
    const eiCond = findValue(block, `IF${i}`);
    const eiCondEx = eiCond ? parseExprFromValue(eiCond) : numberLiteral(0);

    const eiBodySt = findStatement(block, `DO${i}`);
    const eiBody = eiBodySt ? parseStatementBody(eiBodySt) : [];

    const nextIf: IRIf = {
      kind: 'if',
      condition: eiCondEx,
      body: eiBody,
    };

    lastIf.elseBody = [nextIf];
    lastIf = nextIf;
  }

  if (hasElse || findStatement(block, 'ELSE')) {
    const elseStatement = findStatement(block, 'ELSE');
    const elseBody = elseStatement ? parseStatementBody(elseStatement) : [];
    lastIf.elseBody = elseBody;
  }

  return mainIf;
}

function parseVarSet(block: Element): IRVarAssign {
  const varField = firstField(block);
  const name = varField ? varField.textContent || 'var' : 'var';

  const valueNode = findValue(block, 'VALUE') || firstValue(block);
  const value = valueNode ? parseExprFromValue(valueNode) : numberLiteral(0);

  return {
    kind: 'var_assign',
    name,
    value,
  };
}

function parseVarChange(block: Element): IRVarChange {
  const varField = firstField(block);
  const name = varField ? varField.textContent || 'var' : 'var';

  const valueNode = findValue(block, 'VALUE') || firstValue(block);
  const value = valueNode ? parseExprFromValue(valueNode) : numberLiteral(0);

  return {
    kind: 'var_change',
    name,
    value,
  };
}

function parseWhile(block: Element): IRWhile {
  // Blockly controls_whileUntil: MODE = WHILE | UNTIL
  const modeField = firstField(block);
  const mode = modeField ? modeField.textContent || 'WHILE' : 'WHILE';

  const condValue = findValue(block, 'BOOL') || firstValue(block);
  let condExpr = condValue ? parseExprFromValue(condValue) : booleanLiteral(false);

  // Si es UNTIL, invertir condición: repeat until (cond) -> while (!cond)
  if (mode === 'UNTIL') {
    condExpr = {
      kind: 'unary_op',
      op: '!',
      expr: condExpr,
    } as IRUnaryOp;
  }

  const bodyStatement = findStatement(block, 'DO');
  const body = bodyStatement ? parseStatementBody(bodyStatement) : [];

  return {
    kind: 'while',
    condition: condExpr,
    body,
  };
}

function parseSay(block: Element): IRPrint {
  const msgValue = findValue(block, 'TEXT') || firstValue(block);
  // Default to empty string if node missing
  const msgExpr = msgValue ? parseExprFromValue(msgValue) : stringLiteral('');

  return {
    kind: 'print',
    value: msgExpr,
  };
}

// ---------- Parsers de EXPRESIONES ----------

function parseExprFromValue(valueNode: Element): IRExpr {
  const innerBlock = getBlockOrShadowFromValue(valueNode);
  if (!innerBlock) {
    return numberLiteral(0);
  }

  return parseExprFromBlock(innerBlock);
}

function parseExprFromBlock(block: Element): IRExpr {
  const type = block.getAttribute('type');

  if (type === 'math_number') {
    const field = firstField(block);
    const num = field ? Number(field.textContent) : 0;
    return {
      kind: 'number',
      value: isNaN(num) ? 0 : num,
    } as IRNumber;
  }

  if (type === 'text') {
    const field = firstField(block);
    return {
      kind: 'string',
      value: field ? field.textContent || '' : '',
    } as IRString;
  }

  if (type === 'math_random_int') {
    const fromValue = findValue(block, 'FROM');
    const toValue = findValue(block, 'TO');

    const min = fromValue ? parseExprFromValue(fromValue) : numberLiteral(1);
    const max = toValue ? parseExprFromValue(toValue) : numberLiteral(10);

    return {
      kind: 'random',
      min,
      max,
    } as IRRandom;
  }

  if (type === 'math_arithmetic') {
    const opField = firstField(block);
    let op = opField ? opField.textContent || '+' : '+';
    if (op === 'ADD') {
      op = '+';
    } else if (op === 'MINUS') {
      op = '-';
    } else if (op === 'MULTIPLY') {
      op = '*';
    } else if (op === 'DIVIDE') {
      op = '/';
    } else if (op === 'POWER') {
      op = '^';
    }

    const aValue = findValue(block, 'A') || firstValue(block);
    const bValue = findValue(block, 'B');

    const left = aValue ? parseExprFromValue(aValue) : numberLiteral(0);
    const right = bValue ? parseExprFromValue(bValue) : numberLiteral(0);

    return {
      kind: 'binary_op',
      op,
      left,
      right,
    } as IRBinaryOp;
  }

  if (type === 'logic_operation') {
    const aValue = findValue(block, 'A') || firstValue(block);
    const bValue = findValue(block, 'B');

    const left = aValue ? parseExprFromValue(aValue) : booleanLiteral(false);
    const right = bValue ? parseExprFromValue(bValue) : booleanLiteral(false);

    const opField = firstField(block);
    const opToken = opField ? opField.textContent || 'AND' : 'AND';
    const op = opToken === 'OR' ? '||' : '&&';

    return {
      kind: 'binary_op',
      op,
      left,
      right,
    } as IRBinaryOp;
  }

  if (type === 'logic_negate') {
    const boolValue = findValue(block, 'BOOL') || firstValue(block);
    const expr = boolValue ? parseExprFromValue(boolValue) : booleanLiteral(false);

    return {
      kind: 'unary_op',
      op: '!',
      expr,
    } as IRUnaryOp;
  }

  if (type === 'logic_boolean') {
    const field = firstField(block);
    const val = field ? field.textContent === 'TRUE' : false;
    return booleanLiteral(val);
  }

  // Comparaciones lógicas (==, <, >, etc.)
  if (type === 'logic_compare') {
    const opField = firstField(block);
    const opToken = opField ? opField.textContent || 'EQ' : 'EQ';

    const aValue = findValue(block, 'A') || firstValue(block);
    const bValue = findValue(block, 'B');

    const left = aValue ? parseExprFromValue(aValue) : numberLiteral(0);
    const right = bValue ? parseExprFromValue(bValue) : numberLiteral(0);

    const op = mapLogicOpToJava(opToken);

    return {
      kind: 'binary_op',
      op,
      left,
      right,
    } as IRBinaryOp;
  }

  // Referencia a variable: "x"
  if (type === 'variables_get') {
    const field = firstField(block);
    const name = field ? field.textContent || 'var' : 'var';
    return {
      kind: 'var_ref',
      name,
    } as IRVarRef;
  }

  // Input/Entrada de datos
  if (type === 'input_read_int') {
    return {
      kind: 'input_read',
      type: 'int',
    } as IRInputRead;
  }

  if (type === 'input_read_string') {
    return {
      kind: 'input_read',
      type: 'string',
    } as IRInputRead;
  }

  if (type === 'input_read_double') {
    return {
      kind: 'input_read',
      type: 'double',
    } as IRInputRead;
  }

  // Operaciones de texto
  if (type === 'text_concat') {
    const aValue = findValue(block, 'A') || firstValue(block);
    const bValue = findValue(block, 'B');

    const left = aValue ? parseExprFromValue(aValue) : stringLiteral('');
    const right = bValue ? parseExprFromValue(bValue) : stringLiteral('');

    return {
      kind: 'text_concat',
      left,
      right,
    } as IRTextConcat;
  }

  if (type === 'text_length') {
    const textValue = findValue(block, 'TEXT') || firstValue(block);
    const expr = textValue ? parseExprFromValue(textValue) : stringLiteral('');

    return {
      kind: 'text_length',
      expr,
    } as IRTextLength;
  }

  if (type === 'text_substring') {
    const textValue = findValue(block, 'TEXT') || firstValue(block);
    const startValue = findValue(block, 'START');
    const endValue = findValue(block, 'END');

    const text = textValue ? parseExprFromValue(textValue) : stringLiteral('');
    const start = startValue ? parseExprFromValue(startValue) : numberLiteral(0);
    const end = endValue ? parseExprFromValue(endValue) : numberLiteral(0);

    return { kind: 'text_substring', text, start, end } as IRTextSubstring;
  }

  if (type === 'text_equals') {
    const aValue = findValue(block, 'A') || firstValue(block);
    const bValue = findValue(block, 'B');

    const left = aValue ? parseExprFromValue(aValue) : stringLiteral('');
    const right = bValue ? parseExprFromValue(bValue) : stringLiteral('');

    return {
      kind: 'binary_op',
      op: '.equals',
      left,
      right,
    } as IRBinaryOp;
  }

  if (type === 'text_to_int') {
    const textValue = findValue(block, 'TEXT') || firstValue(block);
    const text = textValue ? parseExprFromValue(textValue) : stringLiteral('0');

    return {
      kind: 'unary_op',
      op: 'Integer.parseInt',
      expr: text,
    } as IRUnaryOp;
  }

  if (type === 'int_to_text') {
    const numValue = findValue(block, 'NUM') || firstValue(block);
    const num = numValue ? parseExprFromValue(numValue) : numberLiteral(0);

    return {
      kind: 'unary_op',
      op: 'String.valueOf',
      expr: num,
    } as IRUnaryOp;
  }

  // Módulo
  if (type === 'math_modulo') {
    const aValue = findValue(block, 'A') || firstValue(block);
    const bValue = findValue(block, 'B');
    const left = aValue ? parseExprFromValue(aValue) : numberLiteral(0);
    const right = bValue ? parseExprFromValue(bValue) : numberLiteral(1);
    return { kind: 'binary_op', op: '%', left, right } as IRBinaryOp;
  }

  // Round
  if (type === 'math_round') {
    const numValue = findValue(block, 'NUM') || firstValue(block);
    const expr = numValue ? parseExprFromValue(numValue) : numberLiteral(0);
    return { kind: 'unary_op', op: 'Math.round', expr } as IRUnaryOp;
  }

  // Ternario
  if (type === 'ternary_operator') {
    const condVal = findValue(block, 'CONDITION') || firstValue(block);
    const ifTrueVal = findValue(block, 'IF_TRUE');
    const ifFalseVal = findValue(block, 'IF_FALSE');
    const condition = condVal ? parseExprFromValue(condVal) : booleanLiteral(true);
    const ifTrue = ifTrueVal ? parseExprFromValue(ifTrueVal) : numberLiteral(0);
    const ifFalse = ifFalseVal ? parseExprFromValue(ifFalseVal) : numberLiteral(0);
    return { kind: 'ternary', condition, ifTrue, ifFalse } as IRTernary;
  }

  // charAt
  if (type === 'text_char_at') {
    const textVal = findValue(block, 'TEXT');
    const indexVal = findValue(block, 'INDEX') || firstValue(block);
    const text = textVal ? parseExprFromValue(textVal) : stringLiteral('');
    const index = indexVal ? parseExprFromValue(indexVal) : numberLiteral(0);
    return { kind: 'char_at', text, index } as IRCharAt;
  }

  // text contains
  if (type === 'text_contains') {
    const textVal = findValue(block, 'TEXT') || firstValue(block);
    const searchVal = findValue(block, 'SEARCH');
    const text = textVal ? parseExprFromValue(textVal) : stringLiteral('');
    const search = searchVal ? parseExprFromValue(searchVal) : stringLiteral('');
    return { kind: 'text_contains', text, search } as IRTextContains;
  }

  // List get
  if (type === 'list_get') {
    const listField = findFieldByName(block, 'LIST');
    const listName = listField ? listField.textContent || 'lista' : 'lista';
    const indexVal = findValue(block, 'INDEX') || firstValue(block);
    const index = indexVal ? parseExprFromValue(indexVal) : numberLiteral(0);
    return { kind: 'list_get', listName, index } as IRListGet;
  }

  // List size
  if (type === 'list_size') {
    const listField = findFieldByName(block, 'LIST');
    const listName = listField ? listField.textContent || 'lista' : 'lista';
    return { kind: 'list_size', listName } as IRListSize;
  }

  // List contains
  if (type === 'list_contains') {
    const listField = findFieldByName(block, 'LIST');
    const listName = listField ? listField.textContent || 'lista' : 'lista';
    const valNode = findValue(block, 'VALUE') || firstValue(block);
    const value = valNode ? parseExprFromValue(valNode) : numberLiteral(0);
    return { kind: 'list_contains', listName, value } as IRListContains;
  }

  // Object instantiation
  if (type === 'object_instantiation') {
    const classField = findFieldByName(block, 'CLASS');
    const className = classField ? classField.textContent || 'MiClase' : 'MiClase';
    const argsVal = findValue(block, 'ARGS');
    const args: IRExpr[] = argsVal ? [parseExprFromValue(argsVal)] : [];
    return { kind: 'new_object', className, args } as IRNewObject;
  }

  // this
  if (type === 'this_reference') {
    return { kind: 'this_ref' } as IRThisRef;
  }

  // Timer
  if (type === 'system_timer') {
    return { kind: 'timer' } as IRTimerExpr;
  }

  // Lambda
  if (type === 'lambda_function') {
    const paramsField = findFieldByName(block, 'PARAMS');
    const paramsStr = paramsField ? paramsField.textContent || 'x' : 'x';
    const params = paramsStr.split(',').map(p => p.trim());
    const bodyVal = findValue(block, 'BODY') || firstValue(block);
    const body = bodyVal ? parseExprFromValue(bodyVal) : numberLiteral(0);
    return { kind: 'lambda', params, body } as IRLambda;
  }

  // Stream filter
  if (type === 'stream_filter') {
    const collField = findFieldByName(block, 'COLLECTION');
    const collection = collField ? collField.textContent || 'lista' : 'lista';
    const varField = findFieldByName(block, 'VAR');
    const variable = varField ? varField.textContent || 'x' : 'x';
    const condVal = findValue(block, 'CONDITION') || firstValue(block);
    const condition = condVal ? parseExprFromValue(condVal) : booleanLiteral(true);
    return { kind: 'stream_filter', collection, variable, condition } as IRStreamFilter;
  }

  // Array length (expression)
  if (type === 'array_length') {
    const nameField = findFieldByName(block, 'VAR');
    const name = nameField ? nameField.textContent || 'arr' : 'arr';
    return { kind: 'array_length', name } as IRArrayLength;
  }

  // Array access (expression)
  if (type === 'array_access') {
    const nameField = findFieldByName(block, 'VAR');
    const name = nameField ? nameField.textContent || 'arr' : 'arr';
    const indexVal = findValue(block, 'INDEX') || firstValue(block);
    const index = indexVal ? parseExprFromValue(indexVal) : numberLiteral(0);
    return { kind: 'array_access', name, index } as IRArrayAccess;
  }

  // Function call as expression
  if (type === 'function_call') {
    const nameField = findFieldByName(block, 'NAME');
    const name = nameField ? nameField.textContent || 'func' : 'func';
    const argsVal = findValue(block, 'ARGS');
    const args: IRExpr[] = argsVal ? [parseExprFromValue(argsVal)] : [];
    return { kind: 'function_call_expr', name, args } as IRFunctionCallExpr;
  }

  // Fallback
  return numberLiteral(0);
}

// ---------- Helpers XML ----------

function getBlockOrShadowFromValue(valueNode: Element): Element | null {
  let shadow: Element | null = null;
  for (let i = 0; i < valueNode.childNodes.length; i++) {
    const child = valueNode.childNodes.item(i) as Element;
    if (child && child.nodeType === 1) {
      if (child.tagName === 'block') {
        return child; // <block> takes precedence
      }
      if (child.tagName === 'shadow') {
        shadow = child;
      }
    }
  }
  return shadow;
}

function findValue(block: Element, name: string): Element | null {
  for (let i = 0; i < block.childNodes.length; i++) {
    const child = block.childNodes.item(i) as Element;
    if (child && child.nodeType === 1 && child.tagName === 'value' && child.getAttribute('name') === name) {
      return child;
    }
  }
  return null;
}

// ---------- Parsers para nuevos bloques ----------

function parseComment(block: Element): IRComment {
  const field = findFieldByName(block, 'COMMENT');
  const text = field ? field.textContent || '' : '';
  return { kind: 'comment', text };
}

function parseVarDeclaration(block: Element): IRVarDeclaration {
  const typeValue = findValue(block, 'TYPE');
  const type = typeValue ? parseExprFromValue(typeValue) : stringLiteral('int');
  const nameField = findFieldByName(block, 'VAR');
  const name = nameField ? nameField.textContent || 'var' : 'var';
  return { kind: 'var_declaration', type: (type as IRString).value, name };
}

function parseVarDeclarationInit(block: Element): IRVarDeclarationInit {
  const typeValue = findValue(block, 'TYPE');
  const type = typeValue ? parseExprFromValue(typeValue) : stringLiteral('int');
  const nameField = findFieldByName(block, 'VAR');
  const name = nameField ? nameField.textContent || 'var' : 'var';
  const valueValue = findValue(block, 'VALUE');
  const value = valueValue ? parseExprFromValue(valueValue) : numberLiteral(0);
  return { kind: 'var_declaration_init', type: (type as IRString).value, name, value };
}

function parseVarIncrement(block: Element): IRVarIncrement {
  const nameField = findFieldByName(block, 'VAR');
  const name = nameField ? nameField.textContent || 'var' : 'var';
  return { kind: 'var_increment', name };
}

function parseVarDecrement(block: Element): IRVarDecrement {
  const nameField = findFieldByName(block, 'VAR');
  const name = nameField ? nameField.textContent || 'var' : 'var';
  return { kind: 'var_decrement', name };
}

function parseArrayDeclaration(block: Element): IRArrayDeclaration {
  const typeValue = findValue(block, 'TYPE');
  const type = typeValue ? parseExprFromValue(typeValue) : stringLiteral('int');
  const nameField = findFieldByName(block, 'VAR');
  const name = nameField ? nameField.textContent || 'arr' : 'arr';
  const sizeValue = findValue(block, 'SIZE');
  const size = sizeValue ? parseExprFromValue(sizeValue) : numberLiteral(10);
  return { kind: 'array_declaration', type: (type as IRString).value, name, size };
}

function parseArrayAssignment(block: Element): IRArrayAssignment {
  const nameField = findFieldByName(block, 'VAR');
  const name = nameField ? nameField.textContent || 'arr' : 'arr';
  const indexValue = findValue(block, 'INDEX');
  const index = indexValue ? parseExprFromValue(indexValue) : numberLiteral(0);
  const valueValue = findValue(block, 'VALUE');
  const value = valueValue ? parseExprFromValue(valueValue) : numberLiteral(0);
  return { kind: 'array_assignment', name, index, value };
}

function parseFunctionDefinition(block: Element): IRFunctionDefinition {
  const returnTypeValue = findValue(block, 'RETURN_TYPE');
  const returnType = returnTypeValue ? parseExprFromValue(returnTypeValue) : stringLiteral('void');
  const nameField = findFieldByName(block, 'NAME');
  const name = nameField ? nameField.textContent || 'func' : 'func';
  const paramsStmt = findStatement(block, 'PARAMS');
  const params: any[] = paramsStmt ? parseParameters(paramsStmt) : [];
  const bodyStmt = findStatement(block, 'BODY');
  const body = bodyStmt ? parseStatementBody(bodyStmt) : [];
  return { kind: 'function_definition', returnType: (returnType as IRString).value, name, params, body };
}

function parseParameters(stmt: Element): any[] {
  // Simplificado, asumir lista de parameters
  const params: any[] = [];
  let current: Element | null = null;                        
  for (let i = 0; i < stmt.childNodes.length; i++) {        
    const child = stmt.childNodes.item(i) as Element;        
    if (child && child.nodeType === 1 && child.tagName === 'block') { current = child; break; } 
  }                                                        
  while (current) {
    if (current.tagName === 'block' && current.getAttribute('type') === 'function_parameter') {
      const typeValue = findValue(current, 'TYPE');
      const type = typeValue ? parseExprFromValue(typeValue) : stringLiteral('int');
      const nameField = findFieldByName(current, 'NAME');
      const name = nameField ? nameField.textContent || 'param' : 'param';
      params.push({ type: (type as IRString).value, name });
    }
    current = getNextBlock(current);
  }
  return params;
}

function parseFunctionCall(block: Element): IRFunctionCall {
  const nameField = findFieldByName(block, 'NAME');
  const name = nameField ? nameField.textContent || 'func' : 'func';
  const argsValue = findValue(block, 'ARGS');
  const args: IRExpr[] = argsValue ? [parseExprFromValue(argsValue)] : []; 
  return { kind: 'function_call', name, args };
}

function parseReturn(block: Element): IRReturn {
  const valueValue = findValue(block, 'VALUE');
  const value = valueValue ? parseExprFromValue(valueValue) : undefined;
  return { kind: 'return', value };
}

function parseFor(block: Element): IRFor {
  const fromValue = findValue(block, 'FROM');
  const toValue = findValue(block, 'TO');
  const byValue = findValue(block, 'BY');
  const varField = findFieldByName(block, 'VAR');
  const varName = varField ? varField.textContent || 'i' : 'i';
  const bodyStmt = findStatement(block, 'DO');
  const body = bodyStmt ? parseStatementBody(bodyStmt) : [];

  const init: IRVarDeclarationInit = {
    kind: 'var_declaration_init',
    type: 'int',
    name: varName,
    value: fromValue ? parseExprFromValue(fromValue) : numberLiteral(0)
  };

  const condition: IRBinaryOp = {
    kind: 'binary_op',
    op: '<=',
    left: { kind: 'var_ref', name: varName },
    right: toValue ? parseExprFromValue(toValue) : numberLiteral(10)
  };

  // Si hay un paso (BY) distinto del default, usar += ; si no, usar i++
  const byExpr = byValue ? parseExprFromValue(byValue) : null;
  const increment: IRVarIncrement | IRVarChange =
    byExpr && !(byExpr.kind === 'number' && byExpr.value === 1)
      ? { kind: 'var_change', name: varName, value: byExpr } as IRVarChange
      : { kind: 'var_increment', name: varName } as IRVarIncrement;

  return { kind: 'for', init, condition, increment, body };
}

function parseSwitch(block: Element): IRSwitch {
  const exprValue = findValue(block, 'EXPR');
  const expr = exprValue ? parseExprFromValue(exprValue) : numberLiteral(0);
  const casesStmt = findStatement(block, 'CASES');
  const cases = casesStmt ? parseCases(casesStmt) : [];
  return { kind: 'switch', expr, cases };
}

function parseCases(stmt: Element): { value?: IRExpr; body: IRNode[] }[] {
  const cases: { value?: IRExpr; body: IRNode[] }[] = [];
  let current: Element | null = null;
  for (let i = 0; i < stmt.childNodes.length; i++) {
    const child = stmt.childNodes.item(i) as Element;
    if (child && child.nodeType === 1 && (child.tagName === 'block' || child.tagName === 'shadow')) {
      current = child;
      break;
    }
  }
  while (current) {
    const type = current.getAttribute('type');
    if (type === 'controls_case') {
      const caseVal = findValue(current, 'CASE');
      const value = caseVal ? parseExprFromValue(caseVal) : undefined;
      const bodyStmt = findStatement(current, 'STATEMENT');
      const body = bodyStmt ? parseStatementBody(bodyStmt) : [];
      cases.push({ value, body });
    } else if (type === 'controls_default') {
      const bodyStmt = findStatement(current, 'STATEMENT');
      const body = bodyStmt ? parseStatementBody(bodyStmt) : [];
      cases.push({ value: undefined, body });
    }
    current = getNextBlock(current);
  }
  return cases;
}

function parseBreak(_block: Element): IRBreak {
  return { kind: 'break' };
}

function parseContinue(_block: Element): IRContinue {
  return { kind: 'continue' };
}

// ---------- Parsers de nuevos bloques ----------

function parseForever(block: Element): IRForever {
  const bodyStmt = findStatement(block, 'DO');
  const body = bodyStmt ? parseStatementBody(bodyStmt) : [];
  return { kind: 'forever', body };
}

function parseBroadcast(block: Element): IRBroadcast {
  const field = findFieldByName(block, 'MESSAGE');
  const message = field ? field.textContent || 'mensaje' : 'mensaje';
  return { kind: 'broadcast', message };
}

function parseBroadcastWait(block: Element): IRBroadcastWait {
  const field = findFieldByName(block, 'MESSAGE');
  const message = field ? field.textContent || 'mensaje' : 'mensaje';
  return { kind: 'broadcast_wait', message };
}

function parseWhenReceive(block: Element): IRWhenReceive {
  const field = findFieldByName(block, 'MESSAGE');
  const message = field ? field.textContent || 'mensaje' : 'mensaje';
  const bodyStmt = findStatement(block, 'BODY');
  const body = bodyStmt ? parseStatementBody(bodyStmt) : [];
  return { kind: 'when_receive', message, body };
}

function parseWaitSeconds(block: Element): IRWaitSeconds {
  const secsVal = findValue(block, 'SECONDS') || firstValue(block);
  const seconds = secsVal ? parseExprFromValue(secsVal) : numberLiteral(1);
  return { kind: 'wait_seconds', seconds };
}

function parseWaitUntil(block: Element): IRWaitUntil {
  const condVal = findValue(block, 'CONDITION') || firstValue(block);
  const condition = condVal ? parseExprFromValue(condVal) : booleanLiteral(true);
  return { kind: 'wait_until', condition };
}

function parseStop(_block: Element): IRStop {
  return { kind: 'stop' };
}

function parseTryCatchFinally(block: Element): IRTryCatchFinally {
  const tryStmt = findStatement(block, 'TRY');
  const tryBody = tryStmt ? parseStatementBody(tryStmt) : [];
  const catchTypeField = findFieldByName(block, 'CATCH_TYPE');
  const catchType = catchTypeField ? catchTypeField.textContent || 'Exception' : 'Exception';
  const catchVarField = findFieldByName(block, 'CATCH_VAR');
  const catchVar = catchVarField ? catchVarField.textContent || 'e' : 'e';
  const catchStmt = findStatement(block, 'CATCH');
  const catchBody = catchStmt ? parseStatementBody(catchStmt) : [];
  const finallyStmt = findStatement(block, 'FINALLY');
  const finallyBody = finallyStmt ? parseStatementBody(finallyStmt) : [];
  return { kind: 'try_catch_finally', tryBody, catchType, catchVar, catchBody, finallyBody };
}

function parseThrow(block: Element): IRThrow {
  const val = findValue(block, 'EXCEPTION') || firstValue(block);
  const expr = val ? parseExprFromValue(val) : stringLiteral('Exception');
  return { kind: 'throw', expr };
}

function parseListDeclaration(block: Element): IRListDeclaration {
  const typeField = findFieldByName(block, 'ELEMENT_TYPE');
  const elementType = typeField ? typeField.textContent || 'Integer' : 'Integer';
  const nameField = findFieldByName(block, 'NAME');
  const name = nameField ? nameField.textContent || 'lista' : 'lista';
  return { kind: 'list_declaration', elementType, name };
}

function parseListAdd(block: Element): IRListAdd {
  const listField = findFieldByName(block, 'LIST');
  const listName = listField ? listField.textContent || 'lista' : 'lista';
  const val = findValue(block, 'VALUE') || firstValue(block);
  const value = val ? parseExprFromValue(val) : numberLiteral(0);
  return { kind: 'list_add', listName, value };
}

function parseListRemove(block: Element): IRListRemove {
  const listField = findFieldByName(block, 'LIST');
  const listName = listField ? listField.textContent || 'lista' : 'lista';
  const idxVal = findValue(block, 'INDEX') || firstValue(block);
  const index = idxVal ? parseExprFromValue(idxVal) : numberLiteral(0);
  return { kind: 'list_remove', listName, index };
}

function parseListClear(block: Element): IRListClear {
  const listField = findFieldByName(block, 'LIST');
  const listName = listField ? listField.textContent || 'lista' : 'lista';
  return { kind: 'list_clear', listName };
}

function parseListInsert(block: Element): IRListInsert {
  const listField = findFieldByName(block, 'LIST');
  const listName = listField ? listField.textContent || 'lista' : 'lista';
  const idxVal = findValue(block, 'INDEX');
  const index = idxVal ? parseExprFromValue(idxVal) : numberLiteral(0);
  const val = findValue(block, 'VALUE') || firstValue(block);
  const value = val ? parseExprFromValue(val) : numberLiteral(0);
  return { kind: 'list_insert', listName, index, value };
}

function parseListSet(block: Element): IRListSet {
  const listField = findFieldByName(block, 'LIST');
  const listName = listField ? listField.textContent || 'lista' : 'lista';
  const idxVal = findValue(block, 'INDEX');
  const index = idxVal ? parseExprFromValue(idxVal) : numberLiteral(0);
  const val = findValue(block, 'VALUE');
  const value = val ? parseExprFromValue(val) : numberLiteral(0);
  return { kind: 'list_set', listName, index, value };
}

function parseMapDeclaration(block: Element): IRMapDeclaration {
  const keyField = findFieldByName(block, 'KEY_TYPE');
  const keyType = keyField ? keyField.textContent || 'String' : 'String';
  const valField = findFieldByName(block, 'VALUE_TYPE');
  const valueType = valField ? valField.textContent || 'String' : 'String';
  const nameField = findFieldByName(block, 'NAME');
  const name = nameField ? nameField.textContent || 'mapa' : 'mapa';
  return { kind: 'map_declaration', keyType, valueType, name };
}

function parseEnumDefinition(block: Element): IREnumDefinition {
  const nameField = findFieldByName(block, 'NAME');
  const name = nameField ? nameField.textContent || 'MiEnum' : 'MiEnum';
  const valuesField = findFieldByName(block, 'VALUES');
  const valuesStr = valuesField ? valuesField.textContent || 'A, B, C' : 'A, B, C';
  const values = valuesStr.split(',').map(v => v.trim()).filter(v => v.length > 0);
  return { kind: 'enum_definition', name, values };
}

function parseClassDefinition(block: Element): IRClassDefinition {
  const nameField = findFieldByName(block, 'NAME');
  const name = nameField ? nameField.textContent || 'MiClase' : 'MiClase';
  const attrStmt = findStatement(block, 'ATTRIBUTES');
  const attributes = attrStmt ? parseAttributes(attrStmt) : [];
  const methodsStmt = findStatement(block, 'METHODS');
  const methods = methodsStmt ? parseMethods(methodsStmt) : [];
  return { kind: 'class_definition', name, attributes, methods };
}

function parseClassExtends(block: Element): IRClassDefinition {
  const nameField = findFieldByName(block, 'NAME');
  const name = nameField ? nameField.textContent || 'Hijo' : 'Hijo';
  const parentField = findFieldByName(block, 'PARENT');
  const extendsClass = parentField ? parentField.textContent || 'Padre' : 'Padre';
  const attrStmt = findStatement(block, 'ATTRIBUTES');
  const attributes = attrStmt ? parseAttributes(attrStmt) : [];
  const methodsStmt = findStatement(block, 'METHODS');
  const methods = methodsStmt ? parseMethods(methodsStmt) : [];
  return { kind: 'class_definition', name, attributes, methods, extendsClass };
}

function parseClassImplements(block: Element): IRClassDefinition {
  const nameField = findFieldByName(block, 'NAME');
  const name = nameField ? nameField.textContent || 'MiClase' : 'MiClase';
  const ifaceField = findFieldByName(block, 'INTERFACE');
  const iface = ifaceField ? ifaceField.textContent || 'MiInterfaz' : 'MiInterfaz';
  const attrStmt = findStatement(block, 'ATTRIBUTES');
  const attributes = attrStmt ? parseAttributes(attrStmt) : [];
  const methodsStmt = findStatement(block, 'METHODS');
  const methods = methodsStmt ? parseMethods(methodsStmt) : [];
  return { kind: 'class_definition', name, attributes, methods, implementsInterfaces: [iface] };
}

function parseInterfaceDefinition(block: Element): IRInterfaceDefinition {
  const nameField = findFieldByName(block, 'NAME');
  const name = nameField ? nameField.textContent || 'MiInterfaz' : 'MiInterfaz';
  const methodsStmt = findStatement(block, 'METHODS');
  const methods = methodsStmt ? parseInterfaceMethods(methodsStmt) : [];
  return { kind: 'interface_definition', name, methods };
}

function parseInterfaceMethods(stmt: Element): { returnType: string; name: string; params: { type: string; name: string }[] }[] {
  const methods: { returnType: string; name: string; params: { type: string; name: string }[] }[] = [];
  let current: Element | null = null;
  for (let i = 0; i < stmt.childNodes.length; i++) {
    const child = stmt.childNodes.item(i) as Element;
    if (child && child.nodeType === 1 && child.tagName === 'block') { current = child; break; }
  }
  while (current) {
    const type = current.getAttribute('type');
    if (type === 'method_definition') {
      const retField = findFieldByName(current, 'RETURN_TYPE');
      const returnType = retField ? retField.textContent || 'void' : 'void';
      const nameField = findFieldByName(current, 'NAME');
      const name = nameField ? nameField.textContent || 'metodo' : 'metodo';
      const paramsStmt = findStatement(current, 'PARAMS');
      const params = paramsStmt ? parseParameters(paramsStmt) : [];
      methods.push({ returnType, name, params });
    }
    current = getNextBlock(current);
  }
  return methods;
}

function parseAttributes(stmt: Element): IRVarDeclaration[] {
  const attrs: IRVarDeclaration[] = [];
  let current: Element | null = null;
  for (let i = 0; i < stmt.childNodes.length; i++) {
    const child = stmt.childNodes.item(i) as Element;
    if (child && child.nodeType === 1 && child.tagName === 'block') { current = child; break; }
  }
  while (current) {
    if (current.getAttribute('type') === 'attribute_declaration') {
      const modField = findFieldByName(current, 'MODIFIER');
      const modifier = modField ? modField.textContent || 'private' : 'private';
      const typeField = findFieldByName(current, 'TYPE');
      const type = typeField ? typeField.textContent || 'int' : 'int';
      const nameField = findFieldByName(current, 'NAME');
      const name = nameField ? nameField.textContent || 'attr' : 'attr';
      attrs.push({ kind: 'var_declaration', type, name, accessModifier: modifier });
    }
    current = getNextBlock(current);
  }
  return attrs;
}

function parseMethods(stmt: Element): IRFunctionDefinition[] {
  const methods: IRFunctionDefinition[] = [];
  let current: Element | null = null;
  for (let i = 0; i < stmt.childNodes.length; i++) {
    const child = stmt.childNodes.item(i) as Element;
    if (child && child.nodeType === 1 && child.tagName === 'block') { current = child; break; }
  }
  while (current) {
    const type = current.getAttribute('type');
    if (type === 'method_definition') {
      methods.push(parseMethodDefinition(current));
    } else if (type === 'constructor_definition') {
      methods.push(parseConstructorDefinition(current));
    } else if (type === 'method_override') {
      methods.push(parseMethodOverride(current));
    }
    current = getNextBlock(current);
  }
  return methods;
}

function parseMethodDefinition(block: Element): IRFunctionDefinition {
  const modField = findFieldByName(block, 'MODIFIER');
  const modifier = modField ? modField.textContent || 'public' : 'public';
  const retField = findFieldByName(block, 'RETURN_TYPE');
  const returnType = retField ? retField.textContent || 'void' : 'void';
  const nameField = findFieldByName(block, 'NAME');
  const name = nameField ? nameField.textContent || 'metodo' : 'metodo';
  const paramsStmt = findStatement(block, 'PARAMS');
  const params = paramsStmt ? parseParameters(paramsStmt) : [];
  const bodyStmt = findStatement(block, 'BODY');
  const body = bodyStmt ? parseStatementBody(bodyStmt) : [];
  return { kind: 'function_definition', returnType, name, params, body, accessModifier: modifier, isStatic: false };
}

function parseConstructorDefinition(block: Element): IRFunctionDefinition {
  const paramsStmt = findStatement(block, 'PARAMS');
  const params = paramsStmt ? parseParameters(paramsStmt) : [];
  const bodyStmt = findStatement(block, 'BODY');
  const body = bodyStmt ? parseStatementBody(bodyStmt) : [];
  return { kind: 'function_definition', returnType: '', name: '__constructor__', params, body, accessModifier: 'public' };
}

function parseMethodOverride(block: Element): IRFunctionDefinition {
  const modField = findFieldByName(block, 'MODIFIER');
  const modifier = modField ? modField.textContent || 'public' : 'public';
  const retField = findFieldByName(block, 'RETURN_TYPE');
  const returnType = retField ? retField.textContent || 'void' : 'void';
  const nameField = findFieldByName(block, 'NAME');
  const name = nameField ? nameField.textContent || 'metodo' : 'metodo';
  const bodyStmt = findStatement(block, 'BODY');
  const body = bodyStmt ? parseStatementBody(bodyStmt) : [];
  return { kind: 'function_definition', returnType, name, params: [], body, accessModifier: modifier, isOverride: true };
}

function parseVoidFunctionDefinition(block: Element): IRFunctionDefinition {
  const nameField = findFieldByName(block, 'NAME');
  const name = nameField ? nameField.textContent || 'func' : 'func';
  const paramsStmt = findStatement(block, 'PARAMS');
  const params = paramsStmt ? parseParameters(paramsStmt) : [];
  const bodyStmt = findStatement(block, 'BODY');
  const body = bodyStmt ? parseStatementBody(bodyStmt) : [];
  return { kind: 'function_definition', returnType: 'void', name, params, body };
}

function parseGenericFunction(block: Element): IRFunctionDefinition {
  const typeParamField = findFieldByName(block, 'TYPE_PARAM');
  const typeParam = typeParamField ? typeParamField.textContent || 'T' : 'T';
  const retField = findFieldByName(block, 'RETURN_TYPE');
  const returnType = retField ? retField.textContent || 'T' : 'T';
  const nameField = findFieldByName(block, 'NAME');
  const name = nameField ? nameField.textContent || 'func' : 'func';
  const paramTypeField = findFieldByName(block, 'PARAM_TYPE');
  const paramType = paramTypeField ? paramTypeField.textContent || 'T' : 'T';
  const paramNameField = findFieldByName(block, 'PARAM_NAME');
  const paramName = paramNameField ? paramNameField.textContent || 'valor' : 'valor';
  const bodyStmt = findStatement(block, 'BODY');
  const body = bodyStmt ? parseStatementBody(bodyStmt) : [];
  return {
    kind: 'function_definition',
    returnType: `<${typeParam}> ${returnType}`,
    name,
    params: [{ type: paramType, name: paramName }],
    body
  };
}

function parseThreadCreate(block: Element): IRThreadCreate {
  const nameField = findFieldByName(block, 'NAME');
  const name = nameField ? nameField.textContent || 'hilo' : 'hilo';
  const bodyStmt = findStatement(block, 'BODY');
  const body = bodyStmt ? parseStatementBody(bodyStmt) : [];
  return { kind: 'thread_create', name, body };
}

function parseSynchronized(block: Element): IRSynchronized {
  const lockField = findFieldByName(block, 'LOCK');
  const lockName = lockField ? lockField.textContent || 'lock' : 'lock';
  const lock: IRVarRef = { kind: 'var_ref', name: lockName };
  const bodyStmt = findStatement(block, 'BODY');
  const body = bodyStmt ? parseStatementBody(bodyStmt) : [];
  return { kind: 'synchronized', lock, body };
}

function parseParallelExec(_block: Element): IRCodeTemplate {
  return {
    kind: 'code_template',
    code: `Thread t1 = new Thread(() -> {\n    // Tarea 1\n});\nThread t2 = new Thread(() -> {\n    // Tarea 2\n});\nt1.start();\nt2.start();`
  } as IRCodeTemplate;
}

function parseArrayInitialization(block: Element): IRCodeTemplate {
  const typeValue = findValue(block, 'TYPE');
  const type = typeValue ? parseExprFromValue(typeValue) : stringLiteral('int');
  const nameField = findFieldByName(block, 'VAR');
  const name = nameField ? nameField.textContent || 'arr' : 'arr';
  const valuesField = findFieldByName(block, 'VALUES');
  const values = valuesField ? valuesField.textContent || '1, 2, 3' : '1, 2, 3';
  const typeName = (type as IRString).value;
  return { kind: 'code_template', code: `${typeName}[] ${name} = {${values}};` };
}

function parseFileRead(block: Element): IRCodeTemplate {
  const pathField = findFieldByName(block, 'PATH');
  const path = pathField ? pathField.textContent || 'archivo.txt' : 'archivo.txt';
  return {
    kind: 'code_template',
    code: `String contenido = new String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get("${path}")));`
  };
}

function parseFileWrite(block: Element): IRCodeTemplate {
  const pathField = findFieldByName(block, 'PATH');
  const path = pathField ? pathField.textContent || 'archivo.txt' : 'archivo.txt';
  return {
    kind: 'code_template',
    code: `java.nio.file.Files.writeString(java.nio.file.Paths.get("${path}"), contenido);`
  };
}

function parseUrlConnection(block: Element): IRCodeTemplate {
  const urlField = findFieldByName(block, 'URL');
  const url = urlField ? urlField.textContent || 'https://api.example.com' : 'https://api.example.com';
  return {
    kind: 'code_template',
    code: `java.net.HttpURLConnection conn = (java.net.HttpURLConnection) new java.net.URL("${url}").openConnection();\nconn.setRequestMethod("GET");`
  };
}

function parseEncryptDecrypt(block: Element): IRCodeTemplate {
  const modeField = findFieldByName(block, 'MODE');
  const mode = modeField ? modeField.textContent || 'ENCRYPT' : 'ENCRYPT';
  const keyField = findFieldByName(block, 'KEY');
  const key = keyField ? keyField.textContent || 'clave' : 'clave';
  const op = mode === 'ENCRYPT' ? 'Cipher.ENCRYPT_MODE' : 'Cipher.DECRYPT_MODE';
  return {
    kind: 'code_template',
    code: `javax.crypto.Cipher cipher = javax.crypto.Cipher.getInstance("AES");\ncipher.init(${op}, new javax.crypto.spec.SecretKeySpec("${key}".getBytes(), "AES"));`
  };
}

function parseDbConnect(block: Element): IRCodeTemplate {
  const urlField = findFieldByName(block, 'URL');
  const url = urlField ? urlField.textContent || 'jdbc:mysql://localhost:3306/db' : 'jdbc:mysql://localhost:3306/db';
  const userField = findFieldByName(block, 'USER');
  const user = userField ? userField.textContent || 'root' : 'root';
  const passField = findFieldByName(block, 'PASS');
  const pass = passField ? passField.textContent || 'pass' : 'pass';
  return {
    kind: 'code_template',
    code: `java.sql.Connection conn = java.sql.DriverManager.getConnection("${url}", "${user}", "${pass}");`
  };
}

function parseImport(block: Element): IRImport {
  const libField = findFieldByName(block, 'LIBRARY');
  const library = libField ? libField.textContent || 'java.util.ArrayList' : 'java.util.ArrayList';
  return { kind: 'import', library };
}

function parseDesktopApp(block: Element): IRCodeTemplate {
  const titleField = findFieldByName(block, 'TITLE');
  const title = titleField ? titleField.textContent || 'Mi App' : 'Mi App';
  return {
    kind: 'code_template',
    code: `javax.swing.JFrame frame = new javax.swing.JFrame("${title}");\nframe.setSize(400, 300);\nframe.setDefaultCloseOperation(javax.swing.JFrame.EXIT_ON_CLOSE);\nframe.setVisible(true);`
  };
}

function parseMobileApp(block: Element): IRCodeTemplate {
  const nameField = findFieldByName(block, 'NAME');
  const name = nameField ? nameField.textContent || 'MiApp' : 'MiApp';
  return {
    kind: 'code_template',
    code: `// Android Activity: ${name}\n// public class ${name} extends AppCompatActivity {\n//     @Override protected void onCreate(Bundle savedInstanceState) {\n//         super.onCreate(savedInstanceState);\n//         setContentView(R.layout.activity_main);\n//     }\n// }`
  };
}

function parseWebService(block: Element): IRCodeTemplate {
  const pathField = findFieldByName(block, 'PATH');
  const path = pathField ? pathField.textContent || '/api/hola' : '/api/hola';
  return {
    kind: 'code_template',
    code: `// Spring Boot REST Controller\n// @RestController\n// public class ApiController {\n//     @GetMapping("${path}")\n//     public String endpoint() {\n//         return "Hola desde ${path}";\n//     }\n// }`
  };
}

function parseReflection(block: Element): IRCodeTemplate {
  const classField = findFieldByName(block, 'CLASS');
  const className = classField ? classField.textContent || 'MiClase' : 'MiClase';
  return {
    kind: 'code_template',
    code: `Class<?> clazz = Class.forName("${className}");\njava.lang.reflect.Method[] methods = clazz.getDeclaredMethods();`
  };
}

function parseInterop(block: Element): IRCodeTemplate {
  const cmdField = findFieldByName(block, 'COMMAND');
  const command = cmdField ? cmdField.textContent || 'python script.py' : 'python script.py';
  return {
    kind: 'code_template',
    code: `Process process = new ProcessBuilder(${command.split(' ').map(s => `"${s}"`).join(', ')}).start();`
  };
}

function parseVariableShow(block: Element): IRPrint {
  const varField = findFieldByName(block, 'VAR');
  const name = varField ? varField.textContent || 'variable' : 'variable';
  return { kind: 'print', value: { kind: 'var_ref', name } as IRVarRef };
}

function firstValue(block: Element): Element | null {
  for (let i = 0; i < block.childNodes.length; i++) {
    const child = block.childNodes.item(i) as Element;
    if (child && child.nodeType === 1 && child.tagName === 'value') {
      return child;
    }
  }
  return null;
}

function firstField(block: Element): Element | null {
  for (let i = 0; i < block.childNodes.length; i++) {
    const child = block.childNodes.item(i) as Element;
    if (child && child.nodeType === 1 && child.tagName === 'field') {
      return child;
    }
  }
  return null;
}

function findFieldByName(block: Element, name: string): Element | null {
  for (let i = 0; i < block.childNodes.length; i++) {
    const child = block.childNodes.item(i) as Element;
    if (child && child.nodeType === 1 && child.tagName === 'field' && child.getAttribute('name') === name) {
      return child;
    }
  }
  return null;
}

function findStatement(block: Element, name: string): Element | null {
  for (let i = 0; i < block.childNodes.length; i++) {
    const child = block.childNodes.item(i) as Element;
    if (child && child.nodeType === 1 && child.tagName === 'statement' && child.getAttribute('name') === name) {
      return child;
    }
  }
  return null;
}

function firstChildMutation(block: Element): Element | null {
  for (let i = 0; i < block.childNodes.length; i++) {
    const child = block.childNodes.item(i) as Element;
    if (child && child.nodeType === 1 && child.tagName === 'mutation') {
      return child;
    }
  }
  return null;
}

function parseStatementBody(statementNode: Element): IRNode[] {
  for (let i = 0; i < statementNode.childNodes.length; i++) {
    const child = statementNode.childNodes.item(i) as Element;
    if (child && child.nodeType === 1 && (child.tagName === 'block' || child.tagName === 'shadow')) {
      return parseBlockSequence(child);
    }
  }
  return [];
}

function numberLiteral(n: number): IRNumber {
  return { kind: 'number', value: n };
}

function booleanLiteral(b: boolean): IRBoolean {
  return { kind: 'boolean', value: b };
}

function stringLiteral(s: string): IRString {
  return { kind: 'string', value: s };
}

function mapLogicOpToJava(token: string): string {
  switch (token) {
    case 'LT': return '<';
    case 'GT': return '>';
    case 'LTE': return '<=';
    case 'GTE': return '>=';
    case 'NEQ': return '!=';
    case 'EQ':
    default:
      return '==';
  }
}
