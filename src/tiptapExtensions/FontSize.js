// 파일: src/tiptapExtensions/FontSize.js (수정 완료)

import { Mark, getMarkAttributes } from '@tiptap/core';
import { TextStyle } from '@tiptap/extension-text-style'; // ▼▼▼ 이 import를 최상단으로 이동 ▼▼▼

export const FontSize = Mark.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
        renderHTML: attributes => {
          if (!attributes.fontSize) {
            return {};
          }
          return {
            style: `font-size: ${attributes.fontSize}`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        style: 'font-size',
        getAttrs: value => ({ fontSize: value }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },

  addCommands() {
    return {
      setFontSize: (fontSize) => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run();
      },
    };
  },
});

// TextStyle 확장을 수정하여 fontSize 속성을 포함하도록 합니다.
// 이렇게 하면 Tiptap이 fontSize를 텍스트 스타일의 일부로 인식하게 됩니다.
TextStyle.configure({
    HTMLAttributes: {
        class: null,
    },
});

export default FontSize;