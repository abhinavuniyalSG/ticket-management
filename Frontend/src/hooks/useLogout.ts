import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "./useAuth";

export function useLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } finally {
      navigate("/login", { replace: true });
    }
  };
}
