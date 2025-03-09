"use client";
import { useRouter } from "next/navigation";
import { type FC, type FormEvent, useRef } from "react";
import { debounce } from "throttle-debounce";

import FloatingLabelInput from "../FloatingLabelInput/FloatingLabelInput";

type Props = {
  currentQuery: string;
};

const SupportSearch: FC<Props> = ({ currentQuery }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const q = inputRef.current?.value ?? "";
    const url = `/support${q ? `?q=${encodeURIComponent(q)}` : ""}`;

    router.push(url);
  };

  const search = debounce(750, handleSubmit);

  return (
    <form onChange={search} onSubmit={handleSubmit}>
      <FloatingLabelInput
        autoComplete="off"
        defaultValue={currentQuery}
        id="q"
        key="search"
        label="Search the help page"
        name="q"
        ref={inputRef}
        title="Search the help page"
        type="search"
      />
      <button className="hidden" type="submit">
        Search
      </button>
    </form>
  );
};

export default SupportSearch;
