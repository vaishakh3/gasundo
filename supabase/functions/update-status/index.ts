import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Get Client IP for Rate Limiting
    const rawIp = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || 'unknown-ip'
    const clientIp = rawIp.split(',')[0].trim()

    // 2. Initialize Supabase Client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 3. Enforce Rate Limit via Database RPC (Isolate-safe)
    const { data: isAllowed, error: rateLimitError } = await supabaseClient.rpc(
      'check_rate_limit',
      { client_ip: clientIp }
    )

    if (rateLimitError) {
      console.error('Rate limit check failed:', rateLimitError)
      throw rateLimitError
    }

    if (!isAllowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`)
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 4. Parse Request Body
    const body = await req.json()
    const { action, payload } = body

    if (!action || !payload) {
      throw new Error('Missing action or payload in request body')
    }

    // 5. Handle Actions
    if (action === 'insert_status') {
      const { restaurant_name, lat, lng, status, note } = payload
      
      const { data, error } = await supabaseClient
        .from('restaurant_status')
        .insert([{ restaurant_name, lat, lng, status, note, confirmations: 1 }])
        .select()

      if (error) throw error

      return new Response(JSON.stringify(data[0]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } 
    
    else if (action === 'confirm_status') {
      const { statusId } = payload
      
      const { data, error } = await supabaseClient
        .rpc('increment_confirmations', { status_id: statusId })

      if (error) {
         // Fallback manual increment (if RPC fails)
         const { data: current } = await supabaseClient
           .from('restaurant_status')
           .select('confirmations')
           .eq('id', statusId)
           .single()
           
         const newCount = (current?.confirmations || 0) + 1
         
         const { data: updated, error: updateError } = await supabaseClient
            .from('restaurant_status')
            .update({ confirmations: newCount })
            .eq('id', statusId)
            .select()
            
         if (updateError) throw updateError
         
         return new Response(JSON.stringify(updated[0]), {
           headers: { ...corsHeaders, 'Content-Type': 'application/json' },
           status: 200,
         })
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    
    else {
      throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Edge Function Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
