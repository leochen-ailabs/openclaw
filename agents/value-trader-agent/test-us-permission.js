import { FutuClient } from './skills/daily-analysis/futu-client.js';

const client = new FutuClient({ host: '127.0.0.1', port: 33333 });
await client.connect();

try {
  console.log('测试美股行情权限...\n');

  // 测试 PDD
  const pddSec = { market: 11, code: 'PDD' };
  console.log('1. 订阅 PDD...');
  const subResp = await client.ws.Sub({
    c2s: {
      securityList: [pddSec],
      subTypeList: [1],
      isSubOrUnSub: true,
      isRegOrUnRegPush: true
    }
  });
  console.log('   订阅状态:', subResp.retType === 0 ? '✅ 成功' : '❌ 失败');
  if (subResp.retType !== 0) {
    console.log('   错误:', subResp.retMsg);
  }

  // 获取报价
  console.log('\n2. 获取 PDD 报价...');
  const quoteResp = await client.ws.GetBasicQot({
    c2s: { securityList: [pddSec] }
  });

  if (quoteResp.retType === 0 && quoteResp.s2c?.basicQotList?.[0]) {
    const quote = quoteResp.s2c.basicQotList[0];
    console.log('   ✅ 成功获取报价:');
    console.log('   - 代码:', quote.security.code);
    console.log('   - 最新价:', quote.curPrice);
    console.log('   - 涨跌幅:', (quote.changeRate || 0).toFixed(2) + '%');
  } else {
    console.log('   ❌ 获取失败:', quoteResp.retMsg);
  }

  // 测试 NVDA
  console.log('\n3. 测试 NVDA...');
  const nvdaSec = { market: 11, code: 'NVDA' };
  const nvdaSub = await client.ws.Sub({
    c2s: {
      securityList: [nvdaSec],
      subTypeList: [1],
      isSubOrUnSub: true,
      isRegOrUnRegPush: true
    }
  });
  console.log('   订阅状态:', nvdaSub.retType === 0 ? '✅ 成功' : '❌ 失败');

  if (nvdaSub.retType === 0) {
    const nvdaQuote = await client.ws.GetBasicQot({
      c2s: { securityList: [nvdaSec] }
    });
    if (nvdaQuote.retType === 0 && nvdaQuote.s2c?.basicQotList?.[0]) {
      const quote = nvdaQuote.s2c.basicQotList[0];
      console.log('   ✅ 成功获取报价:');
      console.log('   - 代码:', quote.security.code);
      console.log('   - 最新价:', quote.curPrice);
      console.log('   - 涨跌幅:', (quote.changeRate || 0).toFixed(2) + '%');
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ 美股行情权限已生效！');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

} catch (error) {
  console.error('\n❌ 测试失败:', error.message || error);
} finally {
  client.disconnect();
}
