// File: src/components/TiptapEditor.js (수정 완료)

import React, { useEffect } from 'react';
import { useEditor, EditorContent, getMarkAttributes } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import TextStyle from '@tiptap/extension-text-style';
import { FontSize } from '../tiptapExtensions/FontSize';
import Comment from '../tiptapExtensions/Comment';

const EditorToolbar = ({ editor, onSetComment }) => {
  if (!editor) {
    return null;
  }

  const handleFontSizeChange = (e) => {
    const value = e.target.value;
    if (value) {
      editor.chain().focus().setFontSize(value).run();
    } else {
      editor.chain().focus().unsetFontSize().run();
    }
  };
  
  const handleCommentButtonClick = () => {
    if (editor.isActive('comment')) {
      editor.chain().focus().unsetComment().run();
      return;
    }
    
    if (onSetComment) {
      onSetComment(editor);
    }
  };

  const currentFontSize = getMarkAttributes(editor.state, 'textStyle').fontSize || '';

  return (
    <div className="editor-toolbar">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''} title="볼드">
        <i className="fas fa-bold"></i>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''} title="이탤릭">
        <i className="fas fa-italic"></i>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleSuperscript().run()} className={editor.isActive('superscript') ? 'is-active' : ''} title="위 첨자">
        <i className="fas fa-superscript"></i>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleSubscript().run()} className={editor.isActive('subscript') ? 'is-active' : ''} title="아래 첨자">
        <i className="fas fa-subscript"></i>
      </button>
      <button 
        type="button" 
        onClick={handleCommentButtonClick}
        className={editor.isActive('comment') ? 'is-active' : ''} 
        title="주석"
      >
        <i className="fas fa-comment-dots"></i>
      </button>
      <select value={currentFontSize} onChange={handleFontSizeChange} className="font-size-selector">
        <option value="">기본 크기</option>
        <option value="12px">12px</option>
        <option value="14px">14px</option>
        <option value="16px">16px</option>
        <option value="18px">18px</option>
        <option value="24px">24px</option>
        <option value="30px">30px</option>
      </select>
    </div>
  );
};

const TiptapEditor = ({ content, onUpdate, placeholder, onSetComment }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
      }),
      Superscript,
      Subscript,
      TextStyle,
      FontSize,
      Comment,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      if (editor.isEmpty) {
        onUpdate('');
      } else {
        onUpdate(editor.getHTML());
      }
    },
    editorProps: {
        attributes: {
            'data-placeholder': placeholder,
        },
    },
  });

  // ▼▼▼ [핵심 수정] 텍스트가 보이지 않던 문제 해결
  // 외부에서 content prop이 변경될 때 에디터의 내용을 강제로 업데이트합니다.
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // editor.commands.setContent()는 onUpdate를 다시 트리거하므로,
      // 현재 내용과 다를 때만 실행하여 무한 루프를 방지합니다.
      editor.commands.setContent(content, false); // false는 onUpdate 트리거 방지 옵션
    }
  }, [content, editor]);

  return (
    <div className="tiptap-editor-wrapper">
      <EditorToolbar editor={editor} onSetComment={onSetComment} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;