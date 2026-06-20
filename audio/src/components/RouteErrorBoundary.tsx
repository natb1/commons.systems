import { Component, type ReactNode } from "react";
import { classifyError } from "@commons-systems/errorutil/classify";

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  error: unknown;
}

/**
 * Route-level error boundary (ports main.ts:98-102's formatError). Catches a
 * data-integrity error thrown during render (e.g. Home re-throwing a
 * DataIntegrityError) and shows the support message; any other error is
 * re-thrown to propagate. Error boundaries must be class components.
 */
export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: unknown): RouteErrorBoundaryState {
    return { error };
  }

  render(): ReactNode {
    const { error } = this.state;
    if (error !== null) {
      if (classifyError(error) === "data-integrity") {
        return <p>A data error occurred. Please contact support.</p>;
      }
      throw error;
    }
    return this.props.children;
  }
}
