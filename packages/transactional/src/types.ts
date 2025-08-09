import type { FC } from "react";

export type Email<Props> = FC<
  {
    browserLink: string;
    unsubscribeLink: string;
  } & Props
> & { PreviewProps: Parameters<Email<Props>>[0] };
