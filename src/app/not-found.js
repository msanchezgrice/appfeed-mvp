import Link from 'next/link';
export default function NotFound() {
  return (
    <div>
      <h1>Not found</h1>
      <p className="small">The page you’re looking for doesn’t exist.</p>
      <Link href="/" className="btn">Back to home</Link>
    </div>
  );
}
