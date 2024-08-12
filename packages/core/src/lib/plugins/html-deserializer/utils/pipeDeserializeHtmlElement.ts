import type { AnyObject } from '@udecode/utils';

import type { PlateEditor } from '../../../editor';
import type { DeserializeHtml } from '../../../plugin/types/PlatePlugin';
import type { Nullable } from '../../../types/misc/Nullable';

import { pluginDeserializeHtml } from './pluginDeserializeHtml';

export const pipeDeserializeHtmlElement = (
  editor: PlateEditor,
  element: HTMLElement
) => {
  let result: ({ node: AnyObject } & Nullable<DeserializeHtml>) | undefined;

  [...editor.pluginList].reverse().some((plugin) => {
    result = pluginDeserializeHtml(editor, plugin, { element });

    return !!result;
  });

  return result;
};
