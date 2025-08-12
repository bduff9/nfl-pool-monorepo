import { type FC, useEffect, useState } from "react";

const InstallPrompt: FC = () => {
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    setIsIOS(
      // biome-ignore lint/suspicious/noExplicitAny: window can be any type
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream,
    );

    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  if (isStandalone) {
    return null;
  }

  if (isIOS) {
    return (
      <div>
        <h3>Install App</h3>
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

  return null;
};

export default InstallPrompt;
