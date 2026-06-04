// happy-dom defines a `nodeName` getter on Node.prototype that unconditionally
// returns "" (the real value lives on each subclass, e.g. Element.prototype
// returns the tag name). DOMPurify hardens itself against prototype clobbering
// by caching `lookupGetter(Node.prototype, "nodeName")` at import time and
// using it for every element's tag-name lookup. Because that walk starts at
// Node.prototype, it grabs happy-dom's empty-string getter, so DOMPurify reads
// every element's name as "" — no tag is in ALLOWED_TAGS, and every element is
// stripped to its text content (e.g. sanitize("<p>hi</p>") === "hi").
//
// Under vitest 3 this never bit us: DOM globals were not installed when the
// dompurify module first evaluated, so `Node` was undefined and DOMPurify set
// its cached getter to null, falling back to the (correct) instance accessor.
// vitest 4 installs the happy-dom globals before module evaluation, so `Node`
// is present and the broken getter gets cached.
//
// The fix re-points Node.prototype's getter at the subclass getter that
// applies to the receiver. Each concrete subclass (Element, Text, Comment,
// Document, ...) defines its own `nodeName`; we walk the receiver's prototype
// chain past Node.prototype to the nearest subclass getter and delegate to it,
// so both DOMPurify's cached lookup and direct access return the real name.
// Deleting the getter outright is not viable: happy-dom's own selector engine
// reads Node.prototype.nodeName for non-element nodes and relies on the
// empty-string base value. This is a test-environment shim only; real browsers
// return the correct value from Node.prototype.nodeName and need no shim.
const baseDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, "nodeName");
if (baseDescriptor && baseDescriptor.get && Node.prototype.nodeName === "") {
  Object.defineProperty(Node.prototype, "nodeName", {
    configurable: true,
    get(this: Node) {
      let proto = Object.getPrototypeOf(this);
      while (proto && proto !== Node.prototype) {
        const descriptor = Object.getOwnPropertyDescriptor(proto, "nodeName");
        if (descriptor && descriptor.get) {
          return descriptor.get.call(this);
        }
        proto = Object.getPrototypeOf(proto);
      }
      return baseDescriptor.get!.call(this);
    },
  });
}
