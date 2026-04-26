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
  | IRMapPut
  | IRMapRemove
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
  | IRMapGet
  | IRMapContainsKey
  | IRNewObject
  | IRThisRef
  | IRTimerExpr
  | IRLambda
  | IRStreamFilter
  | IRFunctionCallExpr;

export interface IRComment {
  kind: 'comment';
  text: string;
}

export interface IRVarDeclaration {
  kind: 'var_declaration';
  type: string;
  name: string;
  accessModifier?: string;
}

export interface IRVarDeclarationInit {
  kind: 'var_declaration_init';
  type: string;
  name: string;
  value: IRExpr;
}

export interface IRVarIncrement {
  kind: 'var_increment';
  name: string;
}

export interface IRVarDecrement {
  kind: 'var_decrement';
  name: string;
}

export interface IRArrayDeclaration {
  kind: 'array_declaration';
  type: string;
  name: string;
  size: IRExpr;
}

export interface IRArrayAccess {
  kind: 'array_access';
  name: string;
  index: IRExpr;
}

export interface IRArrayAssignment {
  kind: 'array_assignment';
  name: string;
  index: IRExpr;
  value: IRExpr;
}

export interface IRArrayLength {
  kind: 'array_length';
  name: string;
}

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

export interface IRParameter {
  type: string;
  name: string;
}

export interface IRFunctionCall {
  kind: 'function_call';
  name: string;
  args: IRExpr[];
}

export interface IRReturn {
  kind: 'return';
  value?: IRExpr;
}

export interface IRClassDefinition {
  kind: 'class_definition';
  name: string;
  attributes: IRVarDeclaration[];
  methods: IRFunctionDefinition[];
  extendsClass?: string;
  implementsInterfaces?: string[];
  accessModifier?: string;
}

export interface IRAttribute extends IRVarDeclaration {}

export interface IRRandom {
  kind: 'random';
  min: IRExpr;
  max: IRExpr;
}

export interface IRString {
  kind: 'string';
  value: string;
}

export interface IRUnaryOp {
  kind: 'unary_op';
  op: string;
  expr: IRExpr;
}

export interface IRBinaryOp {
  kind: 'binary_op';
  op: string;      // '+', '-', '*', '/', '&&', '||', etc.
  left: IRExpr;
  right: IRExpr;
}

export interface IRVarChange {
  kind: 'var_change';
  name: string;
  value: IRExpr;
}

export interface IRVarAssign {
  kind: 'var_assign';
  name: string;
  value: IRExpr;
}

export interface IRNumber {
  kind: 'number';
  value: number;
}

export interface IRBoolean {
  kind: 'boolean';
  value: boolean;
}

export interface IRRepeat {
  kind: 'repeat';
  times: IRExpr;    // cuántas veces
  body: IRNode[];   // lista de instrucciones dentro del bucle
}

export interface IRIf {
  kind: 'if';
  condition: IRExpr;
  body: IRNode[];
  elseBody?: IRNode[];
}

export interface IRWhile {
  kind: 'while';
  condition: IRExpr;
  body: IRNode[];
}

export interface IRFor {
  kind: 'for';
  init?: IRNode;
  condition?: IRExpr;
  increment?: IRNode;
  body: IRNode[];
}

export interface IRSwitch {
  kind: 'switch';
  expr: IRExpr;
  cases: IRCase[];
}

export interface IRCase {
  value?: IRExpr;
  body: IRNode[];
}

export interface IRBreak {
  kind: 'break';
}

export interface IRContinue {
  kind: 'continue';
}

export interface IRPrint {
  kind: 'print';
  value: IRExpr;
}

export interface IRTextConcat {
  kind: 'text_concat';
  left: IRExpr;
  right: IRExpr;
}

export interface IRTextLength {
  kind: 'text_length';
  expr: IRExpr;
}

export interface IRInputRead {
  kind: 'input_read';
  type: string;
}

export interface IRVarRef {
  kind: 'var_ref';
  name: string;
}

export interface IRForever {
  kind: 'forever';
  body: IRNode[];
}

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

export interface IRWaitSeconds {
  kind: 'wait_seconds';
  seconds: IRExpr;
}

export interface IRWaitUntil {
  kind: 'wait_until';
  condition: IRExpr;
}

export interface IRStop {
  kind: 'stop';
}

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

export interface IRMapDeclaration {
  kind: 'map_declaration';
  keyType: string;
  valueType: string;
  name: string;
}

export interface IRMapPut {
  kind: 'map_put';
  mapName: string;
  key: IRExpr;
  value: IRExpr;
}

export interface IRMapRemove {
  kind: 'map_remove';
  mapName: string;
  key: IRExpr;
}

export interface IRMapGet {
  kind: 'map_get';
  mapName: string;
  key: IRExpr;
}

export interface IRMapContainsKey {
  kind: 'map_contains_key';
  mapName: string;
  key: IRExpr;
}

export interface IREnumDefinition {
  kind: 'enum_definition';
  name: string;
  values: string[];
}

export interface IRInterfaceDefinition {
  kind: 'interface_definition';
  name: string;
  methods: { returnType: string; name: string; params: IRParameter[] }[];
}

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

export interface IRImport {
  kind: 'import';
  library: string;
}

export interface IRCodeTemplate {
  kind: 'code_template';
  code: string;
}

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
