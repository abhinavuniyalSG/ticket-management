import { Link } from "react-router-dom";
import { PageContainer } from "../components/layout/PageContainer";
import { EmptyState } from "../components/molecules/EmptyState";

export function UnauthorizedPage() {
  return (
    <PageContainer>
      <EmptyState
        title="You don't have access to this page"
        description="Your account role doesn't have permission to view this section."
        action={
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Go to home
          </Link>
        }
      />
    </PageContainer>
  );
}
