import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">用户服务协议</CardTitle>
          <CardDescription className="text-center text-lg">
            最后更新日期：2024年1月15日
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">1. 协议范围</h2>
            <p className="mb-4">
              本用户服务协议（以下简称&ldquo;本协议&rdquo;）是您与AI面试助理（以下简称&ldquo;我们&rdquo;或&ldquo;本服务&rdquo;）之间关于您使用本服务所订立的协议。请您仔细阅读本协议，特别是免除或者限制责任的条款。
            </p>
            <p className="mb-4">
              您通过网络页面点击注册、登录、使用本服务，即表示您已阅读、理解并同意接受本协议的全部内容，本协议即构成对双方均具有约束力的法律文件。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">2. 服务内容</h2>
            <p className="mb-4">本服务为您提供以下功能：</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>AI面试分析：</strong>基于您上传的面试录音和文本，提供智能分析和建议</li>
              <li><strong>简历解析：</strong>自动解析您的简历内容，提取关键信息</li>
              <li><strong>面试管理：</strong>帮助您管理面试进度和安排</li>
              <li><strong>面经分享：</strong>提供平台供您分享和获取面试经验</li>
              <li><strong>项目整理：</strong>协助您整理和展示项目经验</li>
            </ul>
            <p className="mb-4">
              我们保留随时修改、升级或终止本服务的权利，恕不另行通知。您同意我们无需对您或任何第三方承担因修改、升级或终止本服务而产生的任何责任。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">3. 用户账户</h2>
            <h3 className="text-lg font-medium mb-2 text-gray-800">3.1 账户注册</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>您必须提供真实、准确、完整的注册信息</li>
              <li>您有义务维护账户信息的准确性和及时更新</li>
              <li>您对账户和密码的安全负责，不得将账户借给他人使用</li>
              <li>因您保管不善可能导致遭受盗号或密码失窃，责任由您自行承担</li>
            </ul>

            <h3 className="text-lg font-medium mb-2 text-gray-800">3.2 账户使用</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>您不得利用本服务从事违法违规活动</li>
              <li>您不得恶意注册账户或使用虚假信息注册</li>
              <li>您不得通过技术手段恶意获取服务数据</li>
              <li>您不得干扰或破坏本服务的正常运行</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">4. 用户内容</h2>
            <h3 className="text-lg font-medium mb-2 text-gray-800">4.1 内容上传</h3>
            <p className="mb-4">
              您上传到本服务的所有内容（包括但不限于面试录音、简历文件、文本内容等）均为您的个人财产。您保证您拥有上传内容的合法权利，并承担相应的法律责任。
            </p>

            <h3 className="text-lg font-medium mb-2 text-gray-800">4.2 内容使用</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>我们仅将您的内容用于提供本协议约定的服务</li>
              <li>我们不会将您的内容用于商业营销或其他目的</li>
              <li>我们不会将您的内容分享给第三方</li>
              <li>您的内容将按照我们的隐私政策进行安全存储</li>
            </ul>

            <h3 className="text-lg font-medium mb-2 text-gray-800">4.3 禁止内容</h3>
            <p className="mb-4">您不得上传以下内容：</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>违反法律法规的内容</li>
              <li>侵犯他人知识产权的内容</li>
              <li>包含病毒、恶意代码的内容</li>
              <li>涉及他人隐私的敏感信息</li>
              <li>其他不当或有害的内容</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">5. 知识产权</h2>
            <p className="mb-4">
              本服务的软件、技术、程序、代码、用户界面、商标、标识、版面设计、文字、图片、音频、视频等知识产权均归我们所有。未经我们书面同意，您不得复制、修改、传播、出售或以其他方式使用这些内容。
            </p>
            <p className="mb-4">
              您上传的内容的知识产权归您所有，但您授权我们在提供本服务时使用这些内容。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">6. 服务费用</h2>
            <p className="mb-4">
              目前本服务为免费提供，但我们保留在未来收取服务费用的权利。如我们决定收费，将提前30天通过网站公告或其他方式通知您。
            </p>
            <p className="mb-4">
              如您不同意收费，可以选择停止使用本服务。如您继续使用，则视为同意支付相关费用。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">7. 免责声明</h2>
            <p className="mb-4">在法律允许的最大范围内，我们不对以下情况承担责任：</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>因不可抗力导致的服务中断或数据丢失</li>
              <li>因网络故障、系统维护等原因导致的服务不可用</li>
              <li>因您违反本协议导致的一切后果</li>
              <li>因第三方原因导致的服务问题</li>
              <li>AI分析结果的准确性和适用性</li>
              <li>因使用本服务产生的任何直接或间接损失</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">8. 服务变更与终止</h2>
            <h3 className="text-lg font-medium mb-2 text-gray-800">8.1 服务变更</h3>
            <p className="mb-4">
              我们有权随时修改、升级或变更本服务的内容和功能，恕不另行通知。您继续使用本服务即视为接受变更后的服务。
            </p>

            <h3 className="text-lg font-medium mb-2 text-gray-800">8.2 服务终止</h3>
            <p className="mb-4">在以下情况下，我们有权终止为您提供服务：</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>您违反本协议的任何条款</li>
              <li>您长期未使用本服务</li>
              <li>我们因业务调整需要终止服务</li>
              <li>法律法规要求终止服务</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">9. 争议解决</h2>
            <p className="mb-4">
              本协议的签订、执行和解释及争议的解决均适用中华人民共和国法律。如双方就本协议内容或其执行发生任何争议，应尽量友好协商解决；协商不成时，任何一方均可向我们所在地有管辖权的人民法院提起诉讼。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">10. 其他条款</h2>
            <h3 className="text-lg font-medium mb-2 text-gray-800">10.1 协议修改</h3>
            <p className="mb-4">
              我们有权随时修改本协议。修改后的协议将在网站上公布，自公布之日起生效。如您不同意修改后的协议，可以选择停止使用本服务。
            </p>

            <h3 className="text-lg font-medium mb-2 text-gray-800">10.2 协议效力</h3>
            <p className="mb-4">
              如本协议中的任何条款无论因何种原因完全或部分无效或不具有执行力，本协议的其余条款仍应有效并且有约束力。
            </p>

            <h3 className="text-lg font-medium mb-2 text-gray-800">10.3 联系我们</h3>
            <p className="mb-4">
              如果您对本协议有任何疑问，请通过以下方式联系我们：
            </p>
            <ul className="list-none pl-0 mb-4 space-y-2">
              <li><strong>邮箱：</strong>legal@interview-copilot.com</li>
              <li><strong>电话：</strong>400-123-4567</li>
              <li><strong>地址：</strong>北京市朝阳区xxx大厦xxx室</li>
            </ul>
          </section>

          <div className="border-t pt-6 mt-8">
            <p className="text-center text-gray-600">
              本用户服务协议自2024年1月15日起生效
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
