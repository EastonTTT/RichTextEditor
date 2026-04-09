// 首页和知识库页共用的一级导航配置。
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

// 列表筛选项统一集中管理，tab 组件只做展示。
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
