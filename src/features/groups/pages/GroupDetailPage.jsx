import { Navigate, useParams } from "react-router-dom";
import { useApp } from "../../../context/AppContext";
import GroupWorkspace from "../components/GroupWorkspace/GroupWorkspace";

function GroupDetailPage() {
  const { user } = useApp();
  const { groupId } = useParams();
  if (!user) return <Navigate to="/signin" replace />;
  return <GroupWorkspace groupId={groupId} />;
}

export default GroupDetailPage;
