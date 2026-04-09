// 定义首页区域复用的导航项与筛选项。
export const menuTabs = [
  {
    name: '文档中心',
    val: 'documents',
    icon: 'Document',
    route: '/home',
  },
  {
    name: '知识库',
    val: 'knowledgeBases',
    icon: 'Collection',
    route: '/knowledge',
  },
]

export const homeFilters = [
  {
    label: '全部',
    value: 'all',
  },
  {
    label: '私有',
    value: 'private',
  },
  {
    label: '共享',
    value: 'shared',
  },
]
