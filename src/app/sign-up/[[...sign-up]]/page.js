import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '20px'
    }}>
      <h1 style={{ marginBottom: '32px', fontSize: '2rem', fontWeight: 'bold' }}>
        Join AppFeed
      </h1>
      <SignUp 
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-lg'
          }
        }}
      />
    </div>
  );
}
