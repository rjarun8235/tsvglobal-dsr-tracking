import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSupabaseAuth } from "../integrations/supabase/auth";
import { SupabaseAuthUI } from "../integrations/supabase/auth";
import DsrBox from "../components/DsrBox";

const Index = () => {
  const { session } = useSupabaseAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <img src="/tsv-logo.png" alt="TSV Global Solutions Logo" className="mx-auto object-contain w-32 h-32 mb-4" />
          <h1 className="text-4xl font-bold mb-4">Welcome to DSR Tracking Application</h1>
          <p className="text-xl mb-8">Streamline your logistics with TSV Global Solutions</p>
        </div>

        {session ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DsrBox title="Recent DSRs">
              <p>Your recent DSRs will appear here.</p>
            </DsrBox>
            <DsrBox title="Quick Actions">
              <Button asChild className="w-full mb-2">
                <Link to="/create-user">Create New DSR</Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link to="/manage-organizations">Manage Organizations</Link>
              </Button>
            </DsrBox>
            <DsrBox title="Statistics">
              <p>DSR statistics and metrics will be displayed here.</p>
            </DsrBox>
          </div>
        ) : (
          <div className="w-full max-w-md mx-auto">
            <DsrBox title="Login">
              <SupabaseAuthUI />
            </DsrBox>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
