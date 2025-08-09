import { Body, Tailwind } from "@react-email/components";
// biome-ignore lint/style/useImportType: This is needed for react-email
import * as React from "react";

type Props = {
  children: React.ReactNode;
};

const BodyWrapper: React.FC<Props> = ({ children }) => {
  return (
    <Tailwind
      config={{
        theme: {
          fontSize: {
            "2xl": ["24px", { lineHeight: "32px" }],
            "3xl": ["30px", { lineHeight: "36px" }],
            "4xl": ["36px", { lineHeight: "36px" }],
            "5xl": ["48px", { lineHeight: "1" }],
            "6xl": ["60px", { lineHeight: "1" }],
            "7xl": ["72px", { lineHeight: "1" }],
            "8xl": ["96px", { lineHeight: "1" }],
            "9xl": ["144px", { lineHeight: "1" }],
            base: ["16px", { lineHeight: "24px" }],
            lg: ["18px", { lineHeight: "28px" }],
            sm: ["14px", { lineHeight: "20px" }],
            xl: ["20px", { lineHeight: "28px" }],
            xs: ["12px", { lineHeight: "16px" }],
          },
          spacing: {
            0: "0",
            0.5: "2px",
            1: "4px",
            1.5: "6px",
            2: "8px",
            2.5: "10px",
            3: "12px",
            3.5: "14px",
            4: "16px",
            5: "20px",
            6: "24px",
            7: "28px",
            8: "32px",
            9: "36px",
            10: "40px",
            11: "44px",
            12: "48px",
            14: "56px",
            16: "64px",
            20: "80px",
            24: "96px",
            28: "112px",
            32: "128px",
            36: "144px",
            40: "160px",
            44: "176px",
            48: "192px",
            52: "208px",
            56: "224px",
            60: "240px",
            64: "256px",
            72: "288px",
            80: "320px",
            96: "384px",
            px: "1px",
          },
        },
      }}
    >
      <Body className="m-0 bg-gray-100" style={{ fontFamily: "Roboto, Helvetica, Arial, sans-serif" }}>
        {children}
      </Body>
    </Tailwind>
  );
};

export default BodyWrapper;
