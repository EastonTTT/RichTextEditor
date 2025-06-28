import request from './request'


//获取文章评论
export const getCommentList = (textId: number,page: number,pageSize: number) => {
  return request({
    url: '/api/comment/commentLists',
    method: 'get',
    params: {
      textId, page, pageSize
    }
  })
}

//发表评论 ***
export const publishComment = (data: any) => {
  return request({
    url: '/api/comment/publish',
    method: 'post',
    data
  })
}



