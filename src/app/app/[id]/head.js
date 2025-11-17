import { createAdminSupabaseClient } from '@/src/lib/supabase-server';

export default async function Head({ params }) {
  const supabase = createAdminSupabaseClient();
  const id = params?.id;
  let app = null;
  try {
    const { data } = await supabase
      .from('apps')
      .select('id, name, description, preview_url, preview_gradient')
      .eq('id', id)
      .single();
    app = data || null;
  } catch {}
  const rtype = app?.runtime?.render_type || null;
  const friendly = rtype === 'wordle'
    ? 'Play today’s themed Wordle on Clipcade.'
    : rtype === 'flappy'
    ? 'Beat your high score in Flappy Mini.'
    : rtype === 'chat'
    ? 'Chat live with a mood-based agent.'
    : null;
  const title = app?.name ? `${app.name} • Clipcade` : 'Clipcade App';
  const desc = friendly || app?.description || 'Run & remix mini-apps on Clipcade.';
  const img = app?.preview_url || undefined;
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={desc} />
      {img ? <meta property="og:image" content={img} /> : null}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      {img ? <meta name="twitter:image" content={img} /> : null}
    </>
  );
}


