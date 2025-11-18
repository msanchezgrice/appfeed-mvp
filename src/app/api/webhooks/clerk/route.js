import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { createAdminSupabaseClient } from '@/src/lib/supabase-server';
import { track } from '@vercel/analytics/server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  // Get the Svix headers for verification
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return new Response('Webhook secret not configured', { status: 500 });
  }
  
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');
  
  // If there are no Svix headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }
  
  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);
  
  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);
  
  let evt;
  
  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }
  
  // Handle the webhook
  const { id } = evt.data;
  const eventType = evt.type;
  
  console.log(`Webhook received: ${eventType} for user ${id}`);
  
  // Get admin Supabase client (bypasses RLS)
  const supabase = createAdminSupabaseClient();
  
  try {
    if (eventType === 'user.created') {
      const { 
        id, 
        username, 
        first_name, 
        last_name, 
        email_addresses, 
        image_url 
      } = evt.data;
      
      // Create profile in Supabase
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: id,
          clerk_user_id: id,
          username: username || `user_${id.slice(5, 13)}`,
          email: email_addresses?.[0]?.email_address,
          display_name: [first_name, last_name].filter(Boolean).join(' ') || username || `User ${id.slice(5, 13)}`,
          avatar_url: image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
        });
      
      if (error) {
        console.error('Error creating profile:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
      
      console.log('Profile created successfully:', data);
      
      // Track signup event for analytics (server-side)
      try {
        await track('user_signed_up', {
          user_id: id,
          email: email_addresses?.[0]?.email_address,
          username: username,
          display_name: [first_name, last_name].filter(Boolean).join(' ') || username,
        });
      } catch (err) {
        console.error('[Analytics] Failed to track signup:', err);
      }
    }
    
    if (eventType === 'user.updated') {
      const { 
        id, 
        username, 
        first_name, 
        last_name, 
        email_addresses, 
        image_url 
      } = evt.data;
      
      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username,
          email: email_addresses?.[0]?.email_address,
          display_name: [first_name, last_name].filter(Boolean).join(' ') || username,
          avatar_url: image_url,
        })
        .eq('clerk_user_id', id);
      
      if (error) {
        console.error('Error updating profile:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
      
      console.log('Profile updated successfully');
    }
    
    if (eventType === 'user.deleted') {
      const { id } = evt.data;
      
      // Delete profile from Supabase (cascades to all related data)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('clerk_user_id', id);
      
      if (error) {
        console.error('Error deleting profile:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
      
      console.log('Profile deleted successfully');
    }
    
    return new Response('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
