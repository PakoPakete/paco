// API de VS Code dentro de la webview
const vscode = acquireVsCodeApi();

let workspace = null;
let translateTimeout = null;

window.addEventListener('load', () => {
  // Limpiar workspace anterior en caso de que exista
  if (workspace) {
    try {
      workspace.dispose();
    } catch (e) {
      console.error('Error disposing workspace:', e);
    }
  }

  const blocklyDiv = document.getElementById('blocklyDiv');
  const toolbox = {
    kind: 'categoryToolbox',
    contents: [

      // EVENTOS / INICIO=
      {
        kind: 'category',
        name: ' Eventos',
        colour: '#4A90E2',
        contents: [
          { kind: 'block', type: 'event_green_flag' },
          { kind: 'block', type: 'event_broadcast' },
          { kind: 'block', type: 'event_broadcast_wait' },
          { kind: 'block', type: 'event_when_receive' },
          { kind: 'block', type: 'comment_block' },
        ]
      },

      //  CONTROL DE FLUJO

      {
        kind: 'category',
        name: ' Control',
        colour: '#5CA65C',
        contents: [
          { kind: 'block', type: 'controls_wait_seconds' },
          { kind: 'block', type: 'controls_repeat_ext' },
          { kind: 'block', type: 'controls_forever' },
          { kind: 'block', type: 'controls_if' },
          { kind: 'block', type: 'controls_whileUntil' },
          { kind: 'block', type: 'controls_wait_until' },
          { kind: 'block', type: 'controls_for' },
          { kind: 'block', type: 'controls_for_infinite' },
          { kind: 'block', type: 'controls_switch' },
          { kind: 'block', type: 'controls_case' },
          { kind: 'block', type: 'controls_default' },
          { kind: 'block', type: 'controls_stop' },
          { kind: 'block', type: 'controls_break' },
          { kind: 'block', type: 'controls_continue' },
          { kind: 'block', type: 'controls_return' },
          { kind: 'block', type: 'ternary_operator' },
        ]
      },

      //  MANEJO DE ERRORES

      {
        kind: 'category',
        name: ' Errores',
        colour: '#DC143C',
        contents: [
          { kind: 'block', type: 'try_catch_finally' },
          { kind: 'block', type: 'throw_exception' },
        ]
      },

      //  OPERADORES MATEMÁTICOS

      {
        kind: 'category',
        name: ' Matemáticas',
        colour: '#5B67A5',
        contents: [
          { kind: 'block', type: 'math_number' },
          { kind: 'block', type: 'math_arithmetic' },
          { kind: 'block', type: 'math_random_int' },
          { kind: 'block', type: 'math_modulo' },
          { kind: 'block', type: 'math_round' },
        ]
      },

      //  OPERADORES DE COMPARACIÓN

      {
        kind: 'category',
        name: ' Comparación',
        colour: '#5B80A5',
        contents: [
          { kind: 'block', type: 'logic_compare' },
        ]
      },

      //  OPERADORES LÓGICOS

      {
        kind: 'category',
        name: ' Lógica',
        colour: '#5B80A5',
        contents: [
          { kind: 'block', type: 'logic_boolean' },
          { kind: 'block', type: 'logic_operation' },
          { kind: 'block', type: 'logic_negate' },
        ]
      },

      //  OPERADORES DE TEXTO

      {
        kind: 'category',
        name: ' Texto',
        colour: '#9370DB',
        contents: [
          { kind: 'block', type: 'text' },
          { kind: 'block', type: 'text_print' },
          { kind: 'block', type: 'text_concat' },
          { kind: 'block', type: 'text_char_at' },
          { kind: 'block', type: 'text_length' },
          { kind: 'block', type: 'text_contains' },
          { kind: 'block', type: 'text_substring' },
          { kind: 'block', type: 'text_equals' },
          { kind: 'block', type: 'text_to_int' },
          { kind: 'block', type: 'int_to_text' },
        ]
      },

      //  VARIABLES

      {
        kind: 'category',
        name: ' Variables',
        colour: '#FF8C1A',
        contents: [
          { kind: 'block', type: 'variable_declaration' },
          { kind: 'block', type: 'variable_declaration_init' },
          { kind: 'block', type: 'variable_assignment' },
          { kind: 'block', type: 'variable_change_by' },
          { kind: 'block', type: 'variable_increment' },
          { kind: 'block', type: 'variable_decrement' },
          { kind: 'block', type: 'variables_get' },
          { kind: 'block', type: 'variable_show' },
        ]
      },

      //  TIPOS DE DATOS

      {
        kind: 'category',
        name: ' Tipos',
        colour: '#FFB347',
        contents: [
          { kind: 'block', type: 'type_int' },
          { kind: 'block', type: 'type_double' },
          { kind: 'block', type: 'type_char' },
          { kind: 'block', type: 'type_boolean' },
          { kind: 'block', type: 'type_string' },
          { kind: 'block', type: 'type_void' },
          { kind: 'block', type: 'enum_definition' },
        ]
      },

      //  ARRAYS

      {
        kind: 'category',
        name: ' Arrays',
        colour: '#E67E22',
        contents: [
          { kind: 'block', type: 'array_declaration' },
          { kind: 'block', type: 'array_initialization' },
          { kind: 'block', type: 'array_access' },
          { kind: 'block', type: 'array_assignment' },
          { kind: 'block', type: 'array_length' },
        ]
      },

      //  LISTAS / COLECCIONES

      {
        kind: 'category',
        name: ' Listas',
        colour: '#E74C3C',
        contents: [
          { kind: 'block', type: 'list_declaration' },
          { kind: 'block', type: 'list_add' },
          { kind: 'block', type: 'list_remove' },
          { kind: 'block', type: 'list_clear' },
          { kind: 'block', type: 'list_insert' },
          { kind: 'block', type: 'list_set' },
          { kind: 'block', type: 'list_get' },
          { kind: 'block', type: 'list_size' },
          { kind: 'block', type: 'list_contains' },
          { kind: 'block', type: 'map_declaration' },
          { kind: 'block', type: 'map_put' },
          { kind: 'block', type: 'map_get' },
          { kind: 'block', type: 'map_remove' },
          { kind: 'block', type: 'map_contains_key' },
        ]
      },

      //  FUNCIONES / MÉTODOS

      {
        kind: 'category',
        name: ' Funciones',
        colour: '#16A085',
        contents: [
          { kind: 'block', type: 'function_definition' },
          { kind: 'block', type: 'void_function_definition' },
          { kind: 'block', type: 'function_parameter' },
          { kind: 'block', type: 'function_call' },
          { kind: 'block', type: 'function_return_value' },
        ]
      },

      //  PROGRAMACIÓN ORIENTADA A OBJETOS

      {
        kind: 'category',
        name: ' OOP',
        colour: '#8E44AD',
        contents: [
          { kind: 'block', type: 'class_definition' },
          { kind: 'block', type: 'class_extends' },
          { kind: 'block', type: 'interface_definition' },
          { kind: 'block', type: 'class_implements' },
          { kind: 'block', type: 'attribute_declaration' },
          { kind: 'block', type: 'constructor_definition' },
          { kind: 'block', type: 'method_definition' },
          { kind: 'block', type: 'method_override' },
          { kind: 'block', type: 'object_instantiation' },
          { kind: 'block', type: 'this_reference' },
        ]
      },

      //  FUNCIONAL / GENÉRICOS

      {
        kind: 'category',
        name: ' Funcional',
        colour: '#1ABC9C',
        contents: [
          { kind: 'block', type: 'lambda_function' },
          { kind: 'block', type: 'stream_filter' },
          { kind: 'block', type: 'generic_function' },
        ]
      },

      //  CONCURRENCIA Y PARALELISMO

      {
        kind: 'category',
        name: ' Concurrencia',
        colour: '#F39C12',
        contents: [
          { kind: 'block', type: 'thread_create' },
          { kind: 'block', type: 'synchronized_block' },
          { kind: 'block', type: 'parallel_exec' },
        ]
      },

      //  ENTRADA / SALIDA

      {
        kind: 'category',
        name: ' E/S',
        colour: '#1E90FF',
        contents: [
          { kind: 'block', type: 'input_read_int' },
          { kind: 'block', type: 'input_read_string' },
          { kind: 'block', type: 'input_read_double' },
          { kind: 'block', type: 'file_read' },
          { kind: 'block', type: 'file_write' },
          { kind: 'block', type: 'url_connection' },
          { kind: 'block', type: 'encrypt_decrypt' },
          { kind: 'block', type: 'db_connect' },
        ]
      },

      //  TIEMPO / SISTEMA

      {
        kind: 'category',
        name: ' Sistema',
        colour: '#95A5A6',
        contents: [
          { kind: 'block', type: 'system_timer' },
          { kind: 'block', type: 'system_reset_timer' },
        ]
      },

      //  LIBRERÍAS Y ECOSISTEMA

      {
        kind: 'category',
        name: ' Librerías',
        colour: '#2ECC71',
        contents: [
          { kind: 'block', type: 'import_library' },
          { kind: 'block', type: 'desktop_app' },
          { kind: 'block', type: 'mobile_app' },
          { kind: 'block', type: 'web_service' },
        ]
      },

      //  EJECUCIÓN AVANZADA

      {
        kind: 'category',
        name: ' Avanzado',
        colour: '#7F8C8D',
        contents: [
          { kind: 'block', type: 'reflection' },
          { kind: 'block', type: 'garbage_collect' },
          { kind: 'block', type: 'interop_language' },
        ]
      },
    ]
  };

  // Override prompt para que funcione en webviews de VS Code
  Blockly.dialog.setPrompt(function (message, defaultValue, callback) {
    vscode.postMessage({ type: 'PROMPT', payload: { message, defaultValue } });
    const handler = (event) => {
      if (event.data && event.data.type === 'PROMPT_RESPONSE') {
        window.removeEventListener('message', handler);
        callback(event.data.payload);
      }
    };
    window.addEventListener('message', handler);
  });


  // DEFINICIONES DE BLOQUES PERSONALIZADOS



  //  EVENTOS / INICIO


  Blockly.Blocks['event_green_flag'] = {
    init: function() {
      this.appendDummyInput().appendField(' cuando bandera verde presionada');
      this.setNextStatement(true);
      this.setColour(60);
      this.setTooltip('Punto de entrada del programa (public static void main)');
    }
  };

  Blockly.Blocks['event_broadcast'] = {
    init: function() {
      this.appendDummyInput().appendField('enviar mensaje').appendField(new Blockly.FieldTextInput('mensaje'), 'MESSAGE');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(60);
      this.setTooltip('Llama a un método por su nombre');
    }
  };

  Blockly.Blocks['event_broadcast_wait'] = {
    init: function() {
      this.appendDummyInput().appendField('enviar mensaje').appendField(new Blockly.FieldTextInput('mensaje'), 'MESSAGE').appendField('y esperar');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(60);
      this.setTooltip('Llama a un método y espera a que termine');
    }
  };

  Blockly.Blocks['event_when_receive'] = {
    init: function() {
      this.appendDummyInput().appendField('al recibir').appendField(new Blockly.FieldTextInput('mensaje'), 'MESSAGE');
      this.appendStatementInput('BODY').appendField('hacer');
      this.setColour(60);
      this.setTooltip('Define un método que se puede llamar con broadcast');
    }
  };

  Blockly.Blocks['comment_block'] = {
    init: function() {
      this.appendDummyInput().appendField('//').appendField(new Blockly.FieldTextInput('comentario'), 'COMMENT');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
    }
  };


  //  CONTROL DE FLUJO


  Blockly.Blocks['controls_wait_seconds'] = {
    init: function() {
      this.appendValueInput('SECONDS').setCheck('Number').appendField('esperar');
      this.appendDummyInput().appendField('segundos');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(120);
      this.setTooltip('Thread.sleep(millis)');
    }
  };

  Blockly.Blocks['controls_forever'] = {
    init: function() {
      this.appendStatementInput('DO').appendField('por siempre');
      this.setPreviousStatement(true);
      this.setColour(120);
      this.setTooltip('while (true) { ... }');
    }
  };

  Blockly.Blocks['controls_for'] = {
    init: function() {
      this.appendDummyInput().appendField('for').appendField(new Blockly.FieldTextInput('i'), 'VAR').appendField('=');
      this.appendValueInput('FROM').setCheck('Number');
      this.appendDummyInput().appendField('hasta');
      this.appendValueInput('TO').setCheck('Number');
      this.appendDummyInput().appendField('paso');
      this.appendValueInput('BY').setCheck('Number');
      this.appendStatementInput('DO').appendField('hacer');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(120);
    }
  };

  Blockly.Blocks['controls_for_infinite'] = {
    init: function() {
      this.appendStatementInput('DO').appendField('for (infinito)');
      this.setPreviousStatement(true);
      this.setColour(120);
      this.setTooltip('for (;;) { ... }');
    }
  };

  Blockly.Blocks['controls_switch'] = {
    init: function() {
      this.appendValueInput('EXPR').appendField('switch');
      this.appendStatementInput('CASES').appendField('casos');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(120);
    }
  };

  Blockly.Blocks['controls_case'] = {
    init: function() {
      this.appendValueInput('CASE').appendField('caso');
      this.appendStatementInput('STATEMENT').appendField('hacer');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(120);
    }
  };

  Blockly.Blocks['controls_default'] = {
    init: function() {
      this.appendStatementInput('STATEMENT').appendField('default');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(120);
    }
  };

  Blockly.Blocks['controls_wait_until'] = {
    init: function() {
      this.appendValueInput('CONDITION').setCheck('Boolean').appendField('esperar hasta que');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(120);
      this.setTooltip('while (!condición) { Thread.sleep(10); }');
    }
  };

  Blockly.Blocks['controls_stop'] = {
    init: function() {
      this.appendDummyInput().appendField('detener ').appendField(
        new Blockly.FieldDropdown([['todo', 'ALL'], ['este script', 'THIS']]), 'MODE'
      );
      this.setPreviousStatement(true);
      this.setColour(120);
      this.setTooltip('System.exit(0) o return');
    }
  };

  Blockly.Blocks['controls_break'] = {
    init: function() {
      this.appendDummyInput().appendField('break');
      this.setPreviousStatement(true);
      this.setColour(120);
    }
  };

  Blockly.Blocks['controls_continue'] = {
    init: function() {
      this.appendDummyInput().appendField('continue');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(120);
    }
  };

  Blockly.Blocks['controls_return'] = {
    init: function() {
      this.appendValueInput('VALUE').appendField('return');
      this.setPreviousStatement(true);
      this.setColour(120);
    }
  };

  Blockly.Blocks['ternary_operator'] = {
    init: function() {
      this.appendValueInput('CONDITION').appendField('si');
      this.appendValueInput('IF_TRUE').appendField('? ');
      this.appendValueInput('IF_FALSE').appendField(': ');
      this.setOutput(true);
      this.setColour(120);
      this.setTooltip('condición ? valor1 : valor2');
    }
  };


  //  MANEJO DE ERRORES


  Blockly.Blocks['try_catch_finally'] = {
    init: function() {
      this.appendStatementInput('TRY').appendField('try');
      this.appendDummyInput().appendField('catch (').appendField(new Blockly.FieldTextInput('Exception'), 'CATCH_TYPE')
        .appendField(new Blockly.FieldTextInput('e'), 'CATCH_VAR').appendField(')');
      this.appendStatementInput('CATCH').appendField('hacer');
      this.appendStatementInput('FINALLY').appendField('finally');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(0);
    }
  };

  Blockly.Blocks['throw_exception'] = {
    init: function() {
      this.appendValueInput('EXCEPTION').appendField('throw new');
      this.setPreviousStatement(true);
      this.setColour(0);
    }
  };

  //  OPERADORES MATEMÁTICOS


  Blockly.Blocks['math_modulo'] = {
    init: function() {
      this.appendValueInput('A');
      this.appendValueInput('B').appendField('mod');
      this.setOutput(true, 'Number');
      this.setColour(230);
      this.setTooltip('a % b');
    }
  };

  Blockly.Blocks['math_round'] = {
    init: function() {
      this.appendValueInput('NUM').appendField('redondear');
      this.setOutput(true, 'Number');
      this.setColour(230);
      this.setTooltip('Math.round(x)');
    }
  };

  //  TEXTO


  Blockly.Blocks['text_concat'] = {
    init: function() {
      this.appendValueInput('A').appendField('unir');
      this.appendValueInput('B');
      this.setOutput(true);
      this.setColour(160);
      this.setTooltip('Concatenar dos textos');
    }
  };

  Blockly.Blocks['text_char_at'] = {
    init: function() {
      this.appendValueInput('INDEX').appendField('letra');
      this.appendValueInput('TEXT').appendField('de');
      this.setOutput(true);
      this.setColour(160);
      this.setTooltip('text.charAt(index)');
    }
  };

  Blockly.Blocks['text_length'] = {
    init: function() {
      this.appendValueInput('TEXT').appendField('longitud de');
      this.setOutput(true);
      this.setColour(160);
    }
  };

  Blockly.Blocks['text_contains'] = {
    init: function() {
      this.appendValueInput('TEXT');
      this.appendValueInput('SEARCH').appendField('contiene');
      this.setOutput(true, 'Boolean');
      this.setColour(160);
      this.setTooltip('text.contains(search)');
    }
  };

  Blockly.Blocks['text_substring'] = {
    init: function() {
      this.appendValueInput('TEXT').appendField('subcadena de');
      this.appendValueInput('START').appendField('desde');
      this.appendValueInput('END').appendField('hasta');
      this.setOutput(true);
      this.setColour(160);
    }
  };

  Blockly.Blocks['text_equals'] = {
    init: function() {
      this.appendValueInput('A').appendField('texto');
      this.appendValueInput('B').appendField('equals');
      this.setOutput(true);
      this.setColour(160);
    }
  };

  Blockly.Blocks['text_to_int'] = {
    init: function() {
      this.appendValueInput('TEXT').appendField('parse int');
      this.setOutput(true);
      this.setColour(160);
    }
  };

  Blockly.Blocks['int_to_text'] = {
    init: function() {
      this.appendValueInput('NUM').appendField('to string');
      this.setOutput(true);
      this.setColour(160);
    }
  };


  //  VARIABLES


  Blockly.Blocks['variable_declaration'] = {
    init: function() {
      this.appendValueInput('TYPE').setCheck('Type').appendField('declarar');
      this.appendDummyInput().appendField(new Blockly.FieldTextInput('nombre'), 'VAR');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(330);
    }
  };

  Blockly.Blocks['variable_declaration_init'] = {
    init: function() {
      this.appendValueInput('TYPE').setCheck('Type').appendField('declarar');
      this.appendDummyInput().appendField(new Blockly.FieldTextInput('nombre'), 'VAR');
      this.appendValueInput('VALUE').appendField('=');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(330);
    }
  };

  Blockly.Blocks['variable_assignment'] = {
    init: function() {
      this.appendDummyInput().appendField('set').appendField(new Blockly.FieldTextInput('variable'), 'VAR');
      this.appendValueInput('VALUE').appendField('=');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(330);
    }
  };

  Blockly.Blocks['variable_change_by'] = {
    init: function() {
      this.appendDummyInput().appendField('cambiar').appendField(new Blockly.FieldTextInput('variable'), 'VAR');
      this.appendValueInput('VALUE').appendField('por');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(330);
      this.setTooltip('variable += valor');
    }
  };

  Blockly.Blocks['variable_increment'] = {
    init: function() {
      this.appendDummyInput().appendField(new Blockly.FieldTextInput('variable'), 'VAR').appendField('++');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(330);
    }
  };

  Blockly.Blocks['variable_decrement'] = {
    init: function() {
      this.appendDummyInput().appendField(new Blockly.FieldTextInput('variable'), 'VAR').appendField('--');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(330);
    }
  };

  Blockly.Blocks['variable_show'] = {
    init: function() {
      this.appendDummyInput().appendField('mostrar variable').appendField(new Blockly.FieldTextInput('variable'), 'VAR');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(330);
      this.setTooltip('System.out.println(variable)');
    }
  };


  //  TIPOS DE DATOS


  Blockly.Blocks['type_int'] = {
    init: function() {
      this.appendDummyInput().appendField('int');
      this.setOutput(true, 'Type');
      this.setColour(230);
    }
  };

  Blockly.Blocks['type_double'] = {
    init: function() {
      this.appendDummyInput().appendField('double');
      this.setOutput(true, 'Type');
      this.setColour(230);
    }
  };

  Blockly.Blocks['type_boolean'] = {
    init: function() {
      this.appendDummyInput().appendField('boolean');
      this.setOutput(true, 'Type');
      this.setColour(230);
    }
  };

  Blockly.Blocks['type_string'] = {
    init: function() {
      this.appendDummyInput().appendField('String');
      this.setOutput(true, 'Type');
      this.setColour(230);
    }
  };

  Blockly.Blocks['type_char'] = {
    init: function() {
      this.appendDummyInput().appendField('char');
      this.setOutput(true, 'Type');
      this.setColour(230);
    }
  };

  Blockly.Blocks['type_void'] = {
    init: function() {
      this.appendDummyInput().appendField('void');
      this.setOutput(true, 'Type');
      this.setColour(230);
    }
  };

  Blockly.Blocks['enum_definition'] = {
    init: function() {
      this.appendDummyInput().appendField('enum').appendField(new Blockly.FieldTextInput('MiEnum'), 'NAME');
      this.appendDummyInput().appendField('valores:').appendField(new Blockly.FieldTextInput('A, B, C'), 'VALUES');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(230);
    }
  };


  //  ARRAYS


  Blockly.Blocks['array_declaration'] = {
    init: function() {
      this.appendValueInput('TYPE').setCheck('Type').appendField('declarar array');
      this.appendDummyInput().appendField(new Blockly.FieldTextInput('arr'), 'VAR');
      this.appendValueInput('SIZE').appendField('tamaño');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(60);
    }
  };

  Blockly.Blocks['array_initialization'] = {
    init: function() {
      this.appendValueInput('TYPE').setCheck('Type').appendField('inicializar array');
      this.appendDummyInput().appendField(new Blockly.FieldTextInput('arr'), 'VAR');
      this.appendDummyInput().appendField('con valores:').appendField(new Blockly.FieldTextInput('1, 2, 3'), 'VALUES');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(60);
    }
  };

  Blockly.Blocks['array_access'] = {
    init: function() {
      this.appendDummyInput().appendField(new Blockly.FieldTextInput('arr'), 'VAR');
      this.appendValueInput('INDEX').appendField('[');
      this.appendDummyInput().appendField(']');
      this.setOutput(true);
      this.setColour(60);
    }
  };

  Blockly.Blocks['array_assignment'] = {
    init: function() {
      this.appendDummyInput().appendField(new Blockly.FieldTextInput('arr'), 'VAR');
      this.appendValueInput('INDEX').appendField('[');
      this.appendDummyInput().appendField(']');
      this.appendValueInput('VALUE').appendField('=');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(60);
    }
  };

  Blockly.Blocks['array_length'] = {
    init: function() {
      this.appendDummyInput().appendField(new Blockly.FieldTextInput('arr'), 'VAR').appendField('.length');
      this.setOutput(true, 'Number');
      this.setColour(60);
    }
  };


  //  LISTAS / COLECCIONES


  Blockly.Blocks['list_declaration'] = {
    init: function() {
      this.appendDummyInput().appendField('crear lista <').appendField(
        new Blockly.FieldDropdown([['Integer','Integer'],['String','String'],['Double','Double'],['Boolean','Boolean']]), 'ELEMENT_TYPE'
      ).appendField('>').appendField(new Blockly.FieldTextInput('lista'), 'NAME');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(260);
      this.setTooltip('ArrayList<Type> lista = new ArrayList<>()');
    }
  };

  Blockly.Blocks['list_add'] = {
    init: function() {
      this.appendDummyInput().appendField('añadir a').appendField(new Blockly.FieldTextInput('lista'), 'LIST');
      this.appendValueInput('VALUE');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(260);
    }
  };

  Blockly.Blocks['list_remove'] = {
    init: function() {
      this.appendValueInput('INDEX').appendField('eliminar posición');
      this.appendDummyInput().appendField('de').appendField(new Blockly.FieldTextInput('lista'), 'LIST');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(260);
    }
  };

  Blockly.Blocks['list_clear'] = {
    init: function() {
      this.appendDummyInput().appendField('borrar todo de').appendField(new Blockly.FieldTextInput('lista'), 'LIST');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(260);
    }
  };

  Blockly.Blocks['list_insert'] = {
    init: function() {
      this.appendValueInput('VALUE').appendField('insertar');
      this.appendValueInput('INDEX').appendField('en posición');
      this.appendDummyInput().appendField('de').appendField(new Blockly.FieldTextInput('lista'), 'LIST');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(260);
    }
  };

  Blockly.Blocks['list_set'] = {
    init: function() {
      this.appendValueInput('INDEX').appendField('reemplazar posición');
      this.appendDummyInput().appendField('de').appendField(new Blockly.FieldTextInput('lista'), 'LIST');
      this.appendValueInput('VALUE').appendField('con');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(260);
    }
  };

  Blockly.Blocks['list_get'] = {
    init: function() {
      this.appendValueInput('INDEX').appendField('elemento');
      this.appendDummyInput().appendField('de').appendField(new Blockly.FieldTextInput('lista'), 'LIST');
      this.setOutput(true);
      this.setColour(260);
    }
  };

  Blockly.Blocks['list_size'] = {
    init: function() {
      this.appendDummyInput().appendField('longitud de').appendField(new Blockly.FieldTextInput('lista'), 'LIST');
      this.setOutput(true, 'Number');
      this.setColour(260);
    }
  };

  Blockly.Blocks['list_contains'] = {
    init: function() {
      this.appendDummyInput().appendField(new Blockly.FieldTextInput('lista'), 'LIST');
      this.appendValueInput('VALUE').appendField('contiene');
      this.setOutput(true, 'Boolean');
      this.setColour(260);
    }
  };

  Blockly.Blocks['map_put'] = {
    init: function() {
      this.appendDummyInput().appendField('mapa').appendField(new Blockly.FieldTextInput('mapa'), 'MAP').appendField('put');
      this.appendValueInput('KEY').setCheck(null).appendField('clave');
      this.appendValueInput('VALUE').setCheck(null).appendField('valor');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(260);
      this.setTooltip('mapa.put(clave, valor)');
    }
  };

  Blockly.Blocks['map_get'] = {
    init: function() {
      this.appendDummyInput().appendField('mapa').appendField(new Blockly.FieldTextInput('mapa'), 'MAP').appendField('get');
      this.appendValueInput('KEY').setCheck(null).appendField('clave');
      this.setOutput(true, null);
      this.setColour(260);
      this.setTooltip('mapa.get(clave)');
    }
  };

  Blockly.Blocks['map_remove'] = {
    init: function() {
      this.appendDummyInput().appendField('mapa').appendField(new Blockly.FieldTextInput('mapa'), 'MAP').appendField('remove');
      this.appendValueInput('KEY').setCheck(null).appendField('clave');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(260);
      this.setTooltip('mapa.remove(clave)');
    }
  };

  Blockly.Blocks['map_contains_key'] = {
    init: function() {
      this.appendDummyInput().appendField('mapa').appendField(new Blockly.FieldTextInput('mapa'), 'MAP').appendField('containsKey');
      this.appendValueInput('KEY').setCheck(null).appendField('clave');
      this.setOutput(true, 'Boolean');
      this.setColour(260);
      this.setTooltip('mapa.containsKey(clave)');
    }
  };

  Blockly.Blocks['map_declaration'] = {
    init: function() {
      this.appendDummyInput().appendField('crear mapa <').appendField(
        new Blockly.FieldDropdown([['String','String'],['Integer','Integer']]), 'KEY_TYPE'
      ).appendField(', ').appendField(
        new Blockly.FieldDropdown([['String','String'],['Integer','Integer'],['Double','Double'],['Boolean','Boolean']]), 'VALUE_TYPE'
      ).appendField('>').appendField(new Blockly.FieldTextInput('mapa'), 'NAME');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(260);
      this.setTooltip('HashMap<K, V> mapa = new HashMap<>()');
    }
  };


  //  FUNCIONES / MÉTODOS


  Blockly.Blocks['function_definition'] = {
    init: function() {
      this.appendValueInput('RETURN_TYPE').setCheck('Type').appendField('función');
      this.appendDummyInput().appendField(new Blockly.FieldTextInput('miFuncion'), 'NAME');
      this.appendStatementInput('PARAMS').appendField('parámetros');
      this.appendStatementInput('BODY').appendField('hacer');
      this.setColour(290);
    }
  };

  Blockly.Blocks['void_function_definition'] = {
    init: function() {
      this.appendDummyInput().appendField('void función').appendField(new Blockly.FieldTextInput('miFuncion'), 'NAME');
      this.appendStatementInput('PARAMS').appendField('parámetros');
      this.appendStatementInput('BODY').appendField('hacer');
      this.setColour(290);
    }
  };

  Blockly.Blocks['function_parameter'] = {
    init: function() {
      this.appendValueInput('TYPE').setCheck('Type').appendField('parámetro');
      this.appendDummyInput().appendField(new Blockly.FieldTextInput('nombre'), 'NAME');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(290);
    }
  };

  Blockly.Blocks['function_call'] = {
    init: function() {
      this.appendDummyInput().appendField('llamar').appendField(new Blockly.FieldTextInput('miFuncion'), 'NAME');
      this.appendValueInput('ARGS').appendField('con');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(290);
    }
  };

  Blockly.Blocks['function_return_value'] = {
    init: function() {
      this.appendValueInput('VALUE').appendField('return');
      this.setPreviousStatement(true);
      this.setColour(290);
    }
  };


  //  OOP


  Blockly.Blocks['class_definition'] = {
    init: function() {
      this.appendDummyInput().appendField('clase').appendField(new Blockly.FieldTextInput('MiClase'), 'NAME');
      this.appendStatementInput('ATTRIBUTES').appendField('atributos');
      this.appendStatementInput('METHODS').appendField('métodos');
      this.setColour(0);
    }
  };

  Blockly.Blocks['class_extends'] = {
    init: function() {
      this.appendDummyInput().appendField('clase').appendField(new Blockly.FieldTextInput('Hijo'), 'NAME')
        .appendField('extiende').appendField(new Blockly.FieldTextInput('Padre'), 'PARENT');
      this.appendStatementInput('ATTRIBUTES').appendField('atributos');
      this.appendStatementInput('METHODS').appendField('métodos');
      this.setColour(0);
      this.setTooltip('Herencia de clases');
    }
  };

  Blockly.Blocks['interface_definition'] = {
    init: function() {
      this.appendDummyInput().appendField('interfaz').appendField(new Blockly.FieldTextInput('MiInterfaz'), 'NAME');
      this.appendStatementInput('METHODS').appendField('métodos');
      this.setColour(0);
    }
  };

  Blockly.Blocks['class_implements'] = {
    init: function() {
      this.appendDummyInput().appendField('clase').appendField(new Blockly.FieldTextInput('MiClase'), 'NAME')
        .appendField('implementa').appendField(new Blockly.FieldTextInput('MiInterfaz'), 'INTERFACE');
      this.appendStatementInput('ATTRIBUTES').appendField('atributos');
      this.appendStatementInput('METHODS').appendField('métodos');
      this.setColour(0);
    }
  };

  Blockly.Blocks['attribute_declaration'] = {
    init: function() {
      this.appendDummyInput().appendField(
        new Blockly.FieldDropdown([['public','public'],['private','private'],['protected','protected']]), 'MODIFIER'
      ).appendField(new Blockly.FieldDropdown([['int','int'],['double','double'],['String','String'],['boolean','boolean'],['char','char']]), 'TYPE')
        .appendField(new Blockly.FieldTextInput('nombre'), 'NAME');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(0);
    }
  };

  Blockly.Blocks['constructor_definition'] = {
    init: function() {
      this.appendDummyInput().appendField('constructor');
      this.appendStatementInput('PARAMS').appendField('parámetros');
      this.appendStatementInput('BODY').appendField('hacer');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(0);
    }
  };

  Blockly.Blocks['method_definition'] = {
    init: function() {
      this.appendDummyInput().appendField(
        new Blockly.FieldDropdown([['public','public'],['private','private'],['protected','protected']]), 'MODIFIER'
      ).appendField(new Blockly.FieldDropdown([['void','void'],['int','int'],['double','double'],['String','String'],['boolean','boolean']]), 'RETURN_TYPE')
        .appendField('método').appendField(new Blockly.FieldTextInput('miMetodo'), 'NAME');
      this.appendStatementInput('PARAMS').appendField('parámetros');
      this.appendStatementInput('BODY').appendField('hacer');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(0);
    }
  };

  Blockly.Blocks['method_override'] = {
    init: function() {
      this.appendDummyInput().appendField('@Override');
      this.appendDummyInput().appendField(
        new Blockly.FieldDropdown([['public','public'],['protected','protected']]), 'MODIFIER'
      ).appendField(new Blockly.FieldDropdown([['void','void'],['int','int'],['double','double'],['String','String'],['boolean','boolean']]), 'RETURN_TYPE')
        .appendField(new Blockly.FieldTextInput('metodo'), 'NAME');
      this.appendStatementInput('BODY').appendField('hacer');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(0);
      this.setTooltip('Sobrescribir método de la clase padre');
    }
  };

  Blockly.Blocks['object_instantiation'] = {
    init: function() {
      this.appendDummyInput().appendField('new').appendField(new Blockly.FieldTextInput('MiClase'), 'CLASS');
      this.appendValueInput('ARGS').appendField('(');
      this.appendDummyInput().appendField(')');
      this.setOutput(true);
      this.setColour(0);
    }
  };

  Blockly.Blocks['this_reference'] = {
    init: function() {
      this.appendDummyInput().appendField('this');
      this.setOutput(true);
      this.setColour(0);
    }
  };

  Blockly.Blocks['modifier_public'] = {
    init: function() {
      this.appendDummyInput().appendField('public');
      this.setOutput(true, 'Modifier');
      this.setColour(0);
    }
  };

  Blockly.Blocks['modifier_private'] = {
    init: function() {
      this.appendDummyInput().appendField('private');
      this.setOutput(true, 'Modifier');
      this.setColour(0);
    }
  };

  Blockly.Blocks['modifier_protected'] = {
    init: function() {
      this.appendDummyInput().appendField('protected');
      this.setOutput(true, 'Modifier');
      this.setColour(0);
    }
  };


  // FUNCIONAL / GENÉRICOS


  Blockly.Blocks['lambda_function'] = {
    init: function() {
      this.appendDummyInput().appendField('(').appendField(new Blockly.FieldTextInput('x'), 'PARAMS').appendField(') ->');
      this.appendValueInput('BODY');
      this.setOutput(true);
      this.setColour(180);
      this.setTooltip('Expresión lambda: (params) -> expression');
    }
  };

  Blockly.Blocks['stream_filter'] = {
    init: function() {
      this.appendDummyInput().appendField(new Blockly.FieldTextInput('lista'), 'COLLECTION')
        .appendField('.stream().filter(').appendField(new Blockly.FieldTextInput('x'), 'VAR').appendField('->');
      this.appendValueInput('CONDITION');
      this.appendDummyInput().appendField(').collect(Collectors.toList())');
      this.setOutput(true);
      this.setColour(180);
    }
  };

  Blockly.Blocks['generic_function'] = {
    init: function() {
      this.appendDummyInput().appendField('<').appendField(new Blockly.FieldTextInput('T'), 'TYPE_PARAM').appendField('>');
      this.appendDummyInput().appendField(new Blockly.FieldTextInput('T'), 'RETURN_TYPE')
        .appendField(new Blockly.FieldTextInput('miFuncion'), 'NAME');
      this.appendDummyInput().appendField('(').appendField(new Blockly.FieldTextInput('T'), 'PARAM_TYPE')
        .appendField(new Blockly.FieldTextInput('valor'), 'PARAM_NAME').appendField(')');
      this.appendStatementInput('BODY').appendField('hacer');
      this.setColour(180);
      this.setTooltip('Función genérica: <T> T func(T valor) { ... }');
    }
  };


  //  CONCURRENCIA


  Blockly.Blocks['thread_create'] = {
    init: function() {
      this.appendDummyInput().appendField('crear hilo').appendField(new Blockly.FieldTextInput('miHilo'), 'NAME');
      this.appendStatementInput('BODY').appendField('ejecutar');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(30);
      this.setTooltip('new Thread(() -> { ... }).start()');
    }
  };

  Blockly.Blocks['synchronized_block'] = {
    init: function() {
      this.appendDummyInput().appendField('synchronized (').appendField(new Blockly.FieldTextInput('lock'), 'LOCK').appendField(')');
      this.appendStatementInput('BODY').appendField('hacer');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(30);
    }
  };

  Blockly.Blocks['parallel_exec'] = {
    init: function() {
      this.appendStatementInput('TASK1').appendField('ejecutar en paralelo - tarea 1');
      this.appendStatementInput('TASK2').appendField('tarea 2');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(30);
      this.setTooltip('Ejecutar dos tareas en hilos separados');
    }
  };


  //  ENTRADA / SALIDA


  Blockly.Blocks['input_read_int'] = {
    init: function() {
      this.appendDummyInput().appendField('leer entero del teclado');
      this.setOutput(true, 'Number');
      this.setColour(45);
    }
  };

  Blockly.Blocks['input_read_string'] = {
    init: function() {
      this.appendDummyInput().appendField('leer texto del teclado');
      this.setOutput(true, 'String');
      this.setColour(45);
    }
  };

  Blockly.Blocks['input_read_double'] = {
    init: function() {
      this.appendDummyInput().appendField('leer decimal del teclado');
      this.setOutput(true, 'Number');
      this.setColour(45);
    }
  };

  Blockly.Blocks['file_read'] = {
    init: function() {
      this.appendDummyInput().appendField('leer archivo').appendField(new Blockly.FieldTextInput('archivo.txt'), 'PATH');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(45);
      this.setTooltip('Leer contenido de un archivo');
    }
  };

  Blockly.Blocks['file_write'] = {
    init: function() {
      this.appendDummyInput().appendField('escribir archivo').appendField(new Blockly.FieldTextInput('archivo.txt'), 'PATH');
      this.appendValueInput('CONTENT').appendField('contenido');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(45);
    }
  };

  Blockly.Blocks['url_connection'] = {
    init: function() {
      this.appendDummyInput().appendField('abrir conexión a').appendField(new Blockly.FieldTextInput('https://api.example.com'), 'URL');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(45);
      this.setTooltip('HttpURLConnection');
    }
  };

  Blockly.Blocks['encrypt_decrypt'] = {
    init: function() {
      this.appendDummyInput().appendField(
        new Blockly.FieldDropdown([['encriptar','ENCRYPT'],['desencriptar','DECRYPT']]), 'MODE'
      );
      this.appendValueInput('DATA').appendField('dato');
      this.appendDummyInput().appendField('clave:').appendField(new Blockly.FieldTextInput('clave'), 'KEY');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(45);
      this.setTooltip('javax.crypto.Cipher');
    }
  };

  Blockly.Blocks['db_connect'] = {
    init: function() {
      this.appendDummyInput().appendField('conectar a BD');
      this.appendDummyInput().appendField('URL:').appendField(new Blockly.FieldTextInput('jdbc:mysql://localhost:3306/db'), 'URL');
      this.appendDummyInput().appendField('usuario:').appendField(new Blockly.FieldTextInput('root'), 'USER');
      this.appendDummyInput().appendField('contraseña:').appendField(new Blockly.FieldTextInput('pass'), 'PASS');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(45);
      this.setTooltip('java.sql.DriverManager.getConnection(...)');
    }
  };

  //  TIEMPO / SISTEMA


  Blockly.Blocks['system_timer'] = {
    init: function() {
      this.appendDummyInput().appendField('⏱ timer');
      this.setOutput(true, 'Number');
      this.setColour(200);
      this.setTooltip('System.currentTimeMillis()');
    }
  };

  Blockly.Blocks['system_reset_timer'] = {
    init: function() {
      this.appendDummyInput().appendField('⏱ reiniciar timer');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(200);
      this.setTooltip('timerStart = System.currentTimeMillis()');
    }
  };


  //  LIBRERÍAS Y ECOSISTEMA

  Blockly.Blocks['import_library'] = {
    init: function() {
      this.appendDummyInput().appendField('importar').appendField(new Blockly.FieldTextInput('java.util.ArrayList'), 'LIBRARY');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(160);
    }
  };

  Blockly.Blocks['desktop_app'] = {
    init: function() {
      this.appendDummyInput().appendField('crear app de escritorio').appendField(new Blockly.FieldTextInput('Mi App'), 'TITLE');
      this.appendStatementInput('BODY').appendField('contenido');
      this.setColour(160);
      this.setTooltip('JFrame + Swing');
    }
  };

  Blockly.Blocks['mobile_app'] = {
    init: function() {
      this.appendDummyInput().appendField('crear app móvil').appendField(new Blockly.FieldTextInput('MiApp'), 'NAME');
      this.appendStatementInput('BODY').appendField('onCreate');
      this.setColour(160);
      this.setTooltip('Android Activity');
    }
  };

  Blockly.Blocks['web_service'] = {
    init: function() {
      this.appendDummyInput().appendField('crear servicio web');
      this.appendDummyInput().appendField('ruta:').appendField(new Blockly.FieldTextInput('/api/hola'), 'PATH');
      this.appendStatementInput('BODY').appendField('respuesta');
      this.setColour(160);
      this.setTooltip('Spring Boot @RestController');
    }
  };


  //  EJECUCIÓN AVANZADA


  Blockly.Blocks['reflection'] = {
    init: function() {
      this.appendDummyInput().appendField('reflexión: obtener clase de').appendField(new Blockly.FieldTextInput('MiClase'), 'CLASS');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(200);
      this.setTooltip('Class.forName("MiClase")');
    }
  };

  Blockly.Blocks['garbage_collect'] = {
    init: function() {
      this.appendDummyInput().appendField('forzar recolección de basura');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(200);
      this.setTooltip('System.gc()');
    }
  };

  Blockly.Blocks['interop_language'] = {
    init: function() {
      this.appendDummyInput().appendField('ejecutar comando:').appendField(new Blockly.FieldTextInput('python script.py'), 'COMMAND');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(200);
      this.setTooltip('ProcessBuilder / Runtime.exec');
    }
  };

  workspace = Blockly.inject(blocklyDiv, {
    toolbox: toolbox,
    scrollbars: true,
    trashcan: true,
    disable: false,
    readOnly: false
  });

  // Listener para cambios en tiempo real con debounce
  workspace.addChangeListener(() => {
    if (translateTimeout) {
      clearTimeout(translateTimeout);
    }
    translateTimeout = setTimeout(() => {
      try {
        const dom = Blockly.Xml.workspaceToDom(workspace);
        const xmlText = Blockly.Xml.domToText(dom);

        vscode.postMessage({
          type: 'TRANSLATE_JAVA',
          payload: { xml: xmlText }
        });
      } catch (error) {
        console.error('Error generating XML:', error);
      }
    }, 300); // Esperar 300ms después del último cambio
  });

  // exportBtn.addEventListener('click', () => {
  //   const dom = Blockly.Xml.workspaceToDom(workspace);
  //   const xmlText = Blockly.Xml.domToText(dom);

  //   vscode.postMessage({
  //     type: 'EXPORT_JAVA',
  //     payload: { xml: xmlText }
  //   });
  // });

  // Listener para mensajes de vuelta de la extensión
  // window.addEventListener('message', (event) => {
  //   if (event.data && event.data.type === 'JAVA_CODE') {
  //     const javaCode = document.getElementById('javaCode');
  //     javaCode.value = event.data.payload.java;
  //   }
  // });
});
