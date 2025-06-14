// tiptap extensions configurations:
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Heading from '@tiptap/extension-heading'
import History from '@tiptap/extension-history'
import CodeBlock from '@tiptap/extension-code-block'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CharacterCount from '@tiptap/extension-character-count'
import Strike from '@tiptap/extension-strike'
import Underline from '@tiptap/extension-underline'
import { FontSize } from '@/utils/custom-extensions/fontSize'
import TextStyle from '@tiptap/extension-text-style'
//hightlight

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
