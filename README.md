### 目录代码结构

src
├── App.vue
├── apis # 请求层
├── assets # 资源层
├── components # 公共组件层
├── constants # 常量层
│ └── index.ts
├── pages # 业务模块层
├── router # 路由层
├── store # Pinia 数据层
│ ├── index.ts
│ └── modules
│ ├── setting.ts
│ └── user.ts
├── style # 样式目录
│ ├── reset.less # 对默认样式的重置
├── types # 类型文件目录
└── utils # 工具层
│ ├── route # 路由工具封装
│ └── request # 请求工具封装
└── main.ts # 入口逻辑文件

### 项目命名规则

1、目录名全部使用小写， kebab-case形式命名

2、文件的命名规范

如果该文件是单文件组件/类，采用PascalCase形式命名，方便导入和使用。

如果该文件是目录下的主文件，采用 index 名称命名，方便导入。如 index.ts, index.vue

如果该文件是接口定义文件，采用camelCase形式命名，方便区分文件关联性。

如果该文件是资源/样式文件，采用kebab-case形式命名。

3、类及接口的命名规范， 采用PascalCase形式命名
