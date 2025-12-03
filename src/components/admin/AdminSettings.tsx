export default function AdminSettings() {
  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="border rounded-xl p-6 bg-white">
          <h2 className="font-semibold mb-2">Feature Flags</h2>
          <p className="text-sm text-gray-600">Manage experimental features (placeholder).</p>
        </div>
        <div className="border rounded-xl p-6 bg-white">
          <h2 className="font-semibold mb-2">Email Templates</h2>
          <p className="text-sm text-gray-600">Configure transactional emails (placeholder).</p>
        </div>
      </div>
    </div>
  );
}

