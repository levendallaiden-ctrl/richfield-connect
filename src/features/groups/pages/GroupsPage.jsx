import { Navigate } from "react-router-dom";
import { useApp } from "../../../context/AppContext";
import GroupExplorer from "../components/GroupExplorer/GroupExplorer";

function GroupsPage() {
  const { user } = useApp();
  if (!user) return <Navigate to="/signin" replace />;
  return <GroupExplorer />;
}

export default GroupsPage;
