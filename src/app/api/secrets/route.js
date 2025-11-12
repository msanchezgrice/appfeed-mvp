import { createServerSupabaseClient } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get list of secrets (metadata only, not decrypted)
    const { data: secrets, error } = await supabase
      .from('secrets')
      .select('provider, key_name, is_valid, last_used_at')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching secrets:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch secrets' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Transform to status format expected by frontend
    const providers = {};
    secrets?.forEach(s => {
      providers[s.provider] = s.is_valid ? 'present' : 'invalid';
    });

    // Return status (keys are NOT decrypted here for security)
    return new Response(JSON.stringify({
      providers: {
        openai: providers.openai || 'missing',
        anthropic: providers.anthropic || 'missing',
        gemini: providers.gemini || 'missing'
      }
    }), { 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (e) {
    console.error('Secrets GET error:', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();

    // Handle format from profile settings page (key + value)
    let provider = '';
    let apiKey = '';
    let keyName = '';

    if (body.key && body.value) {
      if (body.key === 'OPENAI_API_KEY') {
        provider = 'openai';
        keyName = 'OpenAI API Key';
      } else if (body.key === 'ANTHROPIC_API_KEY') {
        provider = 'anthropic';
        keyName = 'Anthropic API Key';
      } else if (body.key === 'GEMINI_API_KEY') {
        provider = 'gemini';
        keyName = 'Google Gemini API Key';
      } else {
        return new Response(JSON.stringify({ error: 'Unsupported API key type' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      apiKey = body.value;
    } 
    // Handle legacy format (provider + apiKey)
    else if (body.provider && body.apiKey) {
      provider = body.provider;
      apiKey = body.apiKey;
      keyName = `${provider.charAt(0).toUpperCase() + provider.slice(1)} API Key`;
    } else {
      return new Response(JSON.stringify({ error: 'Invalid request format' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate provider
    if (!['openai', 'anthropic', 'gemini', 'replicate', 'github', 'custom'].includes(provider)) {
      return new Response(JSON.stringify({ error: 'Invalid provider' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Log the attempt
    console.log('[Secrets POST] Attempting to save:', {
      userId,
      provider,
      keyName,
      keyLength: apiKey?.length
    });

    // Check if profile exists, create if not (handles case where webhook hasn't synced yet)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (!profile) {
      console.log('[Secrets POST] Profile not found, creating...');
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          clerk_user_id: userId,
          username: `user_${userId.slice(-8)}`,
          email: null,
          display_name: 'User'
        });
      
      if (profileError) {
        console.error('[Secrets POST] Failed to create profile:', profileError);
        return new Response(JSON.stringify({ 
          error: 'Profile not found. Please complete sign-up first or contact support.',
          details: profileError.message
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      console.log('[Secrets POST] Profile created successfully');
    }

    // Use Supabase Vault function to securely store encrypted key
    const { data, error } = await supabase.rpc('upsert_secret', {
      p_user_id: userId,
      p_provider: provider,
      p_api_key: apiKey,
      p_key_name: keyName
    });

    if (error) {
      console.error('[Secrets POST] Error upserting secret:', error);
      console.error('[Secrets POST] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return new Response(JSON.stringify({ 
        error: 'Failed to save secret',
        details: error.message,
        hint: error.hint
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('[Secrets POST] Successfully saved secret:', data);

    return new Response(JSON.stringify({ ok: true, secretId: data }), { 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (e) {
    console.error('Secrets POST error:', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider');

    if (!provider) {
      return new Response(JSON.stringify({ error: 'Provider required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete secret
    const { data, error } = await supabase.rpc('delete_secret', {
      p_user_id: userId,
      p_provider: provider
    });

    if (error) {
      console.error('Error deleting secret:', error);
      return new Response(JSON.stringify({ error: 'Failed to delete secret' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ ok: true, deleted: data }), { 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (e) {
    console.error('Secrets DELETE error:', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
