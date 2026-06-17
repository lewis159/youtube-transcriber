import { redirect } from 'next/navigation'

// The audit log has been consolidated under Security. The AuditLogTable
// component in this folder is still used (imported by the Security page);
// only this route is a redirect so old links land on the right tab.
export default function AuditLogPage() {
  redirect('/admin/security?tab=audit')
}
