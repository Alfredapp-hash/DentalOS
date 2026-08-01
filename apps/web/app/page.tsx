export default function HomePage() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: '3rem', maxWidth: 960, margin: '0 auto' }}>
      <p style={{ textTransform: 'uppercase', letterSpacing: '0.12em' }}>DentalOS</p>
      <h1>Dental practice growth and operations command center</h1>
      <p>
        Azure-first CRM for leads, patient communications, treatment follow-up,
        recall, schedule recovery, analytics, and accountable staff workflows.
      </p>
      <section>
        <h2>Foundation status</h2>
        <ul>
          <li>Web application scaffolded</li>
          <li>API health boundary defined</li>
          <li>Azure infrastructure modeled with Bicep</li>
          <li>Clinical system remains the external source of record</li>
        </ul>
      </section>
    </main>
  );
}
