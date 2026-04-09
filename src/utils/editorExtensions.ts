// 组装本地编辑器和协同编辑器共用的 Tiptap 扩展集合。
import type { Doc as YDoc } from 'yjs'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Heading from '@tiptap/extension-heading'
import History from '@tiptap/extension-history'
import CodeBlock from '@tiptap/extension-code-block'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CharacterCount from '@tiptap/extension-character-count'
import Strike from '@tiptap/extension-strike'
import Underline from '@tiptap/extension-underline'
import { FontSize } from '@/utils/custom-extensions/fontSize'
import TextStyle from '@tiptap/extension-text-style'
import { lowlight } from 'lowlight'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import json from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'
import java from 'highlight.js/lib/languages/java'
import cpp from 'highlight.js/lib/languages/cpp'
import bash from 'highlight.js/lib/languages/bash'
import markdown from 'highlight.js/lib/languages/markdown'
import yaml from 'highlight.js/lib/languages/yaml'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import OrderedList from '@tiptap/extension-ordered-list'
import BulletList from '@tiptap/extension-bullet-list'
import ListItem from '@tiptap/extension-list-item'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'

interface EditorExtensionsOptions {
  ydoc?: YDoc
  collaborationProvider?: {
    awareness: {
      states: Map<number, unknown>
    }
  }
  collaborationUser?: {
    name: string
    color: string
  }
}

// 代码高亮语言统一在扩展工厂初始化前注册，避免编辑器重复处理。
lowlight.registerLanguage('javascript', javascript)
lowlight.registerLanguage('typescript', typescript)
lowlight.registerLanguage('html', xml)
lowlight.registerLanguage('css', css)
lowlight.registerLanguage('json', json)
lowlight.registerLanguage('python', python)
lowlight.registerLanguage('java', java)
lowlight.registerLanguage('cpp', cpp)
lowlight.registerLanguage('bash', bash)
lowlight.registerLanguage('markdown', markdown)
lowlight.registerLanguage('yaml', yaml)

function renderCollaborationCursor(user: { name?: string; color?: string }) {
  // 协同光标使用自定义 DOM，便于在样式层统一呈现用户名和颜色。
  const caret = document.createElement('span')
  caret.classList.add('collaboration-caret')
  caret.style.setProperty('--cursor-color', user.color || '#175ce6')

  const label = document.createElement('span')
  label.classList.add('collaboration-caret__label')
  label.textContent = user.name?.trim() || '协作者'

  const dot = document.createElement('span')
  dot.classList.add('collaboration-caret__dot')

  caret.append(dot, label)
  return caret
}

export function createEditorExtensions(options: EditorExtensionsOptions = {}) {
  // 本地编辑与协同编辑共用同一套基础扩展，只在状态同步能力上分叉。
  const baseExtensions = [
    Document,
    Paragraph,
    Text,
    Bold,
    Italic,
    Heading.configure({
      levels: [1, 2, 3],
    }),
    CodeBlock,
    CodeBlockLowlight.configure({
      lowlight,
    }),
    Image,
    Link,
    TaskList,
    TaskItem,
    CharacterCount,
    Strike,
    Underline,
    TextStyle,
    FontSize,
    HorizontalRule,
    OrderedList,
    BulletList,
    ListItem,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Color,
  ]

  if (options.ydoc && options.collaborationProvider) {
    return [
      ...baseExtensions,
      Collaboration.configure({
        document: options.ydoc,
        field: 'content',
      }),
      CollaborationCursor.configure({
        provider: options.collaborationProvider,
        user: options.collaborationUser,
        render: renderCollaborationCursor,
      }),
    ]
  }

  return [...baseExtensions, History]
}

export const basicExtensions = createEditorExtensions()
