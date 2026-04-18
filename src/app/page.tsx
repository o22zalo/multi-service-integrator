// Path: /src/app/page.tsx
// Module: Home Redirect Page
// Depends on: next/navigation
// Description: Redirects the root route to the protected dashboard.

import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/dashboard')
}
