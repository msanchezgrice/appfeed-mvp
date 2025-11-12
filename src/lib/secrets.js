// Helper functions for working with encrypted secrets
import { createServerSupabaseClient } from './supabase-server';

/**
 * Get decrypted API key for a user and provider
 * Only use server-side in API routes!
 * @param {string} userId - Clerk user ID
 * @param {string} provider - Provider name ('openai', 'anthropic', etc)
 * @param {object} supabase - Optional Supabase client (pass from runner context)
 * @returns {Promise<string|null>} - Decrypted API key or null
 */
export async function getDecryptedSecret(userId, provider, supabase = null) {
  try {
    // Use provided supabase client or create new one
    const sb = supabase || (await createServerSupabaseClient()).supabase;
    
    // Call Supabase Vault function to decrypt
    const { data, error } = await sb.rpc('get_decrypted_secret', {
      p_user_id: userId,
      p_provider: provider
    });
    
    if (error) {
      console.error(`Error getting secret for ${provider}:`, error);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log(`No secret found for user ${userId}, provider ${provider}`);
      return null;
    }
    
    return data[0].api_key;
  } catch (error) {
    console.error('Error in getDecryptedSecret:', error);
    return null;
  }
}

/**
 * Check if user has a valid secret for a provider (without decrypting)
 * @param {string} userId - Clerk user ID
 * @param {string} provider - Provider name
 * @returns {Promise<boolean>}
 */
export async function hasSecret(userId, provider) {
  try {
    const { supabase } = await createServerSupabaseClient();
    
    const { data, error } = await supabase.rpc('has_secret', {
      p_user_id: userId,
      p_provider: provider
    });
    
    if (error) {
      console.error(`Error checking secret for ${provider}:`, error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error in hasSecret:', error);
    return false;
  }
}

/**
 * Get all user's secrets (metadata only, not decrypted)
 * @param {string} userId - Clerk user ID
 * @returns {Promise<Array>}
 */
export async function getUserSecrets(userId) {
  try {
    const { supabase } = await createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('secrets')
      .select('provider, key_name, is_valid, last_used_at, created_at')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error getting user secrets:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getUserSecrets:', error);
    return [];
  }
}
