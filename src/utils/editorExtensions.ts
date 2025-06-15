// tiptap extensions configurations:
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

export const basicExtensions = [
  Document,
  Paragraph,
  Text,
  Bold,
  Italic,
  Heading.configure({
    levels: [1, 2, 3],
  }),
  History,
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
]
