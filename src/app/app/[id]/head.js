export default async function Head({ params }) {
  // Dynamic metadata for individual app pages
  // This will be fetched when the page loads
  const appId = params.id;
  
  return (
    <>
      <title>App Details - Clipcade</title>
      <meta name="description" content="Discover and try this app on Clipcade" />
    </>
  );
}

