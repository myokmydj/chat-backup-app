// File: src/tiptapExtensions/Comment.js (새 파일)

import { Mark } from '@tiptap/core';

export const Comment = Mark.create({
  name: 'comment',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      comment: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment]',
        getAttrs: element => {
          const comment = element.getAttribute('data-comment');
          // comment 속성이 존재할 경우에만 마크를 생성합니다.
          return comment ? { comment } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // 렌더링 시 주석 내용을 data-comment 속성에 담고, 스타일링을 위한 클래스를 추가합니다.
    return [
      'span',
      {
        class: 'comment-highlight',
        'data-comment': HTMLAttributes.comment,
      },
      0, // 마크가 적용된 콘텐츠가 위치할 곳입니다.
    ];
  },

  addCommands() {
    return {
      setComment: attributes => ({ commands }) => {
        return commands.setMark(this.name, attributes);
      },
      toggleComment: attributes => ({ commands }) => {
        return commands.toggleMark(this.name, attributes);
      },
      unsetComment: () => ({ commands }) => {
        // 선택 영역 없이 커서만 있어도 마크를 제거할 수 있도록 합니다.
        return commands.unsetMark(this.name, { extendEmptyMarkRange: true });
      },
    };
  },
});

export default Comment;