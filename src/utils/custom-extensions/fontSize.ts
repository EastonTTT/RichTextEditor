// 自定义字号扩展，基于 textStyle mark 给任意文本附加 font-size。
import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType
    }
  }
}

// 自定义字号扩展，基于 textStyle mark 给任意文本附加 font-size。
export const FontSize = Extension.create({
  name: 'fontSize',

  addGlobalAttributes() {
    // 挂到 textStyle 上，能与颜色、加粗等其它 mark 更自然地叠加。
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => {
              return element.style.fontSize || null
            },
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {}
              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    // 对外暴露 setFontSize 命令，方便工具栏直接调用。
    return {
      setFontSize:
        (fontSize) =>
        ({ commands }) =>
          commands.setMark('textStyle', { fontSize }),
    }
  },
})
