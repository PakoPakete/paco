export type IRNode =
  | IRRepeat
  | IRIf
  | IRWhile
  | IRFor
  | IRForever
  | IRSwitch
  | IRPrint
  | IRVarAssign
  | IRVarChange
  | IRComment
  | IRVarDeclaration
  | IRVarDeclarationInit
  | IRVarIncrement
  | IRVarDecrement
  | IRArrayDeclaration
  | IRArrayAssignment
  | IRFunctionDefinition
  | IRFunctionCall
  | IRReturn
  | IRClassDefinition
  | IRInterfaceDefinition
  | IRBreak
  | IRContinue
  | IRTryCatchFinally
  | IRThrow
  | IRWaitSeconds
  | IRWaitUntil
  | IRStop
  | IRListDeclaration
  | IRListAdd
  | IRListRemove
  | IRListClear
  | IRListInsert
  | IRListSet
  | IRMapDeclaration
  | IREnumDefinition
  | IRThreadCreate
  | IRSynchronized
  | IRImport
  | IRCodeTemplate
  | IRBroadcast
  | IRBroadcastWait
  | IRWhenReceive;

export type IRExpr =
  | IRNumber
  | IRBoolean
  | IRString
  | IRBinaryOp
  | IRUnaryOp
  | IRRandom
  | IRVarRef
  | IRArrayAccess
  | IRArrayLength
  | IRTextConcat
  | IRTextLength
  | IRInputRead
  | IRTernary
  | IRCharAt
  | IRTextContains
  | IRTextSubstring
  | IRListGet
  | IRListSize
  | IRListContains
  | IRNewObject
  | IRThisRef
  | IRTimerExpr
  | IRLambda
  | IRStreamFilter
  | IRFunctionCallExpr;

// ... existing interfaces ...


export interface IRComment {
  kind: 'comment';
  text: string;
}

// Declaración de variable: int x;
export interface IRVarDeclaration {
  kind: 'var_declaration';
  type: string;
  name: string;
  accessModifier?: string;
}

// Declaración con inicialización: int x = 5;
export interface IRVarDeclarationInit {
  kind: 'var_declaration_init';
  type: string;
  name: string;
  value: IRExpr;
}

// Incremento: x++;
export interface IRVarIncrement {
  kind: 'var_increment';
  name: string;
}

// Decremento: x--;
export interface IRVarDecrement {
  kind: 'var_decrement';
  name: string;
}

// Declaración de array: int[] arr = new int[size];
export interface IRArrayDeclaration {
  kind: 'array_declaration';
  type: string;
  name: string;
  size: IRExpr;
}

// Acceso a array: arr[index]
export interface IRArrayAccess {
  kind: 'array_access';
  name: string;
  index: IRExpr;
}

// Asignación a array: arr[index] = value;
export interface IRArrayAssignment {
  kind: 'array_assignment';
  name: string;
  index: IRExpr;
  value: IRExpr;
}

// Longitud de array: arr.length
export interface IRArrayLength {
  kind: 'array_length';
  name: string;
}

// Definición de función
export interface IRFunctionDefinition {
  kind: 'function_definition';
  returnType: string;
  name: string;
  params: IRParameter[];
  body: IRNode[];
  accessModifier?: string;
  isStatic?: boolean;
  isOverride?: boolean;
}

// Parámetro de función
export interface IRParameter {
  type: string;
  name: string;
}

// Llamada a función
export interface IRFunctionCall {
  kind: 'function_call';
  name: string;
  args: IRExpr[];
}

// Return
export interface IRReturn {
  kind: 'return';
  value?: IRExpr;
}

// Definición de clase
export interface IRClassDefinition {
  kind: 'class_definition';
  name: string;
  attributes: IRVarDeclaration[];
  methods: IRFunctionDefinition[];
  extendsClass?: string;
  implementsInterfaces?: string[];
  accessModifier?: string;
}

// Atributo de clase (usar IRVarDeclaration)
export interface IRAttribute extends IRVarDeclaration {}

// número aleatorio entre min y max (operator_random)
export interface IRRandom {
  kind: 'random';
  min: IRExpr;
  max: IRExpr;
}

// string literal, p.ej. "Hola", "Mundo"
export interface IRString {
  kind: 'string';
  value: string;
}

// operación unaria, p.ej. !a
export interface IRUnaryOp {
  kind: 'unary_op';
  op: string;
  expr: IRExpr;
}

// operación binaria, p.ej. (5 + 1), (a && b)
export interface IRBinaryOp {
  kind: 'binary_op';
  op: string;      // '+', '-', '*', '/', '&&', '||', etc.
  left: IRExpr;
  right: IRExpr;
}

// Cambiar variable por X: x += expr;
export interface IRVarChange {
  kind: 'var_change';
  name: string;
  value: IRExpr;
}

// Asignación de variable: x = expr;
export interface IRVarAssign {
  kind: 'var_assign';
  name: string;
  value: IRExpr;
}

// número literal, p.ej. 5, 10, 3.14
export interface IRNumber {
  kind: 'number';
  value: number;
}

// booleano literal, true, false
export interface IRBoolean {
  kind: 'boolean';
  value: boolean;
}

// repeat (N veces) { cuerpo }
export interface IRRepeat {
  kind: 'repeat';
  times: IRExpr;    // cuántas veces
  body: IRNode[];   // lista de instrucciones dentro del bucle
}

// if (condicion) { cuerpo }
export interface IRIf {
  kind: 'if';
  condition: IRExpr;
  body: IRNode[];
  elseBody?: IRNode[];
}

