import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSupabaseAuth } from "../integrations/supabase/auth";
import DsrBox from "../components/DsrBox";
import DsrForm from "../components/DsrForm";
import DsrList from "../components/DsrList";

const Index = () => {
  const { session } = useSupabaseAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <img src="/company-logo.png" alt="Company Logo" className="mx-auto object-contain w-32 h-32 mb-4" />
          <h1 className="text-4xl font-bold mb-4 dark:text-white">Welcome to DSR Tracking Application</h1>
          <p className="text-xl mb-8 dark:text-gray-300">Streamline your logistics operations</p>
        </div>

        {session ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {session.user.user_type !== 'Guest' && (
                <DsrBox title="Create New DSR">
                  <DsrForm />
                </DsrBox>
              )}
              {session.user.user_type === 'TSV-Admin' && (
                <>
                  <DsrBox title="Admin Actions">
                    <div className="space-y-4">
                      <Button asChild className="w-full" variant="outline">
                        <Link to="/manage-organizations">Manage Organizations</Link>
                      </Button>
                      <Button asChild className="w-full" variant="outline">
                        <Link to="/create-user">Create User</Link>
                      </Button>
                    </div>
                  </DsrBox>
                </>
              )}
            </div>
            <DsrBox title="DSR List" className="w-full">
              <DsrList />
            </DsrBox>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Index;
