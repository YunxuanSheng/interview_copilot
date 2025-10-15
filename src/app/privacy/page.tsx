import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">隐私政策</CardTitle>
          <CardDescription className="text-center text-lg">
            最后更新日期：2024年1月15日
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">1. 引言</h2>
            <p className="mb-4">
              欢迎使用AI面试助理（以下简称&ldquo;我们&rdquo;或&ldquo;本服务&rdquo;）。我们深知个人信息对您的重要性，并会尽全力保护您的个人信息安全可靠。我们承诺，我们将按法律法规要求，采取相应安全保护措施，尽力保护您的个人信息安全可控。
            </p>
            <p className="mb-4">
              本隐私政策将向您详细介绍，在您使用我们的服务时，我们如何收集、使用、存储、分享和保护您的个人信息，以及我们为您提供的访问、更新、删除和保护这些信息的方式。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">2. 我们收集的信息</h2>
            <h3 className="text-lg font-medium mb-2 text-gray-800">2.1 您主动提供的信息</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>账户信息：</strong>当您注册账户时，我们会收集您的姓名、邮箱地址等基本信息</li>
              <li><strong>简历信息：</strong>您上传的简历文件，包括但不限于工作经历、教育背景、技能等职业信息</li>
              <li><strong>面试内容：</strong>您上传的面试录音、面试文本记录、面试评价等</li>
              <li><strong>项目信息：</strong>您创建的项目描述、技术栈、项目经验等</li>
              <li><strong>面经分享：</strong>您主动分享的面试经验和心得</li>
            </ul>

            <h3 className="text-lg font-medium mb-2 text-gray-800">2.2 我们自动收集的信息</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>使用数据：</strong>您使用我们服务的频率、时长、功能使用情况等</li>
              <li><strong>设备信息：</strong>设备型号、操作系统版本、浏览器类型等</li>
              <li><strong>日志信息：</strong>访问时间、IP地址、页面访问记录等</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">3. 信息使用目的</h2>
            <p className="mb-4">我们收集和使用您的个人信息仅用于以下目的：</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>服务提供：</strong>为您提供AI面试分析、简历解析、面试建议等核心功能</li>
              <li><strong>个性化服务：</strong>基于您的信息提供个性化的面试准备建议和职业发展建议</li>
              <li><strong>服务改进：</strong>分析用户使用情况，持续改进我们的产品和服务质量</li>
              <li><strong>安全保障：</strong>保护账户安全，防范欺诈和滥用行为</li>
              <li><strong>法律合规：</strong>遵守相关法律法规要求</li>
            </ul>
            <p className="mb-4 text-red-600 font-medium">
              <strong>重要声明：</strong>我们承诺不会将您的个人信息用于任何商业营销目的，也不会将您的信息出售给第三方。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">4. 信息存储与安全</h2>
            <h3 className="text-lg font-medium mb-2 text-gray-800">4.1 存储方式</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>音频文件：</strong>您上传的面试录音将加密存储在安全的云服务器中</li>
              <li><strong>文本数据：</strong>面试文本、简历内容等将以加密形式存储在数据库中</li>
              <li><strong>存储期限：</strong>除非您主动删除，否则我们将按照服务需要合理保存您的信息</li>
            </ul>

            <h3 className="text-lg font-medium mb-2 text-gray-800">4.2 安全措施</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>采用行业标准的加密技术保护数据传输和存储</li>
              <li>实施严格的访问控制，仅授权人员可访问您的信息</li>
              <li>定期进行安全审计和漏洞扫描</li>
              <li>建立数据泄露应急响应机制</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">5. 信息共享与披露</h2>
            <p className="mb-4">我们不会向第三方出售、交易或以其他方式转让您的个人信息，除非：</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>获得您的明确同意</li>
              <li>法律法规要求或政府机关要求</li>
              <li>为保护我们的合法权益而必须披露</li>
              <li>为保护用户或公众的人身财产安全而必须披露</li>
            </ul>
            <p className="mb-4 text-red-600 font-medium">
              <strong>特别说明：</strong>我们不会将您的面试录音、简历内容等敏感信息用于任何商业用途或分享给第三方。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">6. 您的权利</h2>
            <p className="mb-4">根据《个人信息保护法》，您享有以下权利：</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>知情权：</strong>了解我们如何处理您的个人信息</li>
              <li><strong>决定权：</strong>自主决定是否提供个人信息</li>
              <li><strong>查阅权：</strong>查阅我们持有的您的个人信息</li>
              <li><strong>更正权：</strong>要求我们更正不准确的个人信息</li>
              <li><strong>删除权：</strong>要求我们删除您的个人信息</li>
              <li><strong>撤回同意权：</strong>随时撤回您对个人信息处理的同意</li>
            </ul>
            <p className="mb-4">
              如需行使上述权利，请通过邮箱联系我们：privacy@interview-copilot.com
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">7. 未成年人保护</h2>
            <p className="mb-4">
              我们非常重视未成年人的个人信息保护。如果您是未成年人，建议您请您的父母或监护人仔细阅读本隐私政策，并在征得您的父母或监护人同意后，使用我们的服务。
            </p>
            <p className="mb-4">
              如果我们发现在未获得可证实的父母同意的情况下收集了未成年人的个人信息，则会设法尽快删除相关信息。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">8. 隐私政策更新</h2>
            <p className="mb-4">
              我们可能会不时更新本隐私政策。当我们对隐私政策进行重大变更时，我们会通过网站公告或其他适当方式通知您。我们建议您定期查看本隐私政策，以了解我们如何保护您的信息。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">9. 联系我们</h2>
            <p className="mb-4">
              如果您对本隐私政策有任何疑问、意见或建议，请通过以下方式联系我们：
            </p>
            <ul className="list-none pl-0 mb-4 space-y-2">
              <li><strong>邮箱：</strong>privacy@interview-copilot.com</li>
              <li><strong>电话：</strong>400-123-4567</li>
              <li><strong>地址：</strong>北京市朝阳区xxx大厦xxx室</li>
            </ul>
            <p className="mb-4">
              我们将在收到您的反馈后15个工作日内回复您。
            </p>
          </section>

          <div className="border-t pt-6 mt-8">
            <p className="text-center text-gray-600">
              本隐私政策自2024年1月15日起生效
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
