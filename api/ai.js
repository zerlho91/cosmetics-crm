// Claude(Anthropic) 기반 AI 요약/추천 모듈
// ANTHROPIC_API_KEY 가 없으면 graceful 하게 안내 메시지를 반환합니다.
import Anthropic from '@anthropic-ai/sdk';

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5';

let envClient = null; // 환경변수 키로 만든 클라이언트는 재사용
function getClient(apiKey) {
  if (apiKey) return new Anthropic({ apiKey }); // 요청별(설정 화면) 키
  if (envClient) return envClient;
  const envKey = process.env.ANTHROPIC_API_KEY;
  if (!envKey) return null;
  envClient = new Anthropic({ apiKey: envKey });
  return envClient;
}

// opts: { apiKey, model } - 설정 화면에서 전달된 키/모델 우선 사용
async function callClaude(system, user, opts = {}) {
  const c = getClient(opts.apiKey);
  if (!c) {
    return {
      ok: false,
      text: 'AI 기능이 아직 설정되지 않았습니다. 설정 메뉴에서 AI API 키를 입력해주세요.',
    };
  }
  try {
    const msg = await c.messages.create({
      model: opts.model || DEFAULT_MODEL,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: user }],
    });
    const text = (msg.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    return { ok: true, text };
  } catch (e) {
    console.error('[ai] error', e.message);
    return { ok: false, text: 'AI 호출 중 오류가 발생했습니다: ' + e.message };
  }
}

const SYSTEM = `당신은 화장품 매장의 베테랑 매니저를 돕는 한국어 CRM 어시스턴트입니다.
- 항상 한국어로, 매장 직원이 바로 행동할 수 있게 간결하고 구체적으로 답합니다.
- 과장하지 말고 데이터에 근거해 말합니다. 불릿과 짧은 문장을 사용하세요.`;

// 고객 1명 요약 + 추천
export async function customerInsight({ customer, sales, summary }, opts) {
  const items = (sales || [])
    .slice(0, 12)
    .map((s) => `- ${s.date}: ${(s.total_amount || 0).toLocaleString()}원 (${(s.items || []).map((i) => `${i.product_name}x${i.quantity}`).join(', ')})`)
    .join('\n');
  const user = `다음 고객의 구매 데이터를 보고 (1) 한 줄 고객 요약, (2) 다음 응대/추천 제품 2~3가지, (3) 재구매 유도 메시지 예시 1개를 작성해줘.

[고객]
이름: ${customer.name} (${customer.customer_no})
피부타입: ${customer.skin_type || '미입력'}
지역: ${customer.region || '미입력'}
누적구매액: ${(summary?.totalSpent || 0).toLocaleString()}원 / 방문 ${summary?.totalVisits || 0}회 / 보유 마일리지 ${customer.mileage || 0}

[최근 구매내역]
${items || '구매 내역 없음'}`;
  return callClaude(SYSTEM, user, opts);
}

// 세일즈포인트(재구매 관리) 전체 요약
export async function salesPointSummary(customers, opts) {
  const overdue = customers.filter((c) => c.status === 'overdue');
  const soon = customers.filter((c) => c.status === 'soon');
  const list = [...overdue, ...soon]
    .slice(0, 25)
    .map((c) => `- ${c.name}(${c.status === 'overdue' ? '연락필요' : '임박'}): 마지막구매 ${c.lastSaleDate || '-'}, 평균주기 ${c.avgInterval || '-'}일, 주력 ${(c.topProducts || []).join('/') || '-'}`)
    .join('\n');
  const user = `아래는 재구매 관리가 필요한 고객 목록이야. (1) 오늘 우선 연락할 고객 TOP 5와 이유, (2) 그룹 전체에 보낼 캠페인 아이디어 2가지를 제안해줘.

즉시연락필요 ${overdue.length}명 / 임박 ${soon.length}명
${list || '대상 고객 없음'}`;
  return callClaude(SYSTEM, user, opts);
}

// 월간 대시보드 요약
export async function dashboardSummary({ month, monthlySalesHistory, topCustomers, topProducts }, opts) {
  const user = `${month} 매장 실적 데이터를 보고 (1) 핵심 요약 2~3줄, (2) 잘된 점/아쉬운 점, (3) 다음 달 액션 2가지를 알려줘.

[최근 월별 매출]
${(monthlySalesHistory || []).map((m) => `${m.name}: ${(m.sales || 0).toLocaleString()}원`).join(', ')}

[우수고객]
${(topCustomers || []).map((c) => `${c.name}: ${(c.total_spent || 0).toLocaleString()}원`).join(', ') || '-'}

[인기상품]
${(topProducts || []).map((p) => `${p.name}: ${p.total_sold || 0}개`).join(', ') || '-'}`;
  return callClaude(SYSTEM, user, opts);
}
