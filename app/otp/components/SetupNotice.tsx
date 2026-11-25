export default function SetupNotice() {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 max-w-2xl">
      <h1 className="text-xl font-semibold mb-2">Not connected yet</h1>
      <p className="text-zinc-400 text-sm">
        Set <code className="text-amber-300">SUPABASE_URL</code> and{" "}
        <code className="text-amber-300">SUPABASE_ANON_KEY</code> to show one-trick stats. See{" "}
        <code>collector/README.md</code> for the full setup.
      </p>
    </div>
  );
}
