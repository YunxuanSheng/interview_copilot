import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { openai } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: '请提供岗位描述链接' }, { status: 400 });
    }

    // 这里需要实现网页内容抓取功能
    // 由于这是一个示例，我们使用模拟数据
    // 在实际应用中，您可能需要使用puppeteer、playwright或其他网页抓取工具
    
    try {
      // 模拟抓取网页内容
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error('无法访问该链接');
      }
      
      const html = await response.text();
      
      // 使用正则表达式提取基本信息（这是一个简化的实现）
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : '';
      
      // 提取文本内容（去除HTML标签）
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // 使用OpenAI解析内容
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `你是一个专业的招聘信息解析助手。请从给定的岗位描述文本中提取以下信息，并以JSON格式返回：

{
  "companyName": "公司名称",
  "positionName": "职位名称", 
  "department": "部门",
  "location": "工作地点",
  "salary": "薪资范围",
  "jobDescription": "岗位描述和工作要求"
}

请仔细分析文本内容，如果某些信息无法确定，请返回空字符串。`
          },
          {
            role: "user",
            content: `请解析以下岗位描述信息：

标题: ${title}

内容: ${textContent.substring(0, 4000)}`
          }
        ],
        temperature: 0.3,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('AI解析失败');
      }

      // 尝试解析AI返回的JSON
      let parsedData;
      try {
        // 提取JSON部分
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('无法找到JSON格式的响应');
        }
      } catch (parseError) {
        console.error('解析AI响应失败:', parseError);
        // 如果JSON解析失败，尝试手动提取信息
        parsedData = {
          companyName: extractField(aiResponse, '公司名称', 'companyName'),
          positionName: extractField(aiResponse, '职位名称', 'positionName'),
          department: extractField(aiResponse, '部门', 'department'),
          location: extractField(aiResponse, '工作地点', 'location'),
          salary: extractField(aiResponse, '薪资范围', 'salary'),
          jobDescription: extractField(aiResponse, '岗位描述', 'jobDescription'),
        };
      }

      return NextResponse.json(parsedData);
      
    } catch (fetchError) {
      console.error('抓取网页内容失败:', fetchError);
      return NextResponse.json({ 
        error: '无法访问该链接，请检查链接是否正确' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('解析岗位描述失败:', error);
    return NextResponse.json({ 
      error: '解析岗位描述失败，请稍后重试' 
    }, { status: 500 });
  }
}

// 辅助函数：从文本中提取字段值
function extractField(text: string, fieldName: string, fieldKey: string): string {
  const patterns = [
    new RegExp(`"${fieldKey}"\\s*:\\s*"([^"]*)"`, 'i'),
    new RegExp(`${fieldName}[：:]\\s*([^\\n]+)`, 'i'),
    new RegExp(`${fieldKey}[：:]\\s*([^\\n]+)`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return '';
}