// while (condicion) { cuerpo } (para Scratch "repeat until")
export interface IRWhile {
  kind: 'while';
  condition: IRExpr;
  body: IRNode[];
}

// for (init; condition; increment) { body }
export interface IRFor {
  kind: 'for';
  init?: IRNode;
  condition?: IRExpr;
  increment?: IRNode;
  body: IRNode[];
}

// switch (expr) { case value: ... }
export interface IRSwitch {
  kind: 'switch';
  expr: IRExpr;
  cases: IRCase[];
}

// case value: statements
export interface IRCase {
  value?: IRExpr;
  body: IRNode[];
}

// break;
export interface IRBreak {
  kind: 'break';
}

// continue;
export interface IRContinue {
  kind: 'continue';
}

// "Decir" en Scratch -> Print en Java
export interface IRPrint {
  kind: 'print';
  value: IRExpr;
}

// Concatenación de texto
export interface IRTextConcat {
  kind: 'text_concat';
  left: IRExpr;
  right: IRExpr;
}

// Longitud de texto
export interface IRTextLength {
  kind: 'text_length';
  expr: IRExpr;
}

// Lectura de input
export interface IRInputRead {
  kind: 'input_read';
  type: string;
}

// Referencia a variable en una expresión: usar x
export interface IRVarRef {
  kind: 'var_ref';
  name: string;
}

// ============================================================
// SENTENCIAS NUEVAS
// ============================================================

// forever -> while(true)
export interface IRForever {
  kind: 'forever';
  body: IRNode[];
}

// Eventos
export interface IRBroadcast {
  kind: 'broadcast';
  message: string;
}

export interface IRBroadcastWait {
  kind: 'broadcast_wait';
  message: string;
}

export interface IRWhenReceive {
  kind: 'when_receive';
  message: string;
  body: IRNode[];
}

// Control
export interface IRWaitSeconds {
  kind: 'wait_seconds';
  seconds: IRExpr;
}

export interface IRWaitUntil {
  kind: 'wait_until';
  condition: IRExpr;
}

// Detiene la ejecución del programa -> genera System.exit(0) en Java
export interface IRStop {
  kind: 'stop';
}

// Manejo de errores
export interface IRTryCatchFinally {
  kind: 'try_catch_finally';
  tryBody: IRNode[];
  catchType: string;
  catchVar: string;
  catchBody: IRNode[];
  finallyBody: IRNode[];
}

export interface IRThrow {
  kind: 'throw';
  expr: IRExpr;
}

// Listas / Colecciones (ArrayList)
export interface IRListDeclaration {
  kind: 'list_declaration';
  elementType: string;
  name: string;
}

export interface IRListAdd {
  kind: 'list_add';
  listName: string;
  value: IRExpr;
}

export interface IRListRemove {
  kind: 'list_remove';
  listName: string;
  index: IRExpr;
}

export interface IRListClear {
  kind: 'list_clear';
  listName: string;
}

export interface IRListInsert {
  kind: 'list_insert';
  listName: string;
  index: IRExpr;
  value: IRExpr;
}

export interface IRListSet {
  kind: 'list_set';
  listName: string;
  index: IRExpr;
  value: IRExpr;
}

// Map / Diccionario
export interface IRMapDeclaration {
  kind: 'map_declaration';
  keyType: string;
  valueType: string;
  name: string;
}

// Enum
export interface IREnumDefinition {
  kind: 'enum_definition';
  name: string;
  values: string[];
}

// Interfaces
export interface IRInterfaceDefinition {
  kind: 'interface_definition';
  name: string;
  methods: { returnType: string; name: string; params: IRParameter[] }[];
}

// Concurrencia
export interface IRThreadCreate {
  kind: 'thread_create';
  name: string;
  body: IRNode[];
}

export interface IRSynchronized {
  kind: 'synchronized';
  lock: IRExpr;
  body: IRNode[];
}

// Imports
export interface IRImport {
  kind: 'import';
  library: string;
}

// Plantilla de código genérica
export interface IRCodeTemplate {
  kind: 'code_template';
  code: string;
}

// ============================================================
// EXPRESIONES NUEVAS
// ============================================================

export interface IRTernary {
  kind: 'ternary';
  condition: IRExpr;
  ifTrue: IRExpr;
  ifFalse: IRExpr;
}

export interface IRCharAt {
  kind: 'char_at';
  text: IRExpr;
  index: IRExpr;
}

export interface IRTextContains {
  kind: 'text_contains';
  text: IRExpr;
  search: IRExpr;
}

export interface IRTextSubstring {
  kind: 'text_substring';
  text: IRExpr;
  start: IRExpr;
  end: IRExpr;
}

export interface IRListGet {
  kind: 'list_get';
  listName: string;
  index: IRExpr;
}

export interface IRListSize {
  kind: 'list_size';
  listName: string;
}

export interface IRListContains {
  kind: 'list_contains';
  listName: string;
  value: IRExpr;
}

export interface IRNewObject {
  kind: 'new_object';
  className: string;
  args: IRExpr[];
}

export interface IRThisRef {
  kind: 'this_ref';
}

export interface IRTimerExpr {
  kind: 'timer';
}

export interface IRLambda {
  kind: 'lambda';
  params: string[];
  body: IRExpr;
}

export interface IRStreamFilter {
  kind: 'stream_filter';
  collection: string;
  variable: string;
  condition: IRExpr;
}

export interface IRFunctionCallExpr {
  kind: 'function_call_expr';
  name: string;
  args: IRExpr[];
}
