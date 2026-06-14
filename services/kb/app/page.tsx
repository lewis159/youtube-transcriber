export default function KBHome() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-white mb-4">Knowledge Base</h1>
        <p className="text-[#888] mb-8">
          Welcome to the YouTube Transcriber Knowledge Base. This service is currently under development.
        </p>

        <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Coming Soon</h2>
          <p className="text-[#E2E2E8] mb-4">
            The Knowledge Base is now running as an independent microservice. Articles and documentation will be available shortly.
          </p>
          <ul className="list-disc list-inside text-[#888] space-y-2">
            <li>Setup & Installation</li>
            <li>User Management</li>
            <li>API Documentation</li>
            <li>Organization Management</li>
            <li>System Administration</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
