import { redirect } from 'next/navigation'

// Onboarding is no longer needed in the new model.
// Users join trips directly without needing a family/group.
export default async function OnboardingPage() {
  redirect('/dashboard')
}
