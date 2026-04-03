'use client'

import { ImageUpload, ImageUploadValue } from '@/components/image-upload'
import { Label } from '@/components/ui/label'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import DOMPurify from 'isomorphic-dompurify'
import { Bold, Italic, Underline as UnderlineIcon } from 'lucide-react'
import React, { useEffect } from 'react'

const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 'p', 'br']

function sanitize(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: [] })
}

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function TextImageBlockEditor({ data, onChange }: Props) {
  const initialContent = (data.html as string) ?? (data.content as string) ?? ''

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Underline],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = sanitize(editor.getHTML())
      onChange({ ...data, html })
    },
  })

  useEffect(() => {
    if (!editor) return
    const incoming = (data.html as string) ?? (data.content as string) ?? ''
    if (editor.getHTML() !== incoming) {
      editor.commands.setContent(incoming)
    }
  }, [data.html, data.content]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleImage = (val: ImageUploadValue | null) => {
    if (val?.type === 'url') {
      onChange({ ...data, imageUrl: val.value })
    }
  }

  const ToolbarButton = ({
    onClick,
    active,
    children,
  }: {
    onClick: () => void
    active: boolean
    children: React.ReactNode
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-1.5 rounded text-sm transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-accent'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Текст</Label>
        {editor && (
          <>
            <div className="flex gap-1 p-1 border rounded-lg bg-muted/50 flex-wrap">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                active={editor.isActive('bold')}
              >
                <Bold size={14} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                active={editor.isActive('italic')}
              >
                <Italic size={14} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                active={editor.isActive('underline')}
              >
                <UnderlineIcon size={14} />
              </ToolbarButton>
            </div>
            <EditorContent
              editor={editor}
              className="min-h-[120px] border rounded-lg p-3 prose prose-sm dark:prose-invert max-w-none focus-within:border-ring"
            />
          </>
        )}
      </div>
      <ImageUpload
        label="Картинка"
        onChange={handleImage}
        previewUrl={(data.imageUrl as string) || undefined}
      />
    </div>
  )
}
