import Link from 'next/link';

export default function Docs() {
  return (
    <div>
      <h1>Documentation</h1>
      <p className="small">Build inline apps with a Manifest, or integrate any stack via the Remote Adapter.</p>
      <ul>
        <li><Link href="/docs/manifest">Manifest (inline apps)</Link></li>
        <li><Link href="/docs/remote-adapter">Remote Adapter (HTTP runner)</Link></li>
        <li><Link href="/docs/security">Security model</Link></li>
        <li><Link href="/docs/publishing">Publishing flow (creator guide)</Link></li>
        <li><Link href="/docs/api">Platform API (runs, library)</Link></li>
      </ul>
    </div>
  );
}
