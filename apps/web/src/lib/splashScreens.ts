type Device = { height: number; isTablet?: boolean; pixelRatio: number; width: number };

// CSS-pixel sizes (always portrait) of the iPhones and iPads that can install the app; iOS picks the launch screen whose
// media query matches the device
const DEVICES: Array<Device> = [
  { height: 956, pixelRatio: 3, width: 440 },
  { height: 874, pixelRatio: 3, width: 402 },
  { height: 932, pixelRatio: 3, width: 430 },
  { height: 852, pixelRatio: 3, width: 393 },
  { height: 926, pixelRatio: 3, width: 428 },
  { height: 844, pixelRatio: 3, width: 390 },
  { height: 812, pixelRatio: 3, width: 375 },
  { height: 896, pixelRatio: 3, width: 414 },
  { height: 896, pixelRatio: 2, width: 414 },
  { height: 736, pixelRatio: 3, width: 414 },
  { height: 667, pixelRatio: 2, width: 375 },
  { height: 1376, isTablet: true, pixelRatio: 2, width: 1032 },
  { height: 1366, isTablet: true, pixelRatio: 2, width: 1024 },
  { height: 1210, isTablet: true, pixelRatio: 2, width: 834 },
  { height: 1194, isTablet: true, pixelRatio: 2, width: 834 },
  { height: 1180, isTablet: true, pixelRatio: 2, width: 820 },
  { height: 1112, isTablet: true, pixelRatio: 2, width: 834 },
  { height: 1080, isTablet: true, pixelRatio: 2, width: 810 },
  { height: 1024, isTablet: true, pixelRatio: 2, width: 768 },
];

type Orientation = "landscape" | "portrait";

type SplashScreen = { height: number; media: string; name: string; url: string; width: number };

const toSplashScreen = ({ height, pixelRatio, width }: Device, orientation: Orientation): SplashScreen => {
  const isPortrait = orientation === "portrait";
  const pixelWidth = (isPortrait ? width : height) * pixelRatio;
  const pixelHeight = (isPortrait ? height : width) * pixelRatio;
  const name = `apple-splash-${pixelWidth}x${pixelHeight}`;

  return {
    height: pixelHeight,
    // device-width and device-height are the portrait size in both orientations
    media: `(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${pixelRatio}) and (orientation: ${orientation})`,
    name,
    url: `/splash/${name}.png`,
    width: pixelWidth,
  };
};

// Phones launch in portrait only; tablets can launch either way up
export const splashScreens: Array<SplashScreen> = DEVICES.flatMap((device) =>
  device.isTablet
    ? [toSplashScreen(device, "portrait"), toSplashScreen(device, "landscape")]
    : [toSplashScreen(device, "portrait")],
);
