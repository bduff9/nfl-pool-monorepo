"use client";

import { useRouter } from "next/navigation";
import { type FC, type FormEvent, useEffect, useRef } from "react";
import { debounce } from "throttle-debounce";

import FloatingLabelInput from "../FloatingLabelInput/FloatingLabelInput";

type Props = {
  currentQuery: string;
};

const SupportSearch: FC<Props> = ({ currentQuery }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!window) {
      return;
    }

    const hash = window.location.hash;
    const id = hash.startsWith("#") ? hash.slice(1) : hash;

    if (!id) {
      return;
    }

    const element = document.getElementById(id);

    if (!element) {
      return;
    }

    const timer = window.setTimeout(() => {
      element.scrollIntoView({ behavior: "smooth" });
    }, 100);

    return () => window.clearTimeout(timer);
  }, []);

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
