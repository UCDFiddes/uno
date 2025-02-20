import { useEffect, useRef } from "react";

// A helper hook to detect when a user clicks outside of a element.
export default function useOutsideAlerter(handler: () => void): React.RefObject<HTMLElement> {
  // A reference to an element that we want to detect clicks outside of.
  const ref = useRef<HTMLElement>(null!);

  // Event listeners to detect when a user clicks outside of the element.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // If the element is clicked outside of the reference element then call the handler.
      if (ref.current && !ref.current.contains(event.target as Node)) handler();
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, handler]);

  return ref;
}
