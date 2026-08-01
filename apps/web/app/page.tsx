type DashboardTask = {
  id: string;
  title: string;
  priority: number;
  financialValue: string | number;
  dueAt?: string | null;
  patient?: { firstName: string; lastName: string } | null;
  opportunity?: { type: string; value: string | number } | null;
};

type DashboardData = {
  openTasks: number;
  openOpportunities: number;
  activeLeads: number;
  opportunityValue: string | number;
  urgentTasks: DashboardTask[];
};

const preview: DashboardData = {
  openTasks: 12,
  openOpportunities: 27,
  activeLeads: 6,
  opportunityValue: 68450,
  urgentTasks: [
    { id: 'preview-1', title: 'Call new website lead', priority: 1, financialValue: 750, dueAt: new Date().toISOString() },
    { id: 'preview-2', title: 'Follow up on crown treatment', priority: 1, financialValue: 2450, patient: { firstName: 'Jordan', lastName: 'Lee' } },
    { id: 'preview-3', title: 'Fill tomorrow morning hygiene opening', priority: 2, financialValue: 320 }
  ]
};

async function getDashboard(): Promise<{ data: DashboardData; live: boolean }> {
  const apiUrl = process.env.API_BASE_URL;
  const organizationId = process.env.DEMO_ORGANIZATION_ID;
  if (!apiUrl || !organizationId) return { data: preview, live: false };

  try {
    const response = await fetch(`${apiUrl}/api/v1/dashboard`, {
      headers: { 'x-organization-id': organizationId },
      cache: 'no-store'
    });
    if (!response.ok) return { data: preview, live: false };
    return { data: await response.json() as DashboardData, live: true };
  } catch {
    return { data: preview, live: false };
  }
}

const money = (value: string | number) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0
}).format(Number(value));

export default async function HomePage() {
  const { data, live } = await getDashboard();
  const cards = [
    ['Revenue opportunity', money(data.opportunityValue)],
    ['Open opportunities', data.openOpportunities.toString()],
    ['Active new leads', data.activeLeads.toString()],
    ['Tasks requiring action', data.openTasks.toString()]
  ];

  return (
    <main style={{ fontFamily: 'Inter, ui-sans-serif, system-ui', minHeight: '100vh', background: '#f4f7f8', color: '#102a2e' }}>
      <header style={{ background: '#0f3d44', color: 'white', padding: '1.25rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><strong style={{ fontSize: 22 }}>DentalOS</strong><span style={{ marginLeft: 12, opacity: .75 }}>Command Center</span></div>
        <span style={{ fontSize: 13, padding: '.4rem .7rem', borderRadius: 999, background: live ? '#1d766d' : '#6b5f32' }}>{live ? 'Live data' : 'Preview data'}</span>
      </header>

      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '2.5rem 2rem' }}>
        <section style={{ marginBottom: '2rem' }}>
          <p style={{ margin: 0, color: '#557176' }}>Saturday operations overview</p>
          <h1 style={{ margin: '.35rem 0 0', fontSize: 36 }}>What needs attention now</h1>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 28 }}>
          {cards.map(([label, value]) => (
            <article key={label} style={{ background: 'white', border: '1px solid #dce7e8', borderRadius: 14, padding: '1.3rem', boxShadow: '0 7px 24px rgba(15,61,68,.05)' }}>
              <div style={{ color: '#60777b', fontSize: 14 }}>{label}</div>
              <div style={{ fontSize: 32, fontWeight: 750, marginTop: 8 }}>{value}</div>
            </article>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, 1fr)', gap: 20 }}>
          <article style={{ background: 'white', border: '1px solid #dce7e8', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '1.2rem 1.4rem', borderBottom: '1px solid #e8eeee', display: 'flex', justifyContent: 'space-between' }}>
              <div><strong>Priority work queue</strong><div style={{ color: '#6b8084', fontSize: 13, marginTop: 3 }}>Sorted by urgency and financial impact</div></div>
              <button style={{ border: 0, borderRadius: 8, padding: '.55rem .8rem', background: '#e5f2f0', color: '#0f5b55', fontWeight: 650 }}>View all</button>
            </div>
            {data.urgentTasks.map((task) => (
              <div key={task.id} style={{ padding: '1rem 1.4rem', borderBottom: '1px solid #edf1f2', display: 'grid', gridTemplateColumns: '42px 1fr auto', gap: 12, alignItems: 'center' }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, display: 'grid', placeItems: 'center', background: task.priority === 1 ? '#fde9e7' : '#eef3f4', color: task.priority === 1 ? '#9c2f25' : '#486267', fontWeight: 750 }}>{task.priority}</span>
                <div><strong>{task.title}</strong><div style={{ color: '#718488', fontSize: 13, marginTop: 3 }}>{task.patient ? `${task.patient.firstName} ${task.patient.lastName}` : 'Practice workflow'}{task.dueAt ? ` · Due ${new Date(task.dueAt).toLocaleDateString()}` : ''}</div></div>
                <strong style={{ color: '#17665e' }}>{money(task.financialValue)}</strong>
              </div>
            ))}
          </article>

          <aside style={{ background: '#123e44', color: 'white', borderRadius: 14, padding: '1.5rem' }}>
            <div style={{ opacity: .7, fontSize: 13, textTransform: 'uppercase', letterSpacing: '.08em' }}>Daily focus</div>
            <h2 style={{ fontSize: 25, lineHeight: 1.15 }}>Recover the highest-value patient opportunities first.</h2>
            <p style={{ opacity: .78, lineHeight: 1.55 }}>DentalOS connects each dashboard number to a patient, an accountable team member, and a next action.</p>
            <div style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,.16)', paddingTop: 18 }}>
              <div style={{ opacity: .65, fontSize: 13 }}>Current focus value</div>
              <div style={{ fontSize: 30, fontWeight: 760, marginTop: 5 }}>{money(data.urgentTasks.reduce((sum, task) => sum + Number(task.financialValue), 0))}</div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
