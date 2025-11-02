<template >
  <div class="icon" @click="handleClicked">
    <More />
    <div class="menu" v-if="isShowMenu">
      1111
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
const props = defineProps<{
  row
}>()
const emit = defineEmits(['actionEmit'])

const isShowMenu = ref(false)
const eventType = null
function handleClicked() {
  isShowMenu.value = !isShowMenu.value
}

function handleSelected(){
  emit('actionEmit',eventType)
}
</script>
<style lang="scss" scoped>
.icon{
  margin-left: 5px;
  width: 25px;
  height: 25px;
  position: relative;
  & :hover{
    border-radius: 4px;
    background-color: #d8dada;
  }
  .menu{
    position: absolute;
    top: 0;
    left: 0;
    transform: translateX(-100%);
    background-color: #fff;
    border-radius: 5px ;
    padding: 5px;
  }
}
</style>
