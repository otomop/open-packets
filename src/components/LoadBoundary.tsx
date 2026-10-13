import { Component, type ReactNode } from "react";

export function LoadingContent() {
  return <div className="panel" role="status" aria-live="polite">Loading your study material…</div>;
}

/** Keep a missing/outdated local asset from taking away navigation or saved progress. */
export class LoadBoundary extends Component<{children: ReactNode}, {failed: boolean}> {
  state = {failed: false};
  static getDerivedStateFromError() { return {failed: true}; }
  render() {
    if (this.state.failed) return <div className="page narrow" role="alert"><h1 className="display">Couldn’t open this page.</h1><p>Make sure the local app is running, then reload. Your saved progress stays in this browser.</p><button type="button" className="btn" onClick={() => window.location.reload()}>Reload the app</button></div>;
    return this.props.children;
  }
}
