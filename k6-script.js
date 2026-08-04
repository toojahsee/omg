import http from 'k6/http';
import { check, sleep } from 'k6';

// 1. 压测配置参数 (Options)
export const options = {
  // 这里的配置是【单台虚拟机】的负载量。
  // 因为你在 YAML 里配置了 20 台机器，所以 最终总并发 = 这里的 target x 20
  
  // 使用 stages (阶段) 模拟更真实的流量波动：
  stages: [
    { duration: '10s', target: 50 },  // 阶段一：用 10 秒时间，将单机并发逐渐拉升到 50（总并发 1000）
    { duration: '40s', target: 50 },  // 阶段二：保持单机 50 并发，持续火力压测 40 秒
    { duration: '10s', target: 0 },   // 阶段三：最后 10 秒逐渐释放连接，降回 0
  ],
  
  /* 
  如果你不想分阶段，只想简单粗暴地保持固定并发，可以删掉上面的 stages，换成下面这两行：
  vus: 100,         // 单机并发 100 
  duration: '60s',  // 压测 60 秒
  */
};

// 2. 发包核心逻辑 (每 1 个并发用户都会循环执行这里的代码)
export default function () {
  // ⚠️ 【极其重要】把这里的 URL 换成你自己服务器的真实接口地址！
  const targetUrl = 'testuberlabs.com';

  // 配置请求头和超时时间
  const params = {
    headers: {
      'User-Agent': 'GitHub-Actions-k6-LoadTest',
      'Content-Type': 'application/json',
    },
    timeout: '10s', // 如果目标服务器 10 秒没响应，就直接中断丢弃，防止卡死
  };

  // 发起 GET 请求
  // (如果是 POST 请求，语法是: const res = http.post(targetUrl, JSON.stringify({key:"value"}), params); )
  const res = http.get(targetUrl, params);

  // 3. 断言检查 (Check)
  // 这一步是为了在压测结束后的报表中，统计有多少请求成功，有多少被拒绝
  check(res, {
    'HTTP 状态码是 200': (r) => r.status === 200,
    // '响应时间小于 500 毫秒': (r) => r.timings.duration < 500, // 这行可以取消注释用来测延迟
  });

  // 4. 停顿 (Sleep)
  // 每次发完包随机停顿 0.5 到 1.5 秒，模拟真实用户的浏览间隔，避免把本机(虚拟机)的 CPU 瞬间干满。
  // 如果你的目的纯粹是“极限火力倾泻”，可以直接删掉这行代码。
  sleep(Math.random() + 0.5); 
}
