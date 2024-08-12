/* eslint-disable jest/no-conditional-expect */
import {
  type Value,
  createTEditor,
  getEndPoint,
  getStartPoint,
} from '@udecode/slate';

import { withPlate } from '../../react/editor/withPlate';
import {
  DOMPlugin,
  DebugPlugin,
  DeserializeAstPlugin,
  DeserializeHtmlPlugin,
  EventEditorPlugin,
  HistoryPlugin,
  InlineVoidPlugin,
  InsertDataPlugin,
  LengthPlugin,
  type LengthPluginOptions,
  type PlatePlugin,
  SlateNextPlugin,
  createPlugin,
  getPlugin,
  withSlate,
} from '../index';

const coreKeys = [
  'root',
  DebugPlugin.key,
  SlateNextPlugin.key,
  DOMPlugin.key,
  HistoryPlugin.key,
  'plateApi',
  InlineVoidPlugin.key,
  InsertDataPlugin.key,
  EventEditorPlugin.key,
  LengthPlugin.key,
  DeserializeHtmlPlugin.key,
  DeserializeAstPlugin.key,
];

describe('withPlate', () => {
  describe('when default plugins', () => {
    it('should have core plugins', () => {
      const editor = withPlate(createTEditor(), { id: '1' });

      expect(editor.id).toBe('1');
      expect(editor.history).toBeDefined();
      expect(editor.key).toBeDefined();
      expect(editor.pluginList.map((plugin) => plugin.key)).toEqual(coreKeys);
      expect(editor.pluginList.map((plugin) => plugin.type)).toEqual(coreKeys);
      expect(Object.keys(editor.plugins)).toEqual(coreKeys);
    });
  });

  describe('when plugins is an array', () => {
    it('should add custom plugins to core plugins', () => {
      const customPlugin = createPlugin({ key: 'custom' });
      const editor = withPlate(createTEditor(), {
        id: '1',
        plugins: [customPlugin],
      });

      expect(editor.pluginList.map((plugin) => plugin.key)).toEqual([
        ...coreKeys,
        'custom',
      ]);
      expect(getPlugin(editor, 'custom')).toEqual(customPlugin);
    });
  });

  describe('when plugins is an empty array', () => {
    it('should only have core plugins', () => {
      const editor = withPlate<Value, PlatePlugin>(createTEditor(), {
        id: '1',
        plugins: [],
      });

      expect(editor.pluginList.map((plugin) => plugin.key)).toEqual(coreKeys);
    });
  });

  describe('when extending nested plugins', () => {
    it('should correctly merge and extend nested plugins', () => {
      const parentPlugin = createPlugin({
        key: 'parent',
        plugins: [
          createPlugin({
            key: 'child',
            type: 'childOriginal',
          }),
        ],
        type: 'parentOriginal',
      });

      const editor = withPlate(createTEditor(), {
        id: '1',
        plugins: [
          parentPlugin
            .extend({
              type: 'parentExtended',
            })
            .extendPlugin('child', {
              type: 'childExtended',
            })
            .extendPlugin('newChild', {
              type: 'newChildType',
            }),
        ],
      });

      const parent = getPlugin(editor, 'parent');
      const child = getPlugin(editor, 'child');
      const newChild = getPlugin(editor, 'newChild');

      expect(parent.type).toBe('parentExtended');
      expect(child.type).toBe('childExtended');
      expect(newChild.type).toBe('newChildType');
    });
  });

  describe('when using override', () => {
    it('should merge components', () => {
      const HeadingPlugin = createPlugin({ key: 'h1' });
      const customComponent = () => null;

      const editor = withPlate(createTEditor(), {
        id: '1',
        override: {
          components: {
            h1: customComponent,
          },
        },
        plugins: [HeadingPlugin],
      });

      const h1Plugin = getPlugin(editor, 'h1');
      expect(h1Plugin.component).toBe(customComponent);
    });

    it('should respect priority when overriding existing components', () => {
      const originalComponent = () => null;
      const overrideComponent = () => null;
      const HeadingPlugin = createPlugin({
        component: originalComponent,
        key: 'h1',
        priority: 100,
      });

      // Test with low priority override
      let editor = withPlate(createTEditor(), {
        id: '1',
        plugins: [HeadingPlugin],
      });

      let h1Plugin = getPlugin(editor, 'h1');
      expect(h1Plugin.component).toBe(originalComponent);

      // Test with high priority override
      editor = withPlate(createTEditor(), {
        id: '1',
        override: {
          components: {
            h1: overrideComponent,
          },
        },
        plugins: [HeadingPlugin],
      });

      h1Plugin = getPlugin(editor, 'h1');
      expect(h1Plugin.component).toBe(overrideComponent);
    });
  });

  describe('when using override.plugins', () => {
    it('should override plugin properties', () => {
      const CustomPlugin = createPlugin({
        key: 'custom',
        type: 'originalType',
      });

      const editor = withPlate(createTEditor(), {
        id: '1',
        override: {
          plugins: {
            custom: {
              type: 'overriddenType',
            },
          },
        },
        plugins: [CustomPlugin],
      });

      const customPlugin = getPlugin(editor, 'custom');
      expect(customPlugin.type).toBe('overriddenType');
    });
  });

  describe('when editor already has plugins', () => {
    it('should not duplicate core plugins', () => {
      const existingEditor = createTEditor();
      existingEditor.plugins = [
        createPlugin({ key: 'dom' }),
        createPlugin({ key: 'history' }),
      ];

      const editor = withPlate(existingEditor, { id: '1' });

      const pluginKeys = editor.pluginList.map((plugin) => plugin.key);
      expect(pluginKeys.filter((key) => key === 'dom')).toHaveLength(1);
      expect(pluginKeys.filter((key) => key === 'history')).toHaveLength(1);
    });

    it('should add missing core plugins', () => {
      const existingEditor = createTEditor();
      existingEditor.pluginList = [
        createPlugin({ key: 'dom' }),
        createPlugin({ key: 'history' }),
      ];

      const editor = withPlate(existingEditor, { id: '1' });

      const pluginKeys = editor.pluginList.map((plugin) => plugin.key);
      coreKeys.forEach((key) => {
        expect(pluginKeys).toContain(key);
      });
    });

    it('should not preserve custom plugins', () => {
      const customPlugin = createPlugin({ key: 'custom' });
      const existingEditor = createTEditor();
      existingEditor.plugins = [
        createPlugin({ key: 'dom' }),
        createPlugin({ key: 'history' }),
        customPlugin,
      ];

      const editor = withPlate(existingEditor, { id: '1' });

      expect(editor.pluginList.map((plugin) => plugin.key)).not.toContain(
        'custom'
      );
    });
  });

  describe('when using override.enabled', () => {
    it('should disable specified core plugins', () => {
      const editor = withPlate(createTEditor(), {
        id: '1',
        override: {
          enabled: {
            eventEditor: false,
            history: false,
          },
        },
      });

      const pluginKeys = editor.pluginList.map((plugin) => plugin.key);
      expect(pluginKeys).not.toContain('history');
      expect(pluginKeys).not.toContain('eventEditor');
      expect(pluginKeys).toHaveLength(coreKeys.length - 2);
    });

    it('should disable specified custom plugins', () => {
      const customPlugin1 = createPlugin({ key: 'custom1' });
      const customPlugin2 = createPlugin({ key: 'custom2' });

      const editor = withPlate(createTEditor(), {
        id: '1',
        override: {
          enabled: {
            custom1: false,
          },
        },
        plugins: [customPlugin1, customPlugin2],
      });

      const pluginKeys = editor.pluginList.map((plugin) => plugin.key);
      expect(pluginKeys).not.toContain('custom1');
      expect(pluginKeys).toContain('custom2');
    });

    it('should not affect plugins not specified in override.enabled', () => {
      const editor = withPlate(createTEditor(), {
        id: '1',
        override: {
          enabled: {
            history: false,
          },
        },
      });

      const pluginKeys = editor.pluginList.map((plugin) => plugin.key);
      coreKeys.forEach((key) => {
        if (key !== 'history') {
          expect(pluginKeys).toContain(key);
        }
      });
    });
  });

  describe('when configuring core plugins', () => {
    it('should correctly configure the length plugin', () => {
      const editor = withPlate(createTEditor(), {
        id: '1',
        rootPlugin: (plugin) =>
          plugin.configurePlugin('length', {
            maxLength: 100,
          }),
      });

      const lengthPlugin = getPlugin<LengthPluginOptions>(editor, 'length');
      expect(lengthPlugin.options.maxLength).toBe(100);
    });
  });

  it('should handle value, selection, and autoSelect options correctly', () => {
    const editor = createTEditor();
    const value = [{ children: [{ text: 'Hello' }], type: 'paragraph' }];
    const selection = {
      anchor: { offset: 2, path: [0, 0] },
      focus: { offset: 4, path: [0, 0] },
    };

    const result = withSlate(editor, {
      selection,
      shouldNormalizeEditor: true,
      value,
    });

    expect(result.children).toEqual(value);
    expect(result.selection).toEqual(selection);

    // Test autoSelect start
    const editorWithAutoSelectStart = withSlate(createTEditor(), {
      autoSelect: 'start',
      value,
    });
    const expectedStartSelection = {
      anchor: getStartPoint(editorWithAutoSelectStart, []),
      focus: getStartPoint(editorWithAutoSelectStart, []),
    };
    expect(editorWithAutoSelectStart.selection).toEqual(expectedStartSelection);

    // Test autoSelect end
    const editorWithAutoSelectEnd = withSlate(createTEditor(), {
      autoSelect: 'end',
      value,
    });
    const expectedEndSelection = {
      anchor: getEndPoint(editorWithAutoSelectEnd, []),
      focus: getEndPoint(editorWithAutoSelectEnd, []),
    };
    expect(editorWithAutoSelectEnd.selection).toEqual(expectedEndSelection);

    // Test empty children
    const editorWithEmptyChildren = withSlate(createTEditor());
    expect(editorWithEmptyChildren.children).toEqual(
      editorWithEmptyChildren.api.childrenFactory()
    );

    // Test pipeNormalizeInitialValue and normalizeEditor
    const editor2 = withSlate(createTEditor(), {
      shouldNormalizeEditor: true,
      value: [],
    });

    expect(editor2.children).toEqual([
      {
        children: [
          {
            text: '',
          },
        ],
        type: 'p',
      },
    ]);
  });
});
