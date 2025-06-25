import request from './request'


//获取文章评论
export const getCommentList = (id: number,page: number,pageSize: number) => {
  return request({
    url: `/api/auth/${id}/comment`,
    method: 'get',
    params: {
      page, pageSize
    }
  })
}

//发表评论 ***
export const publishComment = (data: any) => {
  return request({
    url: '/api/auth/comment/publish',
    method: 'post',
    data
  })
}



