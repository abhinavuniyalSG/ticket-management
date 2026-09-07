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
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition-all duration-150 hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-600/25 active:scale-[0.98]"
          >
            Go to home
          </Link>
        }
      />
    </PageContainer>
  );
}
