import { type FC, useEffect, useState } from "react";

type InstallState = {
  isIOS: boolean;
  isStandalone: boolean;
};

const DEFAULT_INSTALL_STATE: InstallState = { isIOS: false, isStandalone: false };

const InstallPrompt: FC = () => {
  const [installState, setInstallState] = useState<InstallState>(DEFAULT_INSTALL_STATE);

  useEffect(() => {
    // react-doctor-disable-next-line react-hooks-js/set-state-in-effect, react-doctor/rendering-hydration-no-flicker -- iOS/standalone-mode detection needs navigator/window, only available after mount
    setInstallState({
      // biome-ignore lint/suspicious/noExplicitAny: window can be any type
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream,
      isStandalone: window.matchMedia("(display-mode: standalone)").matches,
    });
  }, []);

  if (installState.isStandalone) {
    return null;
  }

  if (installState.isIOS) {
    return (
      <div>
        <h3>Install App to Enable Push Notifications</h3>
        <p>
          To install this app on your iOS device, tap the share button
          <span aria-label="share icon" role="img">
            {" "}
            ⎋{" "}
          </span>
          and then "Add to Home Screen"
          <span aria-label="plus icon" role="img">
            {" "}
            ➕{" "}
          </span>
          .
        </p>
      </div>
    );
  }

  return <p>Push notifications are not supported in this browser.</p>;
};

export default InstallPrompt;
