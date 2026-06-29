import { FOOTER_HTML } from "./footer.ts";

export function Footer() {
  return <footer dangerouslySetInnerHTML={{ __html: FOOTER_HTML }} />;
}
