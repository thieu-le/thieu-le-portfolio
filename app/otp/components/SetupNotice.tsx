import { Database } from "lucide-react";

export default function SetupNotice() {
  return (
    <div className="otp-panel otp-empty">
      <Database size={23} aria-hidden />
      <h1 className="text-xl font-semibold">Stats aren’t connected yet</h1>
      <span>
        Set <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> to show one-trick stats.
        See <code>collector/README.md</code> for setup.
      </span>
    </div>
  );
}
