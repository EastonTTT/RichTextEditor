<template>
    <div style="height: 100vh; box-shadow: var(--el-border-color-light) 0px 0px 10px">
        <el-splitter>
            <el-splitter-panel size="30%" class="sidebar">
                <div style="height: 100vh; box-shadow: var(--el-border-color-light) 0px 0px 10px">
                    <el-splitter layout="vertical">
                        <el-splitter-panel>
                            <div class="user-info">用户信息区</div>
                        </el-splitter-panel>
                        <el-splitter-panel>
                            <div class="list-show">列表展示区</div>
                        </el-splitter-panel>
                    </el-splitter>
                </div>
            </el-splitter-panel>
            <el-splitter-panel :min="200" class="main">
                <div style="height: 100vh; box-shadow: var(--el-border-color-light) 0px 0px 10px">
                    <el-splitter layout="vertical">
                        <el-splitter-panel>
                            <div class="top-button"> 顶部按钮区</div>
                        </el-splitter-panel>
                        <el-splitter-panel>
                            <div class="richtext-editor">富文本编辑区</div>
                        </el-splitter-panel>
                    </el-splitter>
                </div>
            </el-splitter-panel>
        </el-splitter>
    </div>
</template>

<style scoped>

</style>
  
