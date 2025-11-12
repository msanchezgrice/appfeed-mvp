'use client';
import Link from 'next/link';
import { SignInButton, SignUpButton, UserButton, useUser, SignedIn, SignedOut } from '@clerk/nextjs';

export default function Navbar() {
  const { user } = useUser();

  return (
    <div className="nav">
      <Link href="/" className="row" style={{gap:8}}>
        <img src="/logo.svg" width={28} height={28} alt="logo" />
        <strong>Clipcade</strong>
      </Link>
      <div className="row" style={{gap:6}}>
        <Link className="btn ghost" href="/">Feed</Link>
        <Link className="btn ghost" href="/search">Search</Link>
        <SignedIn>
          <Link className="btn ghost" href="/library">Library</Link>
          <Link className="btn ghost" href="/secrets">Secrets</Link>
          <Link className="btn ghost" href="/profile">Profile</Link>
          <Link className="btn ghost" href="/publish">Publish</Link>
        </SignedIn>
      </div>
      <div className="spacer" />
      <div className="row" style={{gap:12}}>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="btn ghost">Sign In</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="btn primary">Sign Up</button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <span className="small" style={{opacity: 0.7}}>
            {user?.primaryEmailAddress?.emailAddress || user?.username}
          </span>
          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-8 h-8"
              }
            }}
          />
        </SignedIn>
      </div>
    </div>
  );
}
