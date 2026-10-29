'use client';

import Image from '@tiptap/extension-image';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';
import { type ReactNode, useEffect, useRef } from 'react';

import { uploadFile } from '@/features/files/api/upload-file';
import { fileUrl } from '@/lib/files';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

interface RichTextEditorProps {
  /** Current html. The editor reports changes through `onChange`. */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  /** Accessible name of the editing area. */
  label: string;
  disabled?: boolean;
}

/**
 * WYSIWYG editor for subtopic descriptions (Tiptap). The html it produces is sanitized again by the
 * api before it is stored, so this component only needs to produce good html, not safe html.
 * Pictures are uploaded to the api and inserted by their file url.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  label,
  disabled,
}: RichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    // Rendering on the server would not match the browser, so the editor appears after hydration.
    immediatelyRender: false,
    editable: !disabled,
    content: value,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
      Subscript,
      Superscript,
      Image,
    ],
    editorProps: {
      attributes: {
        class: 'rich-text',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': label,
        'data-placeholder': placeholder ?? t.richText.placeholder,
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.isEmpty ? '' : current.getHTML()),
  });

  // Keep the editor in step when the parent replaces the value (loading data, switching items).
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? '' : editor.getHTML();
    if (value !== current) editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  async function insertImage(file: File) {
    if (!editor) return;
    try {
      const uploaded = await uploadFile({ file, purpose: 'image' });
      editor
        .chain()
        .focus()
        .setImage({ src: fileUrl(uploaded.id), alt: uploaded.name })
        .run();
    } catch {
      // The toolbar has no room for errors; a failed upload simply inserts nothing.
    }
  }

  function setLink() {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const href = window.prompt(t.richText.linkPrompt, previous ?? 'https://');
    if (href === null) return;
    if (href.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run();
  }

  if (!editor) {
    return (
      <div
        className={cn('bg-surface-raised border-input min-h-60 rounded-2xl border', className)}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={cn(
        'rich-text-editor bg-surface-raised border-input focus-within:border-primary overflow-hidden rounded-2xl border transition-colors',
        disabled && 'opacity-60',
        className,
      )}
    >
      <div
        role="toolbar"
        aria-label={label}
        className="border-input bg-background flex flex-wrap gap-1 border-b p-2"
      >
        <ToolButton
          label={t.richText.bold}
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold />
        </ToolButton>
        <ToolButton
          label={t.richText.italic}
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic />
        </ToolButton>
        <ToolButton
          label={t.richText.underline}
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon />
        </ToolButton>
        <ToolButton
          label={t.richText.strike}
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough />
        </ToolButton>
        <ToolButton
          label={t.richText.subscript}
          active={editor.isActive('subscript')}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
        >
          <SubscriptIcon />
        </ToolButton>
        <ToolButton
          label={t.richText.superscript}
          active={editor.isActive('superscript')}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
        >
          <SuperscriptIcon />
        </ToolButton>
        <Divider />
        <ToolButton
          label={t.richText.heading2}
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 />
        </ToolButton>
        <ToolButton
          label={t.richText.heading3}
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 />
        </ToolButton>
        <ToolButton
          label={t.richText.bulletList}
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List />
        </ToolButton>
        <ToolButton
          label={t.richText.orderedList}
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered />
        </ToolButton>
        <ToolButton
          label={t.richText.quote}
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote />
        </ToolButton>
        <Divider />
        <ToolButton label={t.richText.link} active={editor.isActive('link')} onClick={setLink}>
          <Link2 />
        </ToolButton>
        <ToolButton label={t.richText.image} onClick={() => imageInputRef.current?.click()}>
          <ImagePlus />
        </ToolButton>
        <Divider />
        <ToolButton
          label={t.richText.undo}
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 />
        </ToolButton>
        <ToolButton
          label={t.richText.redo}
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 />
        </ToolButton>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void insertImage(file);
          event.target.value = '';
        }}
      />

      <EditorContent editor={editor} className="px-4 py-3" />
    </div>
  );
}

function ToolButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      // Keeps the text selection in the editor when a toolbar button is pressed.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        'text-text-secondary hover:bg-accent hover:text-foreground flex size-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40 [&_svg]:size-4',
        active && 'bg-card text-primary',
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="bg-divider mx-1 my-1 w-px" />;
}
