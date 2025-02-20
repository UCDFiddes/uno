import { createPortal } from "react-dom";

interface PortalProps {
  children: React.ReactNode;
}
// A helper component that takes in a element and will render it at the body level so it appears on top of everything else.
export default function Portal({ children }: PortalProps) {
  const container = document.getElementById("portal") || document.body;
  return createPortal(children, container);
}
