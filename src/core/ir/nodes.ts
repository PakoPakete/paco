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
  | IRWhenReceive
  | IRFileWrite
  | IREncryptDecrypt
  | IRDesktopApp
  | IRMobileApp
  | IRWebService
  | IRDoWhile
  | IRForEach
  | IRCompoundAssign
  | IRMethodCall
  | IRFieldAssign
  | IRPrintf
  | IRSuperCall
  | IRConstantDeclaration
  | IRArray2DDeclaration
  | IRArray2DAssignment
  | IRCollectionDeclaration
  | IRExprStatement
  | IRLabeled
  | IRJumpLabel
  | IRAssert
  | IRSwitchArrow
  | IRRecordDefinition;

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
  | IRFunctionCallExpr
  | IRMethodCallExpr
  | IRFieldAccess
  | IRCharLiteral
  | IRNull
  | IRSuperRef
  | IRStaticCall
  | IRConstant
  | IRArray2DAccess
  | IRInstanceOf
  | IRLambdaBlock
  | IRMethodRef
  | IRSwitchExpr
  | IRTextBlock
  | IRAnonymousClass;

export interface IRComment {
  kind: 'comment';
  text: string;
}

export interface IRVarDeclaration {
  kind: 'var_declaration';
  type: string;
  name: string;
  accessModifier?: string;
  isStatic?: boolean;
  isFinal?: boolean;
  value?: IRExpr;
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
  isAbstract?: boolean;
  throwsTypes?: string;
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
  isAbstract?: boolean;
  innerClasses?: IRClassDefinition[];
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
  op: string;
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
  times: IRExpr;
  body: IRNode[];
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
  /** false emits System.out.print (no line break). */
  newline?: boolean;
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
  mode: string;
}

export interface IRTryCatchFinally {
  kind: 'try_catch_finally';
  tryBody: IRNode[];
  catchType: string;
  catchVar: string;
  catchBody: IRNode[];
  finallyBody: IRNode[];
  /** When present, replaces the single catchType/catchVar/catchBody clause. */
  catches?: IRCatch[];
}

export interface IRCatch {
  type: string;
  varName: string;
  body: IRNode[];
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

export interface IRFileWrite {
  kind: 'file_write';
  path: string;
  content: IRExpr;
}

export interface IREncryptDecrypt {
  kind: 'encrypt_decrypt';
  mode: string;
  key: string;
  data: IRExpr;
}

export interface IRDesktopApp {
  kind: 'desktop_app';
  title: string;
  body: IRNode[];
}

export interface IRMobileApp {
  kind: 'mobile_app';
  name: string;
  body: IRNode[];
}

export interface IRWebService {
  kind: 'web_service';
  path: string;
  body: IRNode[];
}

export interface IRDoWhile {
  kind: 'do_while';
  condition: IRExpr;
  body: IRNode[];
}

export interface IRForEach {
  kind: 'for_each';
  elementType: string;
  name: string;
  collection: IRExpr;
  body: IRNode[];
}

export interface IRCompoundAssign {
  kind: 'compound_assign';
  name: string;
  op: string;
  value: IRExpr;
}

export interface IRMethodCall {
  kind: 'method_call';
  target: IRExpr;
  method: string;
  args: IRExpr[];
}

export interface IRMethodCallExpr {
  kind: 'method_call_expr';
  target: IRExpr;
  method: string;
  args: IRExpr[];
}

export interface IRFieldAccess {
  kind: 'field_access';
  target: IRExpr;
  field: string;
}

export interface IRFieldAssign {
  kind: 'field_assign';
  target: IRExpr;
  field: string;
  value: IRExpr;
}

export interface IRPrintf {
  kind: 'printf';
  format: string;
  args: IRExpr[];
}

export interface IRSuperCall {
  kind: 'super_call';
  args: IRExpr[];
}

export interface IRConstantDeclaration {
  kind: 'constant_declaration';
  type: string;
  name: string;
  value: IRExpr;
}

export interface IRArray2DDeclaration {
  kind: 'array2d_declaration';
  type: string;
  name: string;
  rows: IRExpr;
  cols: IRExpr;
}

export interface IRArray2DAssignment {
  kind: 'array2d_assignment';
  name: string;
  row: IRExpr;
  col: IRExpr;
  value: IRExpr;
}

export interface IRArray2DAccess {
  kind: 'array2d_access';
  name: string;
  row: IRExpr;
  col: IRExpr;
}

export interface IRCollectionDeclaration {
  kind: 'collection_declaration';
  /** java.util class, e.g. LinkedList, HashSet, Stack, ArrayDeque. */
  collectionType: string;
  elementType: string;
  name: string;
}

export interface IRCharLiteral {
  kind: 'char';
  value: string;
}

export interface IRNull {
  kind: 'null';
}

export interface IRSuperRef {
  kind: 'super_ref';
}

/** Call to a fixed library function picked from a dropdown, e.g. Math.max or Collections.sort. */
export interface IRStaticCall {
  kind: 'static_call';
  callee: string;
  args: IRExpr[];
}

/** Library constant picked from a dropdown, e.g. Math.PI or Integer.MAX_VALUE. */
export interface IRConstant {
  kind: 'constant';
  code: string;
}

export interface IRInstanceOf {
  kind: 'instance_of';
  expr: IRExpr;
  className: string;
  /** Pattern matching: `x instanceof Perro p`. */
  bindName?: string;
}

/** An expression used as a statement, e.g. Collections.sort(lista); */
export interface IRExprStatement {
  kind: 'expr_statement';
  expr: IRExpr;
}

/** A loop with a label, so break/continue can leave an outer loop. */
export interface IRLabeled {
  kind: 'labeled';
  label: string;
  body: IRNode[];
}

export interface IRJumpLabel {
  kind: 'jump_label';
  jump: 'break' | 'continue';
  label: string;
}

export interface IRAssert {
  kind: 'assert';
  condition: IRExpr;
  message?: IRExpr;
}

export interface IRArrowCase {
  /** Undefined is the default branch. */
  value?: IRExpr;
  body: IRNode[];
}

export interface IRSwitchArrow {
  kind: 'switch_arrow';
  expr: IRExpr;
  cases: IRArrowCase[];
}

export interface IRSwitchExpr {
  kind: 'switch_expr';
  expr: IRExpr;
  cases: { value?: IRExpr; result: IRExpr }[];
}

export interface IRRecordDefinition {
  kind: 'record_definition';
  name: string;
  components: IRParameter[];
}

export interface IRLambdaBlock {
  kind: 'lambda_block';
  params: string[];
  body: IRNode[];
}

/** Clase::metodo or objeto::metodo. */
export interface IRMethodRef {
  kind: 'method_ref';
  target: string;
  method: string;
}

export interface IRTextBlock {
  kind: 'text_block';
  lines: string[];
}

export interface IRAnonymousClass {
  kind: 'anonymous_class';
  className: string;
  methods: IRFunctionDefinition[];
}
