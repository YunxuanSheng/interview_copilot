/**
 * 测试点赞功能
 */

async function testLikeFunctionality() {
  console.log('🧪 测试点赞功能...\n')
  
  try {
    // 首先获取一个面试分享
    console.log('1. 获取面试分享列表...')
    const sharingsResponse = await fetch('http://localhost:3003/api/interview-sharings?limit=1')
    const sharingsData = await sharingsResponse.json()
    
    if (!sharingsData.success || sharingsData.data.sharings.length === 0) {
      console.log('❌ 没有找到面试分享记录')
      return
    }
    
    const sharing = sharingsData.data.sharings[0]
    console.log(`✅ 找到面试分享: ${sharing.id}`)
    
    // 检查点赞状态
    console.log('\n2. 检查点赞状态...')
    const likeStatusResponse = await fetch(`http://localhost:3003/api/interview-sharings/${sharing.id}/like`)
    const likeStatusData = await likeStatusResponse.json()
    
    if (likeStatusData.success) {
      console.log(`✅ 当前点赞状态: ${likeStatusData.data.liked ? '已点赞' : '未点赞'}`)
    } else {
      console.log('❌ 检查点赞状态失败:', likeStatusData.error)
    }
    
    // 尝试点赞
    console.log('\n3. 尝试点赞...')
    const likeResponse = await fetch(`http://localhost:3003/api/interview-sharings/${sharing.id}/like`, {
      method: 'POST'
    })
    const likeData = await likeResponse.json()
    
    if (likeData.success) {
      console.log(`✅ 点赞操作成功: ${likeData.data.message}`)
      console.log(`   新状态: ${likeData.data.liked ? '已点赞' : '未点赞'}`)
    } else {
      console.log('❌ 点赞操作失败:', likeData.error)
    }
    
    // 再次检查点赞状态
    console.log('\n4. 再次检查点赞状态...')
    const likeStatusResponse2 = await fetch(`http://localhost:3003/api/interview-sharings/${sharing.id}/like`)
    const likeStatusData2 = await likeStatusResponse2.json()
    
    if (likeStatusData2.success) {
      console.log(`✅ 点赞状态: ${likeStatusData2.data.liked ? '已点赞' : '未点赞'}`)
    } else {
      console.log('❌ 检查点赞状态失败:', likeStatusData2.error)
    }
    
    console.log('\n🎉 点赞功能测试完成！')
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.error('请确保服务器正在运行 (npm run dev)')
  }
}

// 运行测试
testLikeFunctionality()
