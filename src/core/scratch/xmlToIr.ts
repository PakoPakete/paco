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
  IRMapPut,
  IRMapRemove,
  IRMapGet,
  IRMapContainsKey,
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
  IRFileWrite,
  IREncryptDecrypt,
  IRDesktopApp,
  IRMobileApp,
  IRWebService,
  IRCatch,
  IRSuperCall,
} from '../ir/nodes';

// Numbers each "ejecutar en paralelo" block so two of them do not declare t1/t2 twice.
let parallelCounter = 0;

export function xmlToIr(xml: string): IRNode[] {
  parallelCounter = 0;
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const root = doc.documentElement;

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
      else if (type === 'event_green_flag') {
      } else if (type === 'event_broadcast') {
        result.push(parseBroadcast(current));
      } else if (type === 'event_broadcast_wait') {
        result.push(parseBroadcastWait(current));
      } else if (type === 'event_when_receive') {
        result.push(parseWhenReceive(current));
      }
      else if (type === 'controls_wait_seconds') {
        result.push(parseWaitSeconds(current));
      } else if (type === 'controls_wait_until') {
        result.push(parseWaitUntil(current));
      } else if (type === 'controls_stop') {
        result.push(parseStop(current));
      }
      else if (type === 'try_catch_finally') {
        result.push(parseTryCatchFinally(current));
      } else if (type === 'throw_exception') {
        result.push(parseThrow(current));
      }
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
      else if (type === 'map_declaration') {
        result.push(parseMapDeclaration(current));
      } else if (type === 'map_put') {
        result.push(parseMapPut(current));
      } else if (type === 'map_remove') {
        result.push(parseMapRemove(current));
      }
      else if (type === 'enum_definition') {
        result.push(parseEnumDefinition(current));
      }
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
      else if (type === 'generic_function') {
        result.push(parseGenericFunction(current));
      }
      else if (type === 'thread_create') {
        result.push(parseThreadCreate(current));
      } else if (type === 'synchronized_block') {
        result.push(parseSynchronized(current));
      } else if (type === 'parallel_exec') {
        result.push(...parseParallelExec(current));
      }
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
      else if (type === 'system_reset_timer') {
        result.push({ kind: 'code_template', code: 'long timerStart = System.currentTimeMillis();' } as IRCodeTemplate);
      }
      else if (type === 'import_library') {
        result.push(parseImport(current));
      } else if (type === 'desktop_app') {
        result.push(parseDesktopApp(current));
      } else if (type === 'mobile_app') {
        result.push(parseMobileApp(current));
      } else if (type === 'web_service') {
        result.push(parseWebService(current));
      }
      else if (type === 'reflection') {
        result.push(parseReflection(current));
      } else if (type === 'garbage_collect') {
        result.push({ kind: 'code_template', code: 'System.gc();' } as IRCodeTemplate);
      } else if (type === 'interop_language') {
        result.push(parseInterop(current));
      }
      else if (type === 'variable_show') {
        result.push(parseVariableShow(current));
      } else if (type) {
        result.push(...parseExtraStatement(current, type));
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

function parseRepeat(block: Element): IRRepeat {
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
  const modeField = firstField(block);
  const mode = modeField ? modeField.textContent || 'WHILE' : 'WHILE';

  const condValue = findValue(block, 'BOOL') || firstValue(block);
  let condExpr = condValue ? parseExprFromValue(condValue) : booleanLiteral(false);

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
  const msgExpr = msgValue ? parseExprFromValue(msgValue) : stringLiteral('');

  return {
    kind: 'print',
    value: msgExpr,
  };
}

function parseExprFromValue(valueNode: Element): IRExpr {
  const innerBlock = getBlockOrShadowFromValue(valueNode);
  if (!innerBlock) {
    return numberLiteral(0);
  }

  return parseExprFromBlock(innerBlock);
}

function parseExprFromBlock(block: Element): IRExpr {
  const type = block.getAttribute('type');

  if (type === 'type_int') { return stringLiteral('int'); }
  if (type === 'type_double') { return stringLiteral('double'); }
  if (type === 'type_boolean') { return stringLiteral('boolean'); }
  if (type === 'type_string') { return stringLiteral('String'); }
  if (type === 'type_char') { return stringLiteral('char'); }
  if (type === 'type_void') { return stringLiteral('void'); }
  if (type === 'type_long') { return stringLiteral('long'); }
  if (type === 'type_float') { return stringLiteral('float'); }
  if (type === 'type_short') { return stringLiteral('short'); }
  if (type === 'type_byte') { return stringLiteral('byte'); }
  if (type === 'type_custom') { return stringLiteral(typeName(fieldText(block, 'TYPE', 'MiClase'))); }
  if (type === 'modifier_public') { return stringLiteral('public'); }
  if (type === 'modifier_private') { return stringLiteral('private'); }
  if (type === 'modifier_protected') { return stringLiteral('protected'); }

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

  if (type === 'variables_get') {
    const field = firstField(block);
    const name = field ? field.textContent || 'var' : 'var';
    return {
      kind: 'var_ref',
      name,
    } as IRVarRef;
  }

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

  if (type === 'math_modulo') {
    const aValue = findValue(block, 'A') || firstValue(block);
    const bValue = findValue(block, 'B');
    const left = aValue ? parseExprFromValue(aValue) : numberLiteral(0);
    const right = bValue ? parseExprFromValue(bValue) : numberLiteral(1);
    return { kind: 'binary_op', op: '%', left, right } as IRBinaryOp;
  }

  if (type === 'math_round') {
    const numValue = findValue(block, 'NUM') || firstValue(block);
    const expr = numValue ? parseExprFromValue(numValue) : numberLiteral(0);
    return { kind: 'unary_op', op: 'Math.round', expr } as IRUnaryOp;
  }

  if (type === 'ternary_operator') {
    const condVal = findValue(block, 'CONDITION') || firstValue(block);
    const ifTrueVal = findValue(block, 'IF_TRUE');
    const ifFalseVal = findValue(block, 'IF_FALSE');
    const condition = condVal ? parseExprFromValue(condVal) : booleanLiteral(true);
    const ifTrue = ifTrueVal ? parseExprFromValue(ifTrueVal) : numberLiteral(0);
    const ifFalse = ifFalseVal ? parseExprFromValue(ifFalseVal) : numberLiteral(0);
    return { kind: 'ternary', condition, ifTrue, ifFalse } as IRTernary;
  }

  if (type === 'text_char_at') {
    const textVal = findValue(block, 'TEXT');
    const indexVal = findValue(block, 'INDEX') || firstValue(block);
    const text = textVal ? parseExprFromValue(textVal) : stringLiteral('');
    const index = indexVal ? parseExprFromValue(indexVal) : numberLiteral(0);
    return { kind: 'char_at', text, index } as IRCharAt;
  }

  if (type === 'text_contains') {
    const textVal = findValue(block, 'TEXT') || firstValue(block);
    const searchVal = findValue(block, 'SEARCH');
    const text = textVal ? parseExprFromValue(textVal) : stringLiteral('');
    const search = searchVal ? parseExprFromValue(searchVal) : stringLiteral('');
    return { kind: 'text_contains', text, search } as IRTextContains;
  }

  if (type === 'list_get') {
    const listField = findFieldByName(block, 'LIST');
    const listName = listField ? listField.textContent || 'lista' : 'lista';
    const indexVal = findValue(block, 'INDEX') || firstValue(block);
    const index = indexVal ? parseExprFromValue(indexVal) : numberLiteral(0);
    return { kind: 'list_get', listName, index } as IRListGet;
  }

  if (type === 'list_size') {
    const listField = findFieldByName(block, 'LIST');
    const listName = listField ? listField.textContent || 'lista' : 'lista';
    return { kind: 'list_size', listName } as IRListSize;
  }

  if (type === 'list_contains') {
    const listField = findFieldByName(block, 'LIST');
    const listName = listField ? listField.textContent || 'lista' : 'lista';
    const valNode = findValue(block, 'VALUE') || firstValue(block);
    const value = valNode ? parseExprFromValue(valNode) : numberLiteral(0);
    return { kind: 'list_contains', listName, value } as IRListContains;
  }

  if (type === 'map_get') {
    const mapField = findFieldByName(block, 'MAP');
    const mapName = mapField ? mapField.textContent || 'mapa' : 'mapa';
    const keyVal = findValue(block, 'KEY') || firstValue(block);
    const key = keyVal ? parseExprFromValue(keyVal) : stringLiteral('');
    return { kind: 'map_get', mapName, key } as IRMapGet;
  }

  if (type === 'map_contains_key') {
    const mapField = findFieldByName(block, 'MAP');
    const mapName = mapField ? mapField.textContent || 'mapa' : 'mapa';
    const keyVal = findValue(block, 'KEY') || firstValue(block);
    const key = keyVal ? parseExprFromValue(keyVal) : stringLiteral('');
    return { kind: 'map_contains_key', mapName, key } as IRMapContainsKey;
  }

  if (type === 'object_instantiation') {
    const classField = findFieldByName(block, 'CLASS');
    const className = classField ? classField.textContent || 'MiClase' : 'MiClase';
    return { kind: 'new_object', className, args: parseArgs(block) } as IRNewObject;
  }

  if (type === 'this_reference') {
    return { kind: 'this_ref' } as IRThisRef;
  }

  if (type === 'system_timer') {
    return { kind: 'timer' } as IRTimerExpr;
  }

  if (type === 'lambda_function') {
    const paramsField = findFieldByName(block, 'PARAMS');
    const paramsStr = paramsField ? paramsField.textContent || 'x' : 'x';
    const params = paramsStr.split(',').map(p => p.trim());
    const bodyVal = findValue(block, 'BODY') || firstValue(block);
    const body = bodyVal ? parseExprFromValue(bodyVal) : numberLiteral(0);
    return { kind: 'lambda', params, body } as IRLambda;
  }

  if (type === 'stream_filter') {
    const collField = findFieldByName(block, 'COLLECTION');
    const collection = collField ? collField.textContent || 'lista' : 'lista';
    const varField = findFieldByName(block, 'VAR');
    const variable = varField ? varField.textContent || 'x' : 'x';
    const condVal = findValue(block, 'CONDITION') || firstValue(block);
    const condition = condVal ? parseExprFromValue(condVal) : booleanLiteral(true);
    return { kind: 'stream_filter', collection, variable, condition } as IRStreamFilter;
  }

  if (type === 'array_length') {
    const nameField = findFieldByName(block, 'VAR');
    const name = nameField ? nameField.textContent || 'arr' : 'arr';
    return { kind: 'array_length', name } as IRArrayLength;
  }

  if (type === 'array_access') {
    const nameField = findFieldByName(block, 'VAR');
    const name = nameField ? nameField.textContent || 'arr' : 'arr';
    const indexVal = findValue(block, 'INDEX') || firstValue(block);
    const index = indexVal ? parseExprFromValue(indexVal) : numberLiteral(0);
    return { kind: 'array_access', name, index } as IRArrayAccess;
  }

  if (type === 'function_call' || type === 'function_call_value') {
    const nameField = findFieldByName(block, 'NAME');
    const name = nameField ? nameField.textContent || 'func' : 'func';
    return { kind: 'function_call_expr', name, args: parseArgs(block) } as IRFunctionCallExpr;
  }

  return parseExtraExpr(block, type) ?? numberLiteral(0);
}

function getBlockOrShadowFromValue(valueNode: Element): Element | null {
  let shadow: Element | null = null;
  for (let i = 0; i < valueNode.childNodes.length; i++) {
    const child = valueNode.childNodes.item(i) as Element;
    if (child && child.nodeType === 1) {
      if (child.tagName === 'block') {
        return child;
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
  return { kind: 'function_call', name, args: parseArgs(block) };
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

  const byExpr = byValue ? parseExprFromValue(byValue) : null;
  // A negative literal step counts down, so the loop must run while var >= TO.
  const countsDown = byExpr !== null && byExpr.kind === 'number' && byExpr.value < 0;

  const condition: IRBinaryOp = {
    kind: 'binary_op',
    op: countsDown ? '>=' : '<=',
    left: { kind: 'var_ref', name: varName },
    right: toValue ? parseExprFromValue(toValue) : numberLiteral(10)
  };

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

function parseStop(block: Element): IRStop {
  const modeField = findFieldByName(block, 'MODE');
  const mode = modeField ? modeField.textContent || 'THIS' : 'THIS';
  return { kind: 'stop', mode };
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
  let expr: IRExpr = val ? parseExprFromValue(val) : { kind: 'new_object', className: 'RuntimeException', args: [] } as IRNewObject;
  // `throw "mensaje"` is not Java: wrap anything that is not an object in a RuntimeException.
  if (expr.kind !== 'new_object' && expr.kind !== 'var_ref' && expr.kind !== 'method_call_expr' && expr.kind !== 'field_access') {
    expr = { kind: 'new_object', className: 'RuntimeException', args: [expr] } as IRNewObject;
  }
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

function parseMapPut(block: Element): IRMapPut {
  const mapField = findFieldByName(block, 'MAP');
  const mapName = mapField ? mapField.textContent || 'mapa' : 'mapa';
  const keyVal = findValue(block, 'KEY');
  const key = keyVal ? parseExprFromValue(keyVal) : stringLiteral('');
  const val = findValue(block, 'VALUE');
  const value = val ? parseExprFromValue(val) : stringLiteral('');
  return { kind: 'map_put', mapName, key, value };
}

function parseMapRemove(block: Element): IRMapRemove {
  const mapField = findFieldByName(block, 'MAP');
  const mapName = mapField ? mapField.textContent || 'mapa' : 'mapa';
  const keyVal = findValue(block, 'KEY');
  const key = keyVal ? parseExprFromValue(keyVal) : stringLiteral('');
  return { kind: 'map_remove', mapName, key };
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
  return { kind: 'class_definition', name, attributes, methods, isAbstract: isChecked(block, 'ABSTRACT') };
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
  return { kind: 'class_definition', name, attributes, methods, extendsClass, isAbstract: isChecked(block, 'ABSTRACT') };
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
  return { kind: 'class_definition', name, attributes, methods, implementsInterfaces: iface.split(',').map(i => i.trim()).filter(i => i.length > 0), isAbstract: isChecked(block, 'ABSTRACT') };
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
    const type = current.getAttribute('type');
    if (type === 'attribute_declaration') {
      const modField = findFieldByName(current, 'MODIFIER');
      const modifier = modField ? modField.textContent || 'private' : 'private';
      const typeField = findFieldByName(current, 'TYPE');
      const attrType = typeField ? typeField.textContent || 'int' : 'int';
      const nameField = findFieldByName(current, 'NAME');
      const name = nameField ? nameField.textContent || 'attr' : 'attr';
      const valueNode = findValue(current, 'VALUE');
      attrs.push({
        kind: 'var_declaration', type: attrType, name, accessModifier: modifier,
        isStatic: isChecked(current, 'STATIC'), isFinal: isChecked(current, 'FINAL'),
        value: valueNode ? parseExprFromValue(valueNode) : undefined,
      });
    } else if (type === 'variable_declaration') {
      // Lets attributes use any type block, including class types (type_custom).
      attrs.push(parseVarDeclaration(current));
    } else if (type === 'variable_declaration_init') {
      const decl = parseVarDeclarationInit(current);
      attrs.push({ kind: 'var_declaration', type: decl.type, name: decl.name, value: decl.value });
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
    } else if (type === 'abstract_method') {
      methods.push(parseAbstractMethod(current));
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
  return {
    kind: 'function_definition', returnType, name, params, body, accessModifier: modifier,
    isStatic: isChecked(block, 'STATIC'), throwsTypes: fieldText(block, 'THROWS', '').trim() || undefined,
  };
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
  const paramsStmt = findStatement(block, 'PARAMS');
  const params = paramsStmt ? parseParameters(paramsStmt) : [];
  const bodyStmt = findStatement(block, 'BODY');
  const body = bodyStmt ? parseStatementBody(bodyStmt) : [];
  return { kind: 'function_definition', returnType, name, params, body, accessModifier: modifier, isOverride: true };
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

function parseParallelExec(block: Element): IRThreadCreate[] {
  const task1Stmt = findStatement(block, 'TASK1');
  const task2Stmt = findStatement(block, 'TASK2');
  const body1 = task1Stmt ? parseStatementBody(task1Stmt) : [];
  const body2 = task2Stmt ? parseStatementBody(task2Stmt) : [];
  const n = ++parallelCounter;
  const suffix = n === 1 ? '' : `_${n}`;
  return [
    { kind: 'thread_create', name: `t1${suffix}`, body: body1 } as IRThreadCreate,
    { kind: 'thread_create', name: `t2${suffix}`, body: body2 } as IRThreadCreate,
  ];
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

function parseFileWrite(block: Element): IRFileWrite {
  const pathField = findFieldByName(block, 'PATH');
  const path = pathField ? pathField.textContent || 'archivo.txt' : 'archivo.txt';
  const contentVal = findValue(block, 'CONTENT');
  const content = contentVal ? parseExprFromValue(contentVal) : stringLiteral('');
  return { kind: 'file_write', path, content };
}

function parseUrlConnection(block: Element): IRCodeTemplate {
  const urlField = findFieldByName(block, 'URL');
  const url = urlField ? urlField.textContent || 'https://api.example.com' : 'https://api.example.com';
  return {
    kind: 'code_template',
    code: `java.net.HttpURLConnection conn = (java.net.HttpURLConnection) new java.net.URL("${url}").openConnection();\nconn.setRequestMethod("GET");`
  };
}

function parseEncryptDecrypt(block: Element): IREncryptDecrypt {
  const modeField = findFieldByName(block, 'MODE');
  const mode = modeField ? modeField.textContent || 'ENCRYPT' : 'ENCRYPT';
  const keyField = findFieldByName(block, 'KEY');
  const key = keyField ? keyField.textContent || 'clave' : 'clave';
  const dataVal = findValue(block, 'DATA');
  const data = dataVal ? parseExprFromValue(dataVal) : stringLiteral('');
  return { kind: 'encrypt_decrypt', mode, key, data };
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

function parseDesktopApp(block: Element): IRDesktopApp {
  const titleField = findFieldByName(block, 'TITLE');
  const title = titleField ? titleField.textContent || 'Mi App' : 'Mi App';
  const bodyStmt = findStatement(block, 'BODY');
  const body = bodyStmt ? parseStatementBody(bodyStmt) : [];
  return { kind: 'desktop_app', title, body };
}

function parseMobileApp(block: Element): IRMobileApp {
  const nameField = findFieldByName(block, 'NAME');
  const name = nameField ? nameField.textContent || 'MiApp' : 'MiApp';
  const bodyStmt = findStatement(block, 'BODY');
  const body = bodyStmt ? parseStatementBody(bodyStmt) : [];
  return { kind: 'mobile_app', name, body };
}

function parseWebService(block: Element): IRWebService {
  const pathField = findFieldByName(block, 'PATH');
  const path = pathField ? pathField.textContent || '/api/hola' : '/api/hola';
  const bodyStmt = findStatement(block, 'BODY');
  const body = bodyStmt ? parseStatementBody(bodyStmt) : [];
  return { kind: 'web_service', path, body };
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

// ---------------------------------------------------------------------------
// Bloques añadidos en 0.5: bucles, objetos, texto, matemáticas y colecciones.
// ---------------------------------------------------------------------------

const COMPARE_OPS: Record<string, string> = { LT: '<', LTE: '<=', GT: '>', GTE: '>=' };
const COMPOUND_OPS = ['+=', '-=', '*=', '/=', '%='];
const CAST_TYPES = ['int', 'double', 'long', 'float', 'short', 'byte', 'char'];
const MATH_ONE_ARG = ['Math.abs', 'Math.sqrt', 'Math.cbrt', 'Math.floor', 'Math.ceil', 'Math.log', 'Math.log10', 'Math.sin', 'Math.cos', 'Math.tan'];
const MATH_TWO_ARGS = ['Math.max', 'Math.min', 'Math.pow', 'Math.hypot'];
const CONSTANTS = ['Math.PI', 'Math.E', 'Integer.MAX_VALUE', 'Integer.MIN_VALUE', 'Double.MAX_VALUE', 'Long.MAX_VALUE'];
const TEXT_METHODS_NO_ARG = ['toUpperCase', 'toLowerCase', 'trim', 'isEmpty', 'isBlank', 'strip'];
const TEXT_METHODS_ONE_ARG = ['indexOf', 'lastIndexOf', 'startsWith', 'endsWith', 'equalsIgnoreCase', 'compareTo', 'split', 'repeat'];
const CONVERSIONS = [
  'Double.parseDouble', 'Long.parseLong', 'Boolean.parseBoolean', 'String.valueOf', 'Integer.toString',
  'Character.isDigit', 'Character.isLetter', 'Character.isUpperCase', 'Character.isLowerCase',
  'Character.toUpperCase', 'Character.toLowerCase', 'Character.getNumericValue',
];
const COLLECTION_TYPES = ['ArrayList', 'LinkedList', 'HashSet', 'TreeSet', 'Stack', 'ArrayDeque'];
const COLLECTION_DO_ARG = ['add', 'remove', 'push', 'offer', 'addFirst', 'addLast'];
const COLLECTION_DO_NO_ARG = ['clear', 'pop', 'poll', 'removeFirst', 'removeLast'];
const COLLECTION_VALUE_NO_ARG = ['size', 'isEmpty', 'peek', 'pop', 'poll', 'getFirst', 'getLast', 'first', 'last', 'keySet', 'values'];
const COLLECTION_VALUE_ARG = ['contains', 'indexOf', 'get', 'containsKey', 'containsValue'];
const UTIL_STATEMENTS = ['Collections.sort', 'Collections.reverse', 'Collections.shuffle', 'Arrays.sort'];
const UTIL_VALUES = ['Arrays.toString', 'Arrays.deepToString', 'Collections.max', 'Collections.min'];

function fieldText(block: Element, name: string, fallback: string): string {
  const f = findFieldByName(block, name);
  return f && f.textContent !== null ? f.textContent : fallback;
}

/** Reads a dropdown and only accepts one of its known options, so XML cannot inject code. */
function choice(block: Element, name: string, allowed: string[]): string {
  const v = fieldText(block, name, allowed[0]);
  return allowed.includes(v) ? v : allowed[0];
}

function isChecked(block: Element, name: string): boolean {
  return fieldText(block, name, 'FALSE') === 'TRUE';
}

/** Keeps characters that can appear in a Java type such as Map<String, List<Integer>>[]. */
function typeName(raw: string): string {
  const cleaned = raw.replace(/[^\w<>,.\[\]? ]/g, '').trim();
  return cleaned || 'Object';
}

function valueOr(block: Element, name: string, fallback: IRExpr): IRExpr {
  const v = findValue(block, name);
  return v ? parseExprFromValue(v) : fallback;
}

function statementOf(block: Element, name: string): IRNode[] {
  const stmt = findStatement(block, name);
  return stmt ? parseStatementBody(stmt) : [];
}

/**
 * Arguments of call blocks: inputs ARG0..ARGn-1, with n from <mutation args="n">.
 * Older workspaces used a single ARGS input.
 */
function parseArgs(block: Element): IRExpr[] {
  const mutation = firstChildMutation(block);
  const declared = mutation ? parseInt(mutation.getAttribute('args') || '', 10) : NaN;
  if (!isNaN(declared)) {
    const args: IRExpr[] = [];
    for (let i = 0; i < declared; i++) {
      args.push(valueOr(block, `ARG${i}`, numberLiteral(0)));
    }
    return args;
  }
  const legacy = findValue(block, 'ARGS');
  return legacy ? [parseExprFromValue(legacy)] : [];
}

function parseExtraStatement(block: Element, type: string): IRNode[] {
  switch (type) {
    case 'controls_do_while':
      return [{ kind: 'do_while', body: statementOf(block, 'DO'), condition: valueOr(block, 'BOOL', booleanLiteral(false)) }];

    case 'controls_for_each':
      return [{
        kind: 'for_each',
        elementType: typeName(fieldText(block, 'TYPE', 'int')),
        name: fieldText(block, 'VAR', 'x'),
        collection: valueOr(block, 'COLLECTION', { kind: 'var_ref', name: 'lista' } as IRVarRef),
        body: statementOf(block, 'DO'),
      }];

    case 'controls_for_classic': {
      const name = fieldText(block, 'VAR', 'i');
      const cmp = COMPARE_OPS[fieldText(block, 'OP', 'LT')] ?? '<';
      const step = choice(block, 'STEP', ['++', '--', '+=', '-=']);
      const by = valueOr(block, 'BY', numberLiteral(1));
      const increment: IRNode =
        step === '++' ? { kind: 'var_increment', name } :
        step === '--' ? { kind: 'var_decrement', name } :
        { kind: 'compound_assign', name, op: step, value: by };
      return [{
        kind: 'for',
        init: { kind: 'var_declaration_init', type: 'int', name, value: valueOr(block, 'FROM', numberLiteral(0)) },
        condition: { kind: 'binary_op', op: cmp, left: { kind: 'var_ref', name }, right: valueOr(block, 'TO', numberLiteral(10)) },
        increment,
        body: statementOf(block, 'DO'),
      }];
    }

    case 'variable_compound':
      return [{ kind: 'compound_assign', name: fieldText(block, 'VAR', 'x'), op: choice(block, 'OP', COMPOUND_OPS), value: valueOr(block, 'VALUE', numberLiteral(1)) }];

    case 'text_print_inline':
      return [{ kind: 'print', value: valueOr(block, 'TEXT', stringLiteral('')), newline: false }];

    case 'text_printf':
      return [{ kind: 'printf', format: fieldText(block, 'FORMAT', '%d%n'), args: parseArgs(block) }];

    case 'method_call':
      return [{ kind: 'method_call', target: valueOr(block, 'OBJECT', { kind: 'this_ref' }), method: fieldText(block, 'METHOD', 'metodo'), args: parseArgs(block) }];

    case 'field_set':
      return [{ kind: 'field_assign', target: valueOr(block, 'OBJECT', { kind: 'this_ref' }), field: fieldText(block, 'FIELD', 'campo'), value: valueOr(block, 'VALUE', numberLiteral(0)) }];

    case 'super_constructor_call':
      return [{ kind: 'super_call', args: parseArgs(block) } as IRSuperCall];

    case 'constant_declaration': {
      const typeVal = findValue(block, 'TYPE');
      const t = typeVal ? parseExprFromValue(typeVal) : stringLiteral('int');
      return [{ kind: 'constant_declaration', type: (t as IRString).value, name: fieldText(block, 'NAME', 'MAXIMO'), value: valueOr(block, 'VALUE', numberLiteral(0)) }];
    }

    case 'array2d_declaration': {
      const typeVal = findValue(block, 'TYPE');
      const t = typeVal ? parseExprFromValue(typeVal) : stringLiteral('int');
      return [{ kind: 'array2d_declaration', type: (t as IRString).value, name: fieldText(block, 'VAR', 'matriz'), rows: valueOr(block, 'ROWS', numberLiteral(3)), cols: valueOr(block, 'COLS', numberLiteral(3)) }];
    }

    case 'array2d_assignment':
      return [{ kind: 'array2d_assignment', name: fieldText(block, 'VAR', 'matriz'), row: valueOr(block, 'ROW', numberLiteral(0)), col: valueOr(block, 'COL', numberLiteral(0)), value: valueOr(block, 'VALUE', numberLiteral(0)) }];

    case 'collection_declaration':
      return [{ kind: 'collection_declaration', collectionType: choice(block, 'COLLECTION', COLLECTION_TYPES), elementType: typeName(fieldText(block, 'ELEMENT_TYPE', 'Integer')), name: fieldText(block, 'NAME', 'coleccion') }];

    case 'collection_do':
      return [{ kind: 'method_call', target: { kind: 'var_ref', name: fieldText(block, 'NAME', 'coleccion') } as IRVarRef, method: choice(block, 'METHOD', COLLECTION_DO_ARG), args: [valueOr(block, 'VALUE', numberLiteral(0))] }];

    case 'collection_do_no_arg':
      return [{ kind: 'method_call', target: { kind: 'var_ref', name: fieldText(block, 'NAME', 'coleccion') } as IRVarRef, method: choice(block, 'METHOD', COLLECTION_DO_NO_ARG), args: [] }];

    case 'collections_util':
      return [{
        kind: 'expr_statement',
        expr: { kind: 'static_call', callee: 'java.util.' + choice(block, 'FUNC', UTIL_STATEMENTS), args: [{ kind: 'var_ref', name: fieldText(block, 'NAME', 'lista') } as IRVarRef] },
      }];

    case 'try_multi_catch':
      return [{
        kind: 'try_catch_finally',
        tryBody: statementOf(block, 'TRY'),
        catchType: 'Exception', catchVar: 'e', catchBody: [],
        catches: parseCatches(block),
        finallyBody: statementOf(block, 'FINALLY'),
      }];

    default:
      return [];
  }
}

function parseCatches(block: Element): IRCatch[] {
  const catches: IRCatch[] = [];
  const stmt = findStatement(block, 'CATCHES');
  let current: Element | null = null;
  if (stmt) {
    for (let i = 0; i < stmt.childNodes.length; i++) {
      const child = stmt.childNodes.item(i) as Element;
      if (child && child.nodeType === 1 && child.tagName === 'block') { current = child; break; }
    }
  }
  while (current) {
    if (current.getAttribute('type') === 'catch_clause') {
      catches.push({
        // "A | B" is a multi-catch, so keep the bar.
        type: fieldText(current, 'TYPE', 'Exception').split('|').map(t => typeName(t)).join(' | '),
        varName: fieldText(current, 'VAR', 'e'),
        body: statementOf(current, 'DO'),
      });
    }
    current = getNextBlock(current);
  }
  if (catches.length === 0) {
    catches.push({ type: 'Exception', varName: 'e', body: [] });
  }
  return catches;
}

function parseAbstractMethod(block: Element): IRFunctionDefinition {
  const paramsStmt = findStatement(block, 'PARAMS');
  return {
    kind: 'function_definition',
    returnType: fieldText(block, 'RETURN_TYPE', 'void'),
    name: fieldText(block, 'NAME', 'metodo'),
    params: paramsStmt ? parseParameters(paramsStmt) : [],
    body: [],
    accessModifier: choice(block, 'MODIFIER', ['public', 'protected']),
    isAbstract: true,
  };
}

function parseExtraExpr(block: Element, type: string | null): IRExpr | null {
  switch (type) {
    case 'logic_null':
      return { kind: 'null' };

    case 'char_literal':
      return { kind: 'char', value: fieldText(block, 'CHAR', 'a').charAt(0) || ' ' };

    case 'math_cast':
      return { kind: 'unary_op', op: `(${choice(block, 'TYPE', CAST_TYPES)})`, expr: valueOr(block, 'VALUE', numberLiteral(0)) };

    case 'math_function':
      return { kind: 'static_call', callee: choice(block, 'FUNC', MATH_ONE_ARG), args: [valueOr(block, 'NUM', numberLiteral(0))] };

    case 'math_two_args':
      return { kind: 'static_call', callee: choice(block, 'FUNC', MATH_TWO_ARGS), args: [valueOr(block, 'A', numberLiteral(0)), valueOr(block, 'B', numberLiteral(0))] };

    case 'math_constant_java':
      return { kind: 'constant', code: choice(block, 'CONSTANT', CONSTANTS) };

    case 'text_method':
      return { kind: 'method_call_expr', target: valueOr(block, 'TEXT', stringLiteral('')), method: choice(block, 'METHOD', TEXT_METHODS_NO_ARG), args: [] };

    case 'text_method_arg':
      return { kind: 'method_call_expr', target: valueOr(block, 'TEXT', stringLiteral('')), method: choice(block, 'METHOD', TEXT_METHODS_ONE_ARG), args: [valueOr(block, 'ARG', stringLiteral(''))] };

    case 'text_replace':
      return { kind: 'method_call_expr', target: valueOr(block, 'TEXT', stringLiteral('')), method: 'replace', args: [valueOr(block, 'FROM', stringLiteral('')), valueOr(block, 'TO', stringLiteral(''))] };

    case 'text_convert':
      return { kind: 'static_call', callee: choice(block, 'FUNC', CONVERSIONS), args: [valueOr(block, 'VALUE', stringLiteral(''))] };

    case 'input_read_boolean':
      return { kind: 'input_read', type: 'boolean' };

    case 'input_read_word':
      return { kind: 'input_read', type: 'word' };

    case 'input_has_next_int':
      return { kind: 'input_read', type: 'hasNextInt' };

    case 'method_call_value':
      return { kind: 'method_call_expr', target: valueOr(block, 'OBJECT', { kind: 'this_ref' }), method: fieldText(block, 'METHOD', 'metodo'), args: parseArgs(block) };

    case 'field_get':
      return { kind: 'field_access', target: valueOr(block, 'OBJECT', { kind: 'this_ref' }), field: fieldText(block, 'FIELD', 'campo') };

    case 'super_reference':
      return { kind: 'super_ref' };

    case 'logic_instanceof':
      return { kind: 'instance_of', expr: valueOr(block, 'VALUE', { kind: 'null' }), className: typeName(fieldText(block, 'CLASS', 'MiClase')) };

    case 'array2d_access':
      return { kind: 'array2d_access', name: fieldText(block, 'VAR', 'matriz'), row: valueOr(block, 'ROW', numberLiteral(0)), col: valueOr(block, 'COL', numberLiteral(0)) };

    case 'collection_value':
      return { kind: 'method_call_expr', target: { kind: 'var_ref', name: fieldText(block, 'NAME', 'coleccion') }, method: choice(block, 'METHOD', COLLECTION_VALUE_NO_ARG), args: [] };

    case 'collection_value_arg':
      return { kind: 'method_call_expr', target: { kind: 'var_ref', name: fieldText(block, 'NAME', 'coleccion') }, method: choice(block, 'METHOD', COLLECTION_VALUE_ARG), args: [valueOr(block, 'VALUE', numberLiteral(0))] };

    case 'map_get_or_default':
      return { kind: 'method_call_expr', target: { kind: 'var_ref', name: fieldText(block, 'MAP', 'mapa') }, method: 'getOrDefault', args: [valueOr(block, 'KEY', stringLiteral('')), valueOr(block, 'DEFAULT', numberLiteral(0))] };

    case 'util_value':
      return { kind: 'static_call', callee: 'java.util.' + choice(block, 'FUNC', UTIL_VALUES), args: [{ kind: 'var_ref', name: fieldText(block, 'NAME', 'lista') }] };

    default:
      return null;
  }
}
