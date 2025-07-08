<template>
  <div class="editor-header">
    <div class="left-side">
      <div class="breadcrumb">
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item :to="{ path: '/doclist' }"><b> ---Esc--- </b></el-breadcrumb-item>

        </el-breadcrumb>
      </div>
    </div>
    <div class="right-side">
      <!-- <div class="collaborators" v-if="isCollaborative">
        <p>collaborators:</p>
        <el-avatar src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" class="avatar" />
        <el-avatar src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" class="avatar" />
        <el-avatar src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" class="avatar" />
        <el-avatar src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" class="avatar" />
        <el-avatar src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" class="avatar" />
        <el-avatar src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" class="avatar" />
      </div> -->
      <div class="right-button">
        <el-tooltip content="保存" placement="bottom">
          <button @click=handleSaveDocument>
            <SaveIcon size="large" />
          </button>
        </el-tooltip>
        <el-tooltip content="导出为PDF" placement="bottom">
          <button @click="exportAsPDF()">
            <FileExportIcon size="large" />
          </button>
        </el-tooltip>
        <!-- <el-tooltip content="搜索" placement="bottom">
          <button>
            <SearchIcon size="large" />
          </button>
        </el-tooltip> -->
      </div>
      <div class="avatar">
        <el-avatar :src=avatar />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  HomeIcon,
  SaveIcon,
  SearchIcon,
  UserListIcon,
  FileExportIcon
} from 'tdesign-icons-vue-next';
import { ArrowRight } from '@element-plus/icons-vue'
import { inject } from 'vue'
import { Editor } from '@tiptap/vue-3';
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';
import { saveDocument } from '@/api/document'
import { useRoute } from 'vue-router'
import { ElNotification } from 'element-plus';
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const route = useRoute()
const { editor } = defineProps<{ editor: Editor | null }>()
const isCollaborative = inject<boolean>('isCollaborative')
const avatar = userStore.userInfo.avatar

const mydocument = [
  { id: 1, name: 'Document 1' },
  { id: 2, name: 'Document 2' },
  { id: 3, name: 'Document 3' }
]

const exportAsPDF = () => {
  // const content = editor?.getHTML(); // 获取 HTML 内容
  // console.log(content)
  const domElement = editor?.view.dom;

  if (!domElement) {
    console.error("Editor DOM element is not available");
    return;
  }

  html2canvas(domElement, {
    scale: 3,
    useCORS: true,
  }).then(canvas => {
    const margin = 20 // 页边距
    let position = 0  // 当前页的初始位置
    const A4Width = 595.28  // A4 宽度
    const A4Height = 841.89; // A4 高度

    const pageHeight = A4Height * canvas.width / A4Width; //填充一页所需canvas高度
    let unallocatedHeight = canvas.height;  // 当前剩余高度

    //canvas对应的PDF宽高
    const imgWidth = A4Width - margin * 2;
    const imgHeight = canvas.height * imgWidth / canvas.width;

    const pageData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    //高度不满一页时无需进行分页操作
    if (unallocatedHeight < pageHeight) {
      pdf.addImage(pageData, 'PNG', margin, margin, imgWidth, imgHeight);
      pdf.save('document.pdf');
      return;
    } else {
      while (unallocatedHeight > 0) {
        pdf.addImage(pageData, 'PNG', margin, margin + position, imgWidth, imgHeight);
        unallocatedHeight -= pageHeight;
        position -= pageHeight;
        if (unallocatedHeight > 0) {
          pdf.addPage();
        }
      }
      pdf.save('document.pdf');
    }
  })

  // const doc = new jsPDF({
  //   unit: 'mm',  // 使用毫米作为单位
  //   format: 'a4', // 页面大小 A4
  //   orientation: 'portrait', // 页面方向
  //   precision: 16,  // 浮点数精度
  // });

  // 设置合适的字体大小
  // doc.setFontSize(8);  // 调整字体大小
  // doc.setFont('helvetica', 'normal');  // 设置字体样式

  // // 使用 html 方法将内容添加到 PDF
  // doc.html(content, {
  //   callback: function (doc) {
  //     doc.save('document.pdf');
  //   },
  //   margin: [10, 10, 10, 10],  // 设置页边距
  //   x: 10,  // 水平位置
  //   y: 10,  // 垂直位置
  //   width: 180,  // 控制宽度，避免内容溢出
  //   windowWidth: 800,  // 设置渲染时的视口宽度
  //   autoPaging: 'text',  // 防止分页时分割文本
  // });
};

const handleSaveDocument = () => {
  const jsonData = JSON.stringify(editor.getJSON())
  console.log(jsonData)
  saveDocument(route.query.id, jsonData).then(res => {
    ElNotification.success("保存文档成功")
  })
}
</script>

<style lang="scss" scoped>
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  margin-bottom: 1%;
  min-height: 70px;
  border: 1px solid #ccc;
  position: sticky;
  top: 0;
  align-self: flex-start;
  height: fit-content;
  background-color: #fff;
  /* 为 header 添加背景颜色 */
}

.left-side {
  display: flex;
  align-items: center;
}

.left-icon {
  border-right: 1px solid #ccc;
  margin-right: 20px;
  display: flex;
  align-items: center;
}

.breadcrumb {
  margin-left: 20px;
}

.right-side {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.right-button {
  display: flex;
  align-items: center;
  margin-right: 20px;


}

.avatar {
  margin: 0 8px;
  display: flex;
  align-items: center;
  border-left: 1px solid #ccc;
  padding-left: 20px;
}

.collaborators {
  p {
    color: #a1a1a1;
  }

  display: flex;
  align-items: center;
  margin-right: 20px;

  .avatar {
    margin: 0 4px;
    border: 2px solid #fff;
  }
}

button {
  all: unset;
  cursor: pointer;
  padding: 5px;
  background-color: transparent;
  display: inline-block;
  margin: 0 4px;
  transition: transform 0.3s ease, background-color 0.3s ease;
  border-radius: 10%;
  display: flex;
  align-items: center;
  justify-content: center;
}

button:hover {
  background-color: #f0f0f0;
  transform: scale(1.1);
}

.document-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  transition: transform 0.3s ease, background-color 0.3s ease;
  margin-bottom: 5px;
  border-radius: 5px;
}

.document-item:hover {
  background-color: #f0f0f0;
  transform: scale(1.1);
}

b {
  background-color: #42f05a;
  color: #f6ff00;
  font-size: 15px;
  border-radius: 8px;
}
</style>
