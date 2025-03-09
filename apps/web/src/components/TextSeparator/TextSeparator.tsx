import type { FC, ReactNode } from "react";

type Props = {
  children: ReactNode;
};

const TextSeparator: FC<Props> = ({ children }) => (
  <div className="flex items-center text-center before:border-b before:border-gray-300 before:flex-1 before:mr-8 after:border-b after:border-gray-300 after:flex-1 after:ml-8">
    {children}
  </div>
);

export default TextSeparator;
