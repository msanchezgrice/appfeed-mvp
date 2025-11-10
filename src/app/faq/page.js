export default function FAQ() {
  return (
    <div>
      <h1>FAQ</h1>
      <table className="table" style={{marginTop:12}}>
        <tbody>
          <tr>
            <th>Do viewers need accounts?</th>
            <td>They can watch without one. Try/Use requires an account (to store keys, preferences, and limits).</td>
          </tr>
          <tr>
            <th>How are API keys handled?</th>
            <td>Bring‑Your‑Own‑Keys are stored encrypted. At run time we mint scoped, short‑lived tokens for only the requested provider capabilities. Raw keys never reach the app code.</td>
          </tr>
          <tr>
            <th>What runs inline vs remotely?</th>
            <td>Inline apps are manifest‑driven Actions/Agents. Anything needing custom runtimes runs remotely via the adapter. iOS/Chrome are discovery‑only with deep links.</td>
          </tr>
          <tr>
            <th>Is there revenue sharing?</th>
            <td>Planned. We’ll expose paid boosts and premium app access; creators get a transparent split.</td>
          </tr>
          <tr>
            <th>Mobile readiness?</th>
            <td>Creators flag mobile support; we also auto‑audit cards at phone breakpoints and show a “mobile‑ready” badge and filter.</td>
          </tr>
          <tr>
            <th>What about scraping/headless browsers?</th>
            <td>Not inline. Use a remote adapter with your own Playwright service and declare the capability.</td>
          </tr>
          <tr>
            <th>Are there rate and spend limits?</th>
            <td>Yes. Users set daily caps and per‑run limits; apps have compute ceilings; heavy tasks must run via remote adapters.</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
