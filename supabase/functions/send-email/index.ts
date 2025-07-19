import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { PasswordResetEmail } from './_templates/password-reset.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('not allowed', { status: 400 })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  const wh = new Webhook(hookSecret)
  
  try {
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: {
        email: string
      }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        email_action_type: string
        site_url: string
        token_new: string
        token_hash_new: string
      }
    }

    let html: string
    let subject: string

    // Handle different email types
    if (email_action_type === 'recovery') {
      html = await renderAsync(
        React.createElement(PasswordResetEmail, {
          supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
          token,
          token_hash,
          redirect_to,
          email_action_type,
        })
      )
      subject = 'Reset Your Password - OpCoder'
    } else {
      // Default fallback for other email types
      html = `
        <h1>OpCoder Authentication</h1>
        <p>Click <a href="${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}">here</a> to continue.</p>
        <p>Or use this code: ${token}</p>
      `
      subject = 'OpCoder Authentication'
    }

    const { error } = await resend.emails.send({
      from: 'OpCoder <onboarding@resend.dev>',
      to: [user.email],
      subject,
      html,
    })
    
    if (error) {
      throw error
    }
  } catch (error) {
    console.log('Email sending error:', error)
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code,
          message: error.message,
        },
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  const responseHeaders = new Headers()
  responseHeaders.set('Content-Type', 'application/json')
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: responseHeaders,
  })
})