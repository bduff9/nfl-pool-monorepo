import { getCurrentSession } from "@/server/loaders/sessions";

import LogRocketBoot from "./LogRocketBoot";

const LogRocketGate = async () => {
  const { user } = await getCurrentSession();

  return <LogRocketBoot user={user} />;
};

export default LogRocketGate;
